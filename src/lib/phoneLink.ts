"use client";

/**
 * Dashboard side of the phone camera: waits for a phone to call in with its camera stream.
 *
 * How the pairing works:
 * - The dashboard registers on the PeerJS pairing server under an id made from the 6-digit code.
 * - The phone opens /cam/<code>, starts its camera and "calls" that id with the video (WebRTC).
 * - The video then flows directly phone → dashboard (or through a TURN relay if needed), encrypted.
 *
 * One receiver per pairing code lives for the whole browser session, so the live view and the
 * zone editor share the same stream while you move between pages.
 */
import type { MediaConnection, Peer as PeerInstance } from "peerjs";
import { useSyncExternalStore } from "react";
import { getIceServers } from "./ice";
import { dashboardPeerId } from "./pairing";

export type LinkStatus = "starting" | "waiting" | "connected" | "error";

export interface LinkState {
  code: string;
  status: LinkStatus;
  stream: MediaStream | null;
  /** True when a TURN relay is configured (helps on mobile data). */
  relay: boolean;
  error: string | null;
  connectedAt: number | null;
}

const RETRY_MS = 3000;

function friendlyError(type: string): string {
  switch (type) {
    case "network":
    case "server-error":
    case "socket-error":
    case "socket-closed":
      return "Can't reach the pairing server. Check this computer's internet connection; retrying…";
    case "browser-incompatible":
      return "This browser doesn't support live video calls. Use Chrome, Edge or Safari.";
    case "ssl-unavailable":
      return "The site must be opened over https for the phone camera to work.";
    default:
      return "Pairing problem; retrying…";
  }
}

class PhoneReceiver {
  state: LinkState;
  private listeners = new Set<() => void>();
  private peer: PeerInstance | null = null;
  private call: MediaConnection | null = null;
  private retryTimer: number | null = null;
  private stopped = false;

  constructor(code: string) {
    this.state = { code, status: "starting", stream: null, relay: false, error: null, connectedAt: null };
    void this.start();
  }

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  private set(patch: Partial<LinkState>) {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((l) => l());
  }

  private scheduleRestart() {
    if (this.stopped) return;
    if (this.retryTimer) window.clearTimeout(this.retryTimer);
    this.retryTimer = window.setTimeout(() => void this.start(), RETRY_MS);
  }

  private async start() {
    this.peer?.destroy();
    const [{ Peer }, ice] = await Promise.all([import("peerjs"), getIceServers()]);
    if (this.stopped) return;

    const peer = new Peer(dashboardPeerId(this.state.code), { config: { iceServers: ice.servers } });
    this.peer = peer;
    this.set({ relay: ice.relay });

    peer.on("open", () => {
      if (!this.state.stream) this.set({ status: "waiting", error: null });
    });

    peer.on("call", (call) => {
      this.call?.close();
      this.call = call;
      call.answer(); // receive only: the dashboard sends no video back

      call.on("stream", (stream) => {
        this.set({ status: "connected", stream, connectedAt: Date.now(), error: null });
      });
      const lost = () => {
        if (this.call !== call) return;
        this.call = null;
        this.set({ status: "waiting", stream: null, connectedAt: null });
      };
      call.on("close", lost);
      call.on("error", lost);
      call.peerConnection?.addEventListener("connectionstatechange", () => {
        const s = call.peerConnection.connectionState;
        if (s === "failed" || s === "closed") lost();
      });
    });

    peer.on("disconnected", () => {
      // Lost the pairing server (not the video). Reconnect so a phone can call in again.
      if (!this.stopped && !peer.destroyed) peer.reconnect();
    });

    peer.on("error", (err) => {
      if (this.stopped) return;
      if (err.type === "unavailable-id") {
        // The id is still held by a previous tab or session; it is released shortly.
        this.set({ status: "starting", error: "This pairing code is still in use in another tab; retrying…" });
        this.scheduleRestart();
        return;
      }
      if (err.type === "peer-unavailable") return; // not used on the dashboard side
      this.set({ status: this.state.stream ? "connected" : "error", error: friendlyError(err.type) });
      if (!this.state.stream) this.scheduleRestart();
    });
  }

  stop() {
    this.stopped = true;
    if (this.retryTimer) window.clearTimeout(this.retryTimer);
    this.call?.close();
    this.peer?.destroy();
    this.listeners.clear();
  }
}

const receivers = new Map<string, PhoneReceiver>();

function getReceiver(code: string): PhoneReceiver {
  let r = receivers.get(code);
  if (!r) {
    r = new PhoneReceiver(code);
    receivers.set(code, r);
  }
  return r;
}

/** Stop listening for a pairing code (on disconnect or when a new code is made). */
export function stopPhoneLink(code: string | null) {
  if (!code) return;
  receivers.get(code)?.stop();
  receivers.delete(code);
}

const noop = () => () => {};

/** Live state of the phone connection for a pairing code; null when no code is given. */
export function usePhoneLink(code: string | null): LinkState | null {
  return useSyncExternalStore(
    code ? (cb) => getReceiver(code).subscribe(cb) : noop,
    () => (code ? getReceiver(code).state : null),
    () => null,
  );
}

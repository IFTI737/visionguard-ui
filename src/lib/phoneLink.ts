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

/** starting → waiting (for a phone) → linking (phone found, video connecting) → connected. */
export type LinkStatus = "starting" | "waiting" | "linking" | "connected" | "error";

export interface LinkState {
  code: string;
  status: LinkStatus;
  stream: MediaStream | null;
  /** True when a TURN relay is configured (helps on mobile data). */
  relay: boolean;
  error: string | null;
  connectedAt: number | null;
  /** Phone calls that reached us but whose video never got through (network blocks direct video). */
  failures: number;
  /** How the video travels once live: straight from the phone, or through the TURN relay. */
  route: "direct" | "relay" | null;
}

/** True once video can actually flow (ICE finished), not just when the call was set up. */
function isUp(pc: RTCPeerConnection): boolean {
  return pc.connectionState === "connected" || pc.iceConnectionState === "connected" || pc.iceConnectionState === "completed";
}
/** Reads which network path the video uses (relay = went through the TURN server). */
async function readRoute(pc: RTCPeerConnection): Promise<"direct" | "relay" | null> {
  try {
    const stats = await pc.getStats();
    const byId = new Map<string, Record<string, unknown>>();
    stats.forEach((r) => byId.set(r.id, r as Record<string, unknown>));
    let pairId: string | undefined;
    byId.forEach((r) => {
      if (r.type === "transport" && typeof r.selectedCandidatePairId === "string") pairId = r.selectedCandidatePairId;
    });
    let pair = pairId ? byId.get(pairId) : undefined;
    if (!pair) {
      byId.forEach((r) => {
        if (r.type === "candidate-pair" && (r.selected === true || (r.nominated === true && r.state === "succeeded"))) pair = r;
      });
    }
    if (!pair) return null;
    const kinds = [pair.localCandidateId, pair.remoteCandidateId].map(
      (id) => byId.get(String(id))?.candidateType,
    );
    return kinds.includes("relay") ? "relay" : "direct";
  } catch {
    return null;
  }
}
function isFailed(pc: RTCPeerConnection): boolean {
  return pc.connectionState === "failed" || pc.iceConnectionState === "failed" || pc.connectionState === "closed";
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
    this.state = { code, status: "starting", stream: null, relay: false, error: null, connectedAt: null, failures: 0, route: null };
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
      const old = this.call;
      this.call = call; // set first, so the old call's "close" is ignored
      old?.close();
      call.answer(); // receive only: the dashboard sends no video back

      // The "stream" event fires as soon as the call is set up, before any video can flow.
      // Only show the video once the connection is really up, so the view doesn't flash a black frame.
      let remote: MediaStream | null = null;
      let live = false;
      this.set({ status: "linking", stream: null, connectedAt: null, error: null });

      const pc = call.peerConnection;
      const goLive = () => {
        if (this.call !== call || live || !remote || !isUp(pc)) return;
        live = true;
        this.set({ status: "connected", stream: remote, connectedAt: Date.now(), error: null, failures: 0, route: null });
        const refresh = async () => {
          if (this.call !== call) return;
          const route = await readRoute(pc);
          if (route && this.call === call) this.set({ route });
        };
        void refresh();
        setTimeout(refresh, 2000);
        setTimeout(refresh, 8000);
      };
      const lost = () => {
        if (this.call !== call) return;
        this.call = null;
        this.set({
          status: "waiting",
          stream: null,
          connectedAt: null,
          route: null,
          failures: live ? 0 : this.state.failures + 1,
        });
      };
      call.on("stream", (stream) => {
        remote = stream;
        goLive();
      });
      const onState = () => (isFailed(pc) ? lost() : goLive());
      pc?.addEventListener("connectionstatechange", onState);
      pc?.addEventListener("iceconnectionstatechange", onState);
      call.on("close", lost);
      call.on("error", lost);
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

"use client";

import { useParams } from "next/navigation";
import type { MediaConnection, Peer as PeerInstance } from "peerjs";
import { useEffect, useRef, useState } from "react";
import { Camera, CircleAlert, LoaderCircle, Radio, SwitchCamera, Square, Wifi } from "lucide-react";
import { LogoMark } from "@/components/layout/Logo";
import { getIceServers } from "@/lib/ice";
import { dashboardPeerId, formatCode, isPairingCode } from "@/lib/pairing";

type Phase = "intro" | "starting" | "running";
type Link = "connecting" | "waiting" | "live" | "reconnecting";
type Facing = "environment" | "user";

const RETRY_MS = 3000;
/** Cap on the video bitrate: plenty for detection, light on mobile data (~300 MB per hour at most). */
const MAX_BITRATE = 700_000;

function cameraConstraints(facing: Facing): MediaStreamConstraints {
  return {
    audio: false,
    video: {
      facingMode: { ideal: facing },
      width: { ideal: 640 },
      height: { ideal: 480 },
      frameRate: { ideal: 15, max: 20 },
    },
  };
}

function cameraError(err: unknown): string {
  const name = err instanceof DOMException ? err.name : "";
  if (name === "NotAllowedError" || name === "SecurityError")
    return "Camera permission was blocked. Allow camera access for this site in your browser settings, then try again.";
  if (name === "NotFoundError" || name === "OverconstrainedError") return "No camera was found on this device.";
  if (name === "NotReadableError") return "The camera is busy in another app. Close that app and try again.";
  return "Could not start the camera. Please try again.";
}

const LINK_TEXT: Record<Link, { title: string; detail: string }> = {
  connecting: { title: "Connecting…", detail: "Linking this phone to your dashboard. This can take up to 20 seconds." },
  waiting: {
    title: "Waiting for the dashboard",
    detail: "Keep the camera page with the QR code open on your computer. This phone connects automatically.",
  },
  live: { title: "Live on your dashboard", detail: "Your computer is receiving this camera. Keep this page open." },
  reconnecting: { title: "Reconnecting…", detail: "The connection dropped. Trying again automatically." },
};

/** The phone side: start the camera and stream it to the dashboard that shows the matching code. */
export function PhoneCamera() {
  const { code } = useParams<{ code: string }>();
  const valid = isPairingCode(code);

  const [phase, setPhase] = useState<Phase>("intro");
  const [link, setLink] = useState<Link>("connecting");
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facing, setFacing] = useState<Facing>("environment");
  const [switching, setSwitching] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const peerRef = useRef<PeerInstance | null>(null);
  const callRef = useRef<MediaConnection | null>(null);
  const retryRef = useRef<number | null>(null);
  const wakeRef = useRef<WakeLockSentinel | null>(null);
  const activeRef = useRef(false);

  // Show the camera preview.
  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = stream;
  }, [stream, phase]);

  // Keep the screen on while streaming; the lock is dropped when the page is hidden, so take it again.
  useEffect(() => {
    if (phase !== "running") return;
    const lock = async () => {
      try {
        if (document.visibilityState === "visible" && "wakeLock" in navigator) {
          wakeRef.current = await navigator.wakeLock.request("screen");
        }
      } catch {
        /* not supported or refused: the stream still works, the screen may just turn off */
      }
    };
    void lock();
    document.addEventListener("visibilitychange", lock);
    return () => {
      document.removeEventListener("visibilitychange", lock);
      void wakeRef.current?.release().catch(() => {});
      wakeRef.current = null;
    };
  }, [phase]);

  // Stop everything when leaving the page.
  useEffect(
    () => () => {
      activeRef.current = false;
      if (retryRef.current) window.clearTimeout(retryRef.current);
      callRef.current?.close();
      peerRef.current?.destroy();
      streamRef.current?.getTracks().forEach((t) => t.stop());
    },
    [],
  );

  function clearRetry() {
    if (retryRef.current) window.clearTimeout(retryRef.current);
    retryRef.current = null;
  }

  function retryCall(status: Link) {
    if (!activeRef.current) return;
    setLink(status);
    clearRetry();
    retryRef.current = window.setTimeout(callDashboard, RETRY_MS);
  }

  function capBitrate(call: MediaConnection) {
    const sender = call.peerConnection?.getSenders().find((s) => s.track?.kind === "video");
    if (!sender) return;
    const params = sender.getParameters();
    if (!params.encodings?.length) params.encodings = [{}];
    params.encodings[0].maxBitrate = MAX_BITRATE;
    sender.setParameters(params).catch(() => {});
  }

  function callDashboard() {
    const peer = peerRef.current;
    const media = streamRef.current;
    if (!activeRef.current || !peer || !media) return;
    if (peer.disconnected) {
      peer.reconnect();
      return; // "open" fires again and calls back here
    }
    const old = callRef.current;
    callRef.current = null; // so the old call's "close" doesn't trigger another retry
    old?.close();
    const call = peer.call(dashboardPeerId(code), media);
    callRef.current = call;
    if (!call) return retryCall("waiting");

    const pc = call.peerConnection;
    let lostTimer: number | null = null;
    let connected = false;
    // The dashboard was found; if the video can't get through the network, say so instead of "waiting".
    const failed = () => {
      if (callRef.current !== call) return;
      if (!connected)
        setError("Found your computer, but the video can't get through this network. Retrying… (the site's relay server fixes this)");
      retryCall("reconnecting");
    };
    // ICE can sit in "checking" for a long time when it's blocked; give up and retry after a while.
    const giveUp = window.setTimeout(() => {
      if (!connected) failed();
    }, 25_000);
    pc?.addEventListener("connectionstatechange", () => {
      if (callRef.current !== call) return;
      const s = pc.connectionState;
      if (s === "connected") {
        connected = true;
        window.clearTimeout(giveUp);
        if (lostTimer) window.clearTimeout(lostTimer);
        setLink("live");
        setError(null);
        capBitrate(call);
      } else if (s === "failed") {
        window.clearTimeout(giveUp);
        failed();
      } else if (s === "disconnected") {
        // Often recovers by itself (e.g. Wi-Fi to mobile data); if not, call again.
        setLink("reconnecting");
        lostTimer = window.setTimeout(() => {
          if (callRef.current === call && pc.connectionState !== "connected") retryCall("reconnecting");
        }, 5000);
      }
    });
    call.on("close", () => {
      window.clearTimeout(giveUp);
      failed();
    });
  }

  async function connect() {
    const [{ Peer }, ice] = await Promise.all([import("peerjs"), getIceServers()]);
    if (!activeRef.current) return;
    const peer = new Peer({ config: { iceServers: ice.servers } });
    peerRef.current = peer;
    peer.on("open", callDashboard);
    peer.on("disconnected", () => {
      if (activeRef.current && !peer.destroyed) window.setTimeout(() => peer.reconnect(), 1000);
    });
    peer.on("error", (err) => {
      if (!activeRef.current) return;
      if (err.type === "peer-unavailable") return retryCall("waiting"); // dashboard page not open yet
      if (["network", "server-error", "socket-error", "socket-closed"].includes(err.type)) {
        setError("Can't reach the pairing server. Check this phone's internet connection.");
        return retryCall("reconnecting");
      }
      setError("Connection problem. Retrying…");
      retryCall("reconnecting");
    });
  }

  async function start() {
    setError(null);
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setError("This page must be opened over https to use the camera. Scan the QR code from the deployed website.");
      return;
    }
    setPhase("starting");
    try {
      const media = await navigator.mediaDevices.getUserMedia(cameraConstraints(facing));
      streamRef.current = media;
      setStream(media);
      activeRef.current = true;
      setLink("connecting");
      setPhase("running");
      void connect();
    } catch (err) {
      setError(cameraError(err));
      setPhase("intro");
    }
  }

  async function switchCamera() {
    const next: Facing = facing === "environment" ? "user" : "environment";
    const previous = streamRef.current;
    setSwitching(true);
    setError(null);

    // Many phones can only open one camera at a time, so release the current one first.
    previous?.getTracks().forEach((t) => t.stop());

    const open = (f: Facing, exact: boolean) =>
      navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: exact ? { exact: f } : { ideal: f },
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 15, max: 20 },
        },
      });

    let media: MediaStream | null = null;
    let target: Facing = next;
    try {
      try {
        media = await open(next, true);
      } catch {
        media = await open(next, false);
      }
    } catch (err) {
      // Could not open the other camera: go back to the one that was working.
      setError(`Could not switch cameras (${cameraError(err)}) Going back to the ${facing === "environment" ? "back" : "front"} camera.`);
      try {
        media = await open(facing, false);
        target = facing;
      } catch (err2) {
        setError(cameraError(err2));
      }
    }

    if (media) {
      const track = media.getVideoTracks()[0];
      const sender = callRef.current?.peerConnection?.getSenders().find((s) => s.track?.kind === "video");
      try {
        await sender?.replaceTrack(track);
      } catch {
        /* the next reconnect will send the new stream */
      }
      streamRef.current = media;
      setStream(media);
      setFacing(target);
    }
    setSwitching(false);
  }

  function teardown() {
    activeRef.current = false;
    clearRetry();
    callRef.current?.close();
    callRef.current = null;
    peerRef.current?.destroy();
    peerRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  function stop() {
    teardown();
    setStream(null);
    setPhase("intro");
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-4 pb-6 pt-4">
      <header className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 font-semibold">
          <LogoMark size={30} /> VisionGuard
        </span>
        {valid && (
          <span className="rounded-full bg-white/10 px-3 py-1 font-mono text-sm tracking-wider">
            {formatCode(code)}
          </span>
        )}
      </header>

      {!valid ? (
        <Message
          title="This link is not valid"
          text="Scan the QR code shown on the VisionGuard camera page again."
        />
      ) : phase === "running" ? (
        <section className="mt-4 flex flex-1 flex-col">
          <div className="relative overflow-hidden rounded-2xl bg-black">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className={`aspect-[3/4] w-full object-cover ${facing === "user" ? "-scale-x-100" : ""}`}
            />
            <span
              className={`absolute left-3 top-3 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                link === "live" ? "bg-danger text-white" : "bg-black/60 text-white"
              }`}
            >
              {link === "live" ? (
                <>
                  <span className="size-2 animate-pulse rounded-full bg-white" /> LIVE
                </>
              ) : (
                <>
                  <LoaderCircle size={13} className="animate-spin" /> Not live yet
                </>
              )}
            </span>
          </div>

          <div
            role="status"
            className={`mt-4 flex items-start gap-3 rounded-2xl p-4 ${link === "live" ? "bg-success/20" : "bg-white/10"}`}
          >
            {link === "live" ? (
              <Radio size={20} className="mt-0.5 shrink-0 text-success" />
            ) : (
              <Wifi size={20} className="mt-0.5 shrink-0 text-white/70" />
            )}
            <div>
              <p className="font-semibold">{LINK_TEXT[link].title}</p>
              <p className="mt-0.5 text-sm text-white/70">{LINK_TEXT[link].detail}</p>
            </div>
          </div>
          {error && <ErrorNote text={error} />}

          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={switchCamera}
              disabled={switching}
              className="flex items-center justify-center gap-2 rounded-xl bg-white/10 px-4 py-3 font-semibold disabled:opacity-50"
            >
              <SwitchCamera size={18} /> {facing === "environment" ? "Front camera" : "Back camera"}
            </button>
            <button
              type="button"
              onClick={stop}
              className="flex items-center justify-center gap-2 rounded-xl bg-danger px-4 py-3 font-semibold"
            >
              <Square size={16} /> Stop
            </button>
          </div>
          <p className="mt-4 text-center text-xs text-white/50">
            Tip: prop the phone up so it doesn&apos;t move, and plug in the charger for long use.
          </p>
        </section>
      ) : (
        <section className="flex flex-1 flex-col justify-center py-8 text-center">
          <span className="mx-auto grid size-16 place-items-center rounded-3xl bg-brand">
            <Camera size={30} />
          </span>
          <h1 className="mt-5 text-2xl font-semibold">Use this phone as a camera</h1>
          <p className="mx-auto mt-2 max-w-sm text-white/70">
            Your computer will show this phone&apos;s camera live and watch it for people in restricted zones.
          </p>
          <p className="mt-6 text-sm text-white/60">Pairing code</p>
          <p className="font-mono text-3xl font-semibold tracking-[0.2em]">{formatCode(code)}</p>
          <p className="mt-1 text-xs text-white/50">It should match the code on your computer.</p>

          <button
            type="button"
            onClick={start}
            disabled={phase === "starting"}
            className="mx-auto mt-8 flex w-full max-w-xs items-center justify-center gap-2 rounded-2xl bg-brand px-6 py-4 text-lg font-semibold disabled:opacity-60"
          >
            {phase === "starting" ? <LoaderCircle size={20} className="animate-spin" /> : <Camera size={20} />}
            {phase === "starting" ? "Starting camera…" : "Start camera"}
          </button>
          <p className="mx-auto mt-3 max-w-xs text-xs text-white/50">
            When asked, tap &quot;Allow&quot; to let this site use the camera. Video only, no sound.
          </p>
          {error && <ErrorNote text={error} />}
        </section>
      )}
    </div>
  );
}

function ErrorNote({ text }: { text: string }) {
  return (
    <p role="alert" className="mt-4 flex items-start gap-2 rounded-xl bg-danger/20 p-3 text-left text-sm">
      <CircleAlert size={17} className="mt-0.5 shrink-0" /> {text}
    </p>
  );
}

function Message({ title, text }: { title: string; text: string }) {
  return (
    <section className="flex flex-1 flex-col justify-center py-8 text-center">
      <CircleAlert size={36} className="mx-auto text-white/70" />
      <h1 className="mt-4 text-xl font-semibold">{title}</h1>
      <p className="mt-2 text-white/70">{text}</p>
    </section>
  );
}

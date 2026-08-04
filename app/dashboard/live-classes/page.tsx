"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Calendar, Copy, Mic, MicOff, MonitorUp, PhoneOff, Send, Users, Video, VideoOff } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const LiveClassesPage: React.FC = () => {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const screenVideoRef = useRef<HTMLVideoElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);

  const [roomInput, setRoomInput] = useState("");
  const [activeRoom, setActiveRoom] = useState<string | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [screenOn, setScreenOn] = useState(false);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<Array<{ name: string; text: string }>>([]);

  const inviteUrl = useMemo(() => {
    if (!activeRoom || typeof window === "undefined") return "";
    return `${window.location.origin}/dashboard/live-classes?room=${encodeURIComponent(activeRoom)}`;
  }, [activeRoom]);

  const isTeacher = user?.role === "teacher";

  const joinRoom = (room: string) => {
    const cleaned = room.trim().toLowerCase().replace(/\s+/g, "-");
    if (!cleaned) {
      toast.error("Enter a class code or room name.");
      return;
    }
    setActiveRoom(cleaned);
    setRoomInput(cleaned);
    setMessages([{ name: "System", text: `${user?.name || "User"} ${isTeacher ? "started" : "joined"} ${cleaned}.` }]);
    toast.success(isTeacher ? "Live class started" : "Joined live class");
  };

  const stopStream = (stream: MediaStream | null) => {
    stream?.getTracks().forEach((track) => track.stop());
  };

  const toggleCamera = async () => {
    if (cameraOn) {
      stopStream(cameraStreamRef.current);
      cameraStreamRef.current = null;
      if (localVideoRef.current) localVideoRef.current.srcObject = null;
      setCameraOn(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      cameraStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      setCameraOn(true);
      setMicOn(true);
    } catch {
      toast.error("Camera permission was blocked or unavailable.");
    }
  };

  const toggleMic = () => {
    cameraStreamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = !micOn;
    });
    setMicOn((value) => !value);
  };

  const toggleScreen = async () => {
    if (screenOn) {
      stopStream(screenStreamRef.current);
      screenStreamRef.current = null;
      if (screenVideoRef.current) screenVideoRef.current.srcObject = null;
      setScreenOn(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      screenStreamRef.current = stream;
      if (screenVideoRef.current) screenVideoRef.current.srcObject = stream;
      stream.getVideoTracks()[0]?.addEventListener("ended", () => setScreenOn(false));
      setScreenOn(true);
    } catch {
      toast.error("Screen sharing was cancelled or unavailable.");
    }
  };

  const leaveRoom = () => {
    stopStream(cameraStreamRef.current);
    stopStream(screenStreamRef.current);
    cameraStreamRef.current = null;
    screenStreamRef.current = null;
    setCameraOn(false);
    setScreenOn(false);
    setActiveRoom(null);
    setMessages([]);
  };

  const sendMessage = () => {
    const text = draft.trim();
    if (!text) return;
    setMessages((current) => current.concat({ name: user?.name || "User", text }));
    setDraft("");
  };

  const copyInvite = async () => {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    toast.success("Invite link copied");
  };

  useEffect(() => {
    const room = searchParams.get("room");
    if (room) joinRoom(room);
    return () => {
      stopStream(cameraStreamRef.current);
      stopStream(screenStreamRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-ocean">{isTeacher ? "Teacher Live Classroom" : "Student Live Classroom"}</p>
          <h1 className="mt-2 text-3xl font-black text-ink">{isTeacher ? "Start or manage a live class" : "Join online live classes"}</h1>
          <p className="mt-1 text-slate-600">Camera, mic, screen mirror, invite link, participants, and live chat in one room.</p>
        </div>
        <form onSubmit={(event) => { event.preventDefault(); joinRoom(roomInput); }} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-row">
          <input value={roomInput} onChange={(event) => setRoomInput(event.target.value)} placeholder="Class code or room name" className="rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/20" />
          <button className="rounded-xl bg-ocean px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700">{isTeacher ? "Start Class" : "Join Class"}</button>
        </form>
      </motion.div>

      <div className="grid gap-6 xl:grid-cols-[0.7fr_1.3fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2 font-black text-ink">
            <Calendar size={19} />
            Today&apos;s Classes
          </div>
          <div className="space-y-3">
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm font-medium text-slate-500">
              No scheduled classes available.
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-black text-ink">{activeRoom ? `Room: ${activeRoom}` : "No active room"}</h2>
              <p className="mt-1 flex items-center gap-2 text-sm text-slate-500"><Users size={16} /> {activeRoom ? "Room is active" : "Enter a room to begin"}</p>
            </div>
            <button disabled={!activeRoom} onClick={copyInvite} className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-ocean hover:text-ocean disabled:opacity-50">
              <Copy size={17} />
              Copy Invite
            </button>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
            <div className="overflow-hidden rounded-2xl bg-slate-950">
              {screenOn ? (
                <video ref={screenVideoRef} autoPlay playsInline muted className="h-[360px] w-full bg-black object-contain" />
              ) : (
                <div className="grid h-[360px] place-items-center text-center text-white">
                  <div>
                    <MonitorUp className="mx-auto mb-3 text-cyan-200" size={44} />
                    <p className="font-bold">{isTeacher ? "Share your screen for the class" : "Teacher screen will appear here"}</p>
                    <p className="mt-1 text-sm text-slate-300">Use screen mirror for slides, PDFs, code, or browser tabs.</p>
                  </div>
                </div>
              )}
            </div>
            <div className="overflow-hidden rounded-2xl bg-slate-900">
              {cameraOn ? (
                <video ref={localVideoRef} autoPlay playsInline muted className="h-[360px] w-full bg-black object-cover" />
              ) : (
                <div className="grid h-[360px] place-items-center text-center text-white">
                  <div>
                    <VideoOff className="mx-auto mb-3 text-slate-300" size={42} />
                    <p className="font-bold">Camera off</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button disabled={!activeRoom} onClick={toggleCamera} className="inline-flex items-center gap-2 rounded-xl bg-ocean px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-50">
              {cameraOn ? <VideoOff size={18} /> : <Video size={18} />}
              {cameraOn ? "Stop Camera" : "Start Camera"}
            </button>
            <button disabled={!activeRoom || !cameraOn} onClick={toggleMic} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-ocean hover:text-ocean disabled:opacity-50">
              {micOn ? <Mic size={18} /> : <MicOff size={18} />}
              {micOn ? "Mute" : "Unmute"}
            </button>
            <button disabled={!activeRoom} onClick={toggleScreen} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-ocean hover:text-ocean disabled:opacity-50">
              <MonitorUp size={18} />
              {screenOn ? "Stop Mirror" : "Screen Mirror"}
            </button>
            <button disabled={!activeRoom} onClick={leaveRoom} className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-3 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-50">
              <PhoneOff size={18} />
              Leave
            </button>
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-black text-ink">Class Chat</h2>
        <div className="mt-4 min-h-40 rounded-2xl bg-slate-50 p-4">
          {messages.length === 0 ? <p className="text-sm text-slate-500">Messages will appear after you join a room.</p> : messages.map((message, index) => (
            <p key={`${message.name}-${index}`} className="mb-2 text-sm text-slate-700"><span className="font-bold text-ink">{message.name}:</span> {message.text}</p>
          ))}
        </div>
        <div className="mt-4 flex gap-2">
          <input value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") sendMessage(); }} disabled={!activeRoom} placeholder={activeRoom ? "Type a class message..." : "Join a room to chat"} className="flex-1 rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/20 disabled:bg-slate-100" />
          <button onClick={sendMessage} disabled={!activeRoom || !draft.trim()} className="rounded-xl bg-ocean px-4 py-3 text-white transition hover:bg-blue-700 disabled:bg-slate-300">
            <Send size={18} />
          </button>
        </div>
      </section>
    </div>
  );
};

export default LiveClassesPage;

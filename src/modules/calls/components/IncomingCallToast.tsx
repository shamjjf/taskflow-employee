'use client';

import { useEffect, useRef } from 'react';
import { Avatar } from '@/components/ui';
import { Phone, PhoneOff, Video } from 'lucide-react';
import { getInitials } from '@/lib/utils';
import type { CallSession } from '@/store/callStore';

interface IncomingCallToastProps {
  session: CallSession;
  onAccept: () => void;
  onReject: () => void;
}

const colorForId = (id: number) => {
  const palette = ['#5b5bd6', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#f59e0b', '#f97316'];
  return palette[id % palette.length];
};

/**
 * Generates a simple ringtone using the Web Audio API — no external file needed.
 * Plays a classic "ring-ring" pattern: 2 beeps, pause, repeat.
 */
function useRingtone(active: boolean) {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!active) return;

    // Create AudioContext lazily (browsers require user gesture but socket events are fine)
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    audioCtxRef.current = ctx;

    const playBeep = (when: number, duration: number, freq: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.value = freq;

      // Smooth envelope to avoid clicks
      gain.gain.setValueAtTime(0, when);
      gain.gain.linearRampToValueAtTime(0.15, when + 0.05);
      gain.gain.linearRampToValueAtTime(0.15, when + duration - 0.05);
      gain.gain.linearRampToValueAtTime(0, when + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(when);
      osc.stop(when + duration);
    };

    const playRing = () => {
      const now = ctx.currentTime;
      // Classic "ring-ring" — two short beeps
      playBeep(now, 0.4, 480);
      playBeep(now + 0.5, 0.4, 440);
    };

    // Play immediately, then repeat every 3 seconds
    playRing();
    intervalRef.current = setInterval(playRing, 3000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      ctx.close().catch(() => undefined);
      audioCtxRef.current = null;
    };
  }, [active]);
}

export function IncomingCallToast({ session, onAccept, onReject }: IncomingCallToastProps) {
  useRingtone(true);

  const caller = session.caller || session.participants[0];
  if (!caller) return null;

  const isVideo = session.callType === 'video';

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[60] bg-black/30 backdrop-blur-sm animate-fade-in" />

      {/* Centered card with subtle pulse */}
      <div className="fixed inset-0 z-[61] flex items-center justify-center p-5 animate-fade-in pointer-events-none">
        <div className="bg-white rounded-2xl shadow-[0_30px_80px_-20px_rgba(0,0,0,0.4)] border border-[#e4e4e7] w-full max-w-[380px] overflow-hidden pointer-events-auto">
          {/* Header — subtle ringing badge */}
          <div className="px-6 pt-6 pb-2 flex flex-col items-center text-center">
            <div className="text-[11px] font-medium tracking-[0.18em] uppercase text-[#a1a1aa] mb-5 flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10b981] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10b981]" />
              </span>
              Incoming {isVideo ? 'video' : 'voice'} call
            </div>

            {/* Avatar with pulsing ring */}
            <div className="relative mb-4">
              <span className="absolute inset-0 rounded-full bg-[#5b5bd6]/30 animate-ping" />
              <span className="absolute inset-0 rounded-full bg-[#5b5bd6]/20 animate-pulse" />
              <div className="relative">
                <Avatar
                  initials={getInitials(caller.name)}
                  color={colorForId(caller.id)}
                  size="lg"
                  className="!w-20 !h-20 !text-2xl ring-4 ring-white shadow-lg"
                />
              </div>
            </div>

            {/* Caller name */}
            <h2 className="text-[20px] font-semibold text-[#18181b] tracking-tight">
              {caller.name}
            </h2>
            {caller.email && (
              <p className="text-[12.5px] text-[#71717a] mt-0.5">{caller.email}</p>
            )}
          </div>

          {/* Action buttons */}
          <div className="px-6 py-5 flex items-center justify-center gap-6">
            {/* Reject */}
            <button
              onClick={onReject}
              className="group flex flex-col items-center gap-1.5"
              aria-label="Reject call"
            >
              <div className="w-14 h-14 rounded-full bg-[#dc2626] hover:bg-[#b91c1c] active:scale-95 transition flex items-center justify-center shadow-lg shadow-[#dc2626]/30">
                <PhoneOff size={22} className="text-white" strokeWidth={2.5} />
              </div>
              <span className="text-[11px] font-medium text-[#71717a] group-hover:text-[#18181b]">
                Decline
              </span>
            </button>

            {/* Accept */}
            <button
              onClick={onAccept}
              className="group flex flex-col items-center gap-1.5"
              aria-label="Accept call"
            >
              <div className="w-14 h-14 rounded-full bg-[#10b981] hover:bg-[#059669] active:scale-95 transition flex items-center justify-center shadow-lg shadow-[#10b981]/30 relative">
                <span className="absolute inset-0 rounded-full bg-[#10b981] animate-ping opacity-60" />
                {isVideo ? (
                  <Video size={22} className="text-white relative" strokeWidth={2.5} />
                ) : (
                  <Phone size={22} className="text-white relative" strokeWidth={2.5} />
                )}
              </div>
              <span className="text-[11px] font-medium text-[#71717a] group-hover:text-[#18181b]">
                Accept
              </span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

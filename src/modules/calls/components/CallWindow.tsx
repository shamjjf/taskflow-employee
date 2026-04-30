'use client';

import { useEffect, useRef, useState } from 'react';
import { Avatar } from '@/components/ui';
import { cn, getInitials } from '@/lib/utils';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  ScreenShare,
  ScreenShareOff,
  Users,
} from 'lucide-react';
import { agoraRTC } from '../services/agoraRtc';
import type { CallSession, RemoteParticipant } from '@/store/callStore';

const colorForId = (id: number) => {
  const palette = ['#5b5bd6', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#f59e0b', '#f97316'];
  return palette[id % palette.length];
};

interface CallWindowProps {
  session: CallSession;
  status: 'outgoing' | 'connecting' | 'connected' | 'ended';
  micMuted: boolean;
  cameraOff: boolean;
  isScreenSharing: boolean;
  remoteUsers: Record<number, RemoteParticipant>;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onToggleScreenShare: () => void;
  onEnd: () => void;
}

/* Call timer hook — counts up once connected */
function useCallTimer(isActive: boolean) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (!isActive) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [isActive]);

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

/* Local video tile — renders own camera into a div */
function LocalVideoTile({ cameraOff, name, userId }: { cameraOff: boolean; name: string; userId: number }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (cameraOff) return;
    const track = agoraRTC.getLocalVideoTrack();
    const screenTrack = agoraRTC.getLocalScreenTrack();
    const trackToPlay = screenTrack || track;
    if (!trackToPlay || !containerRef.current) return;

    trackToPlay.play(containerRef.current);
    return () => {
      trackToPlay.stop();
    };
  }, [cameraOff]);

  return (
    <div className="relative w-full h-full bg-[#18181b] rounded-2xl overflow-hidden border border-white/10">
      <div ref={containerRef} className={cn('absolute inset-0', cameraOff && 'hidden')} />
      {cameraOff && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#27272a] to-[#18181b]">
          <Avatar
            initials={getInitials(name)}
            color={colorForId(userId)}
            size="lg"
            className="!w-20 !h-20 !text-2xl"
          />
        </div>
      )}
      <div className="absolute bottom-3 left-3 px-2 py-1 rounded-md bg-black/60 backdrop-blur-sm">
        <span className="text-[11px] font-medium text-white">You</span>
      </div>
    </div>
  );
}

/* Remote video tile — subscribes + plays remote user's video */
function RemoteVideoTile({
  uid,
  participant,
  remote,
}: {
  uid: number;
  participant?: { id: number; name: string };
  remote: RemoteParticipant;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const name = participant?.name || `User ${uid}`;

  useEffect(() => {
    if (!remote.hasVideo || !containerRef.current) return;

    // Get the AgoraRTC client and find this user's track
    const client = (agoraRTC as unknown as { client: { remoteUsers: { uid: string | number; videoTrack?: { play: (el: HTMLElement) => void; stop: () => void } }[] } }).client;
    if (!client) return;

    const remoteUser = client.remoteUsers.find((u) => Number(u.uid) === uid);
    if (!remoteUser?.videoTrack) return;

    remoteUser.videoTrack.play(containerRef.current);

    return () => {
      remoteUser.videoTrack?.stop();
    };
  }, [uid, remote.hasVideo]);

  return (
    <div className="relative w-full h-full bg-[#18181b] rounded-2xl overflow-hidden border border-white/10">
      <div ref={containerRef} className={cn('absolute inset-0', !remote.hasVideo && 'hidden')} />
      {!remote.hasVideo && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#27272a] to-[#18181b]">
          <Avatar
            initials={getInitials(name)}
            color={colorForId(uid)}
            size="lg"
            className="!w-20 !h-20 !text-2xl"
          />
        </div>
      )}
      <div className="absolute bottom-3 left-3 px-2 py-1 rounded-md bg-black/60 backdrop-blur-sm flex items-center gap-1.5">
        <span className="text-[11px] font-medium text-white">{name}</span>
        {!remote.hasAudio && <MicOff size={10} className="text-[#dc2626]" />}
      </div>
    </div>
  );
}

/* Main call window */
export function CallWindow(props: CallWindowProps) {
  const {
    session,
    status,
    micMuted,
    cameraOff,
    isScreenSharing,
    remoteUsers,
    onToggleMic,
    onToggleCamera,
    onToggleScreenShare,
    onEnd,
  } = props;

  const isVideo = session.callType === 'video';
  const isConnected = status === 'connected';
  const remoteUidList = Object.keys(remoteUsers).map(Number);
  const remoteCount = remoteUidList.length;

  const timer = useCallTimer(isConnected);

  // Resolve participant info for remote uids
  const getParticipant = (uid: number) =>
    session.participants.find((p) => p.id === uid);

  // Status text shown at top
  const statusText = (() => {
    if (status === 'outgoing') return 'Calling…';
    if (status === 'connecting') return 'Connecting…';
    if (status === 'connected') return timer;
    if (status === 'ended') return 'Call ended';
    return '';
  })();

  // Choose grid layout based on participant count
  const gridLayout = (() => {
    const total = remoteCount + 1; // +1 for self
    if (total === 1) return 'grid-cols-1';
    if (total === 2) return 'grid-cols-1 md:grid-cols-2';
    if (total <= 4) return 'grid-cols-2';
    return 'grid-cols-2 md:grid-cols-3';
  })();

  return (
    <div className="fixed inset-0 z-[55] bg-[#0a0a0a] flex flex-col animate-fade-in">
      {/* Top bar — call info */}
      <div className="flex-shrink-0 px-6 py-4 flex items-center justify-between border-b border-white/5 bg-gradient-to-b from-black/40 to-transparent">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className={cn('w-2 h-2 rounded-full', isConnected ? 'bg-[#10b981]' : 'bg-[#f59e0b]')} />
            <span className="text-[11px] font-medium tracking-[0.14em] uppercase text-white/60">
              {isVideo ? 'Video Call' : 'Voice Call'}
            </span>
          </div>
        </div>

        <div className="text-white text-sm font-medium tabular-nums">{statusText}</div>

        <div className="flex items-center gap-1.5 text-white/60">
          <Users size={14} />
          <span className="text-[12px] tabular-nums">{remoteCount + 1}</span>
        </div>
      </div>

      {/* Video grid */}
      <div className="flex-1 p-3 md:p-6 overflow-hidden">
        {/* Audio-only call → show big avatars stacked */}
        {!isVideo ? (
          <div className="h-full flex flex-col items-center justify-center gap-8">
            {remoteCount === 0 ? (
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <span className="absolute inset-0 rounded-full bg-[#5b5bd6]/30 animate-ping" />
                  <Avatar
                    initials={getInitials(session.participants[0]?.name || '?')}
                    color={colorForId(session.participants[0]?.id || 0)}
                    size="lg"
                    className="!w-32 !h-32 !text-4xl relative"
                  />
                </div>
                <div className="text-center">
                  <div className="text-white text-2xl font-semibold">
                    {session.participants[0]?.name || 'Calling...'}
                  </div>
                  <div className="text-white/50 text-sm mt-1">{statusText}</div>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap justify-center gap-6">
                {remoteUidList.map((uid) => {
                  const p = getParticipant(uid);
                  return (
                    <div key={uid} className="flex flex-col items-center gap-3">
                      <Avatar
                        initials={getInitials(p?.name || `U${uid}`)}
                        color={colorForId(uid)}
                        size="lg"
                        className="!w-24 !h-24 !text-3xl"
                      />
                      <div className="text-white text-sm font-medium">
                        {p?.name || `User ${uid}`}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* Video call → grid of tiles */
          <div className={cn('h-full grid gap-3', gridLayout)}>
            {/* Remote tiles */}
            {remoteUidList.map((uid) => (
              <RemoteVideoTile
                key={uid}
                uid={uid}
                participant={getParticipant(uid)}
                remote={remoteUsers[uid]}
              />
            ))}

            {/* If no remotes yet (outgoing/connecting), show waiting state */}
            {remoteCount === 0 && status !== 'connected' && (
              <div className="flex flex-col items-center justify-center text-center">
                <div className="relative mb-4">
                  <span className="absolute inset-0 rounded-full bg-[#5b5bd6]/30 animate-ping" />
                  <Avatar
                    initials={getInitials(session.participants[0]?.name || '?')}
                    color={colorForId(session.participants[0]?.id || 0)}
                    size="lg"
                    className="!w-24 !h-24 !text-3xl relative"
                  />
                </div>
                <div className="text-white text-xl font-semibold">
                  {session.participants[0]?.name || 'Calling...'}
                </div>
                <div className="text-white/50 text-sm mt-1">{statusText}</div>
              </div>
            )}

            {/* Self tile (always shown — picture-in-picture style if alone) */}
            <div
              className={cn(
                remoteCount === 0
                  ? 'absolute bottom-24 right-6 w-[140px] h-[180px] md:w-[180px] md:h-[240px] z-10 shadow-2xl'
                  : 'relative'
              )}
            >
              <LocalVideoTile
                cameraOff={cameraOff && !isScreenSharing}
                name="You"
                userId={0}
              />
            </div>
          </div>
        )}
      </div>

      {/* Bottom controls */}
      <div className="flex-shrink-0 px-6 py-5 flex items-center justify-center gap-3 bg-gradient-to-t from-black/60 to-transparent">
        {/* Mic toggle */}
        <button
          onClick={onToggleMic}
          className={cn(
            'w-12 h-12 rounded-full flex items-center justify-center transition active:scale-95',
            micMuted
              ? 'bg-white text-[#dc2626] hover:bg-white/90'
              : 'bg-white/10 text-white hover:bg-white/20'
          )}
          aria-label={micMuted ? 'Unmute' : 'Mute'}
        >
          {micMuted ? <MicOff size={20} /> : <Mic size={20} />}
        </button>

        {/* Camera toggle (only for video) */}
        {isVideo && (
          <button
            onClick={onToggleCamera}
            className={cn(
              'w-12 h-12 rounded-full flex items-center justify-center transition active:scale-95',
              cameraOff
                ? 'bg-white text-[#dc2626] hover:bg-white/90'
                : 'bg-white/10 text-white hover:bg-white/20'
            )}
            aria-label={cameraOff ? 'Turn camera on' : 'Turn camera off'}
          >
            {cameraOff ? <VideoOff size={20} /> : <Video size={20} />}
          </button>
        )}

        {/* Screen share (only for video) */}
        {isVideo && (
          <button
            onClick={onToggleScreenShare}
            className={cn(
              'w-12 h-12 rounded-full flex items-center justify-center transition active:scale-95',
              isScreenSharing
                ? 'bg-[#5b5bd6] text-white hover:bg-[#4f4fc0]'
                : 'bg-white/10 text-white hover:bg-white/20'
            )}
            aria-label={isScreenSharing ? 'Stop sharing' : 'Share screen'}
          >
            {isScreenSharing ? <ScreenShareOff size={20} /> : <ScreenShare size={20} />}
          </button>
        )}

        {/* End call */}
        <button
          onClick={onEnd}
          className="ml-2 px-5 h-12 rounded-full bg-[#dc2626] hover:bg-[#b91c1c] text-white flex items-center justify-center gap-2 transition active:scale-95 shadow-lg shadow-[#dc2626]/30"
          aria-label="End call"
        >
          <PhoneOff size={18} strokeWidth={2.5} />
          <span className="text-sm font-semibold">End</span>
        </button>
      </div>
    </div>
  );
}

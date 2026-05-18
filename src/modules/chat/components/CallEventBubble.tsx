'use client';

import { Phone, PhoneMissed, Video, VideoOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CallEventData } from '@/types';

function formatDuration(seconds: number): string {
  if (!seconds || seconds < 0) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

interface Props {
  data: CallEventData;
  viewerId: number;
  createdAt: string;
}

/**
 * WhatsApp-style call entry rendered inside the chat. Both caller and
 * receiver see the same backing message, but the text adapts to the
 * viewer's perspective.
 */
export function CallEventBubble({ data, viewerId, createdAt }: Props) {
  const isCaller = data.callerId === viewerId;
  const isVideo = data.callType === 'video';

  // Treat "no answer" the same on the receiver side regardless of whether
  // the caller cancelled or rang out — WhatsApp shows both as "Missed call".
  const missedForReceiver = !isCaller && (data.outcome === 'missed' || data.outcome === 'cancelled');

  const isDanger =
    missedForReceiver ||
    (isCaller && data.outcome === 'declined') ||
    (!isCaller && data.outcome === 'declined');

  const Icon = (() => {
    if (missedForReceiver) return PhoneMissed;
    if (data.outcome === 'declined') return isVideo ? VideoOff : PhoneMissed;
    return isVideo ? Video : Phone;
  })();

  const label = (() => {
    const kind = isVideo ? 'video call' : 'voice call';
    const Kind = isVideo ? 'Video call' : 'Voice call';

    if (data.outcome === 'answered') {
      const direction = isCaller ? 'Outgoing' : 'Incoming';
      return `${direction} ${kind}`;
    }
    if (data.outcome === 'declined') {
      return isCaller ? `${Kind} declined` : `You declined a ${kind}`;
    }
    if (isCaller) {
      // outcome is 'missed' or 'cancelled' — both mean "no one picked up"
      return data.outcome === 'cancelled' ? `${Kind} cancelled` : `No answer`;
    }
    // receiver, missed/cancelled
    return `Missed ${kind}`;
  })();

  const duration = data.outcome === 'answered' ? formatDuration(data.durationSec) : null;
  const timestamp = new Date(createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="self-center my-1">
      <div
        className={cn(
          'inline-flex items-center gap-2.5 px-3 py-2 rounded-xl border text-[13px]',
          isDanger
            ? 'bg-[#fef2f2] border-[#fecaca] text-[#b91c1c]'
            : 'bg-surface-muted border-border text-[#52525b]'
        )}
      >
        <Icon size={16} className={isDanger ? 'text-[#dc2626]' : 'text-[#71717a]'} />
        <div className="flex flex-col leading-tight">
          <span className="font-medium">{label}</span>
          <span className="text-[11px] text-[#a1a1aa]">
            {timestamp}
            {duration ? ` · ${duration}` : ''}
          </span>
        </div>
      </div>
    </div>
  );
}

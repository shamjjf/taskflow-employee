import { create } from 'zustand';
import type { CallType } from '../modules/calls/services/agoraRtc';

/**
 * Call lifecycle states:
 *
 *   idle ─────► outgoing (ringing) ─┬─► connected ─► ended
 *                                    │
 *   idle ─────► incoming (ringing) ─┴─► connected ─► ended
 *                                    │
 *                                    └─► ended (rejected / missed)
 */
export type CallStatus =
  | 'idle' // No call
  | 'outgoing' // I called, waiting for receiver to pick up
  | 'incoming' // Someone is calling me (ringing)
  | 'connecting' // Accepted / answered, joining Agora channel
  | 'connected' // In a call
  | 'ended'; // Call just ended (UI shows "Call ended" briefly)

export interface CallUser {
  id: number;
  name: string;
  email?: string;
  avatarColor?: string;
  initials?: string;
}

export interface RemoteParticipant {
  uid: number;
  hasVideo: boolean;
  hasAudio: boolean;
}

export interface CallSession {
  channelName: string;
  callType: CallType;
  conversationId: number;
  /** Everyone who *can* be in this call (including self), used for signaling */
  participantIds: number[];
  /** People we know about (for showing names/avatars) */
  participants: CallUser[];
  /** Who started the call (for incoming calls) */
  caller?: CallUser;
  /** True if this is a multi-party (group) call. Changes reject/end semantics. */
  isGroup?: boolean;
}

interface CallState {
  // ----- Call lifecycle -----
  status: CallStatus;
  session: CallSession | null;

  // ----- Local user controls -----
  micMuted: boolean;
  cameraOff: boolean;
  isScreenSharing: boolean;

  // ----- Remote participants (uid → state) -----
  remoteUsers: Record<number, RemoteParticipant>;

  // ----- Actions -----
  setStatus: (status: CallStatus) => void;
  startOutgoing: (session: CallSession) => void;
  receiveIncoming: (session: CallSession) => void;
  setConnecting: () => void;
  setConnected: () => void;
  endCall: () => void;
  reset: () => void;

  toggleMic: () => boolean;
  toggleCamera: () => boolean;
  setScreenSharing: (sharing: boolean) => void;

  addRemoteUser: (uid: number) => void;
  removeRemoteUser: (uid: number) => void;
  updateRemoteUser: (uid: number, changes: Partial<RemoteParticipant>) => void;
}

const initialState = {
  status: 'idle' as CallStatus,
  session: null,
  micMuted: false,
  cameraOff: false,
  isScreenSharing: false,
  remoteUsers: {},
};

export const useCallStore = create<CallState>((set, get) => ({
  ...initialState,

  setStatus: (status) => set({ status }),

  startOutgoing: (session) =>
    set({
      status: 'outgoing',
      session,
      micMuted: false,
      cameraOff: false,
      isScreenSharing: false,
      remoteUsers: {},
    }),

  receiveIncoming: (session) =>
    set({
      status: 'incoming',
      session,
      micMuted: false,
      cameraOff: false,
      isScreenSharing: false,
      remoteUsers: {},
    }),

  setConnecting: () => set({ status: 'connecting' }),

  setConnected: () => set({ status: 'connected' }),

  endCall: () => set({ status: 'ended' }),

  /** Full reset — call this after the "ended" UI fades out */
  reset: () => set(initialState),

  toggleMic: () => {
    const next = !get().micMuted;
    set({ micMuted: next });
    return next;
  },

  toggleCamera: () => {
    const next = !get().cameraOff;
    set({ cameraOff: next });
    return next;
  },

  setScreenSharing: (sharing) => set({ isScreenSharing: sharing }),

  addRemoteUser: (uid) =>
    set((state) => ({
      remoteUsers: {
        ...state.remoteUsers,
        [uid]: state.remoteUsers[uid] || { uid, hasVideo: false, hasAudio: false },
      },
    })),

  removeRemoteUser: (uid) =>
    set((state) => {
      const next = { ...state.remoteUsers };
      delete next[uid];
      return { remoteUsers: next };
    }),

  updateRemoteUser: (uid, changes) =>
    set((state) => ({
      remoteUsers: {
        ...state.remoteUsers,
        [uid]: { ...(state.remoteUsers[uid] || { uid, hasVideo: false, hasAudio: false }), ...changes },
      },
    })),
}));

'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useCallStore } from '@/store/callStore';
import { useSocketEvent } from '@/hooks/useSocket';
import { agoraRTC, type CallType } from '../services/agoraRtc';
import { agoraApi } from '../services/agoraApi';
import { useAuthStore } from '@/store/authStore';

/**
 * Generate a unique channel name for a call.
 * Format: `call-<conversationId>-<timestamp>`
 * The timestamp ensures each call attempt gets a fresh channel.
 */
function makeChannelName(conversationId: number): string {
  return `call-${conversationId}-${Date.now()}`;
}

/* ──────────────── Socket event payload types ──────────────── */

interface IncomingCallPayload {
  conversationId: number;
  channelName: string;
  callType: CallType;
  isGroup?: boolean;
  caller: { id: number; name?: string; email: string; profileImage?: string };
  startedAt: string;
}

interface CallAcceptedPayload {
  channelName: string;
  acceptedBy: number;
  isGroup?: boolean;
}

interface CallRejectedPayload {
  channelName: string;
  rejectedBy: number;
  isGroup?: boolean;
}

interface CallEndedPayload {
  channelName: string;
  endedBy: number;
  isGroup?: boolean;
}

/* ──────────────── The hook ──────────────── */

export function useAgoraCall() {
  const currentUser = useAuthStore((s) => s.user);
  const store = useCallStore();
  /** Keep a ref to the current session so socket handlers see latest value */
  const sessionRef = useRef(store.session);
  sessionRef.current = store.session;

  /* ============================================================
   * AGORA SDK CALLBACKS — wire up service to store
   * ============================================================ */
  useEffect(() => {
    agoraRTC.setCallbacks({
      onUserJoined: (uid) => {
        console.log('[Call] User joined:', uid);
        useCallStore.getState().addRemoteUser(uid);
      },
      onUserLeft: (uid) => {
        console.log('[Call] User left:', uid);
        useCallStore.getState().removeRemoteUser(uid);
      },
      onUserPublished: (user, mediaType) => {
        const uid = Number(user.uid);
        useCallStore
          .getState()
          .updateRemoteUser(uid, mediaType === 'video' ? { hasVideo: true } : { hasAudio: true });
      },
      onUserUnpublished: (user, mediaType) => {
        const uid = Number(user.uid);
        useCallStore
          .getState()
          .updateRemoteUser(uid, mediaType === 'video' ? { hasVideo: false } : { hasAudio: false });
      },
      onConnectionStateChange: (state) => {
        if (state === 'CONNECTED') {
          // Already handled by setConnected() after token + join succeed
        } else if (state === 'DISCONNECTED' || state === 'FAILED') {
          // Server-side disconnect — clean up
          if (useCallStore.getState().status === 'connected') {
            useCallStore.getState().endCall();
          }
        }
      },
    });
  }, []);

  /* ============================================================
   * SOCKET LISTENERS — receive signaling events
   * ============================================================ */

  // 📞 Someone is calling me
  useSocketEvent<IncomingCallPayload>('call:incoming', useCallback((payload) => {
    const state = useCallStore.getState();

    // If already in a call, auto-reject (busy signal)
    if (state.status !== 'idle' && state.status !== 'ended') {
      console.log('[Call] Busy — auto-rejecting incoming call');
      agoraApi
        .reject({
          channelName: payload.channelName,
          participantIds: [payload.caller.id],
          isGroup: payload.isGroup,
        })
        .catch(console.error);
      return;
    }

    const callerName = payload.caller.name || payload.caller.email.split('@')[0];

    // Show incoming call UI
    state.receiveIncoming({
      channelName: payload.channelName,
      callType: payload.callType,
      conversationId: payload.conversationId,
      isGroup: payload.isGroup ?? false,
      participantIds: [payload.caller.id], // For now, will be enriched
      participants: [
        {
          id: payload.caller.id,
          name: callerName,
          email: payload.caller.email,
        },
      ],
      caller: {
        id: payload.caller.id,
        name: callerName,
        email: payload.caller.email,
      },
    });
  }, []));

  // ✅ Receiver accepted — caller transitions to connected
  useSocketEvent<CallAcceptedPayload>('call:accepted', useCallback((payload) => {
    const state = useCallStore.getState();
    if (state.session?.channelName !== payload.channelName) return;
    if (state.status !== 'outgoing') return;

    console.log('[Call] Accepted by user', payload.acceptedBy);
    // We're already in the channel waiting; status is 'outgoing'.
    // Once Agora's user-joined fires, we'll know they actually came in.
    // For UI feedback, transition to connected immediately.
    state.setConnected();
  }, []));

  // ❌ Receiver rejected — for 1-on-1 calls, caller cleans up. For group calls,
  // a single decline is informational and shouldn't tear down the call.
  useSocketEvent<CallRejectedPayload>('call:rejected', useCallback((payload) => {
    const state = useCallStore.getState();
    if (state.session?.channelName !== payload.channelName) return;

    if (state.session?.isGroup) {
      console.log('[Call] User', payload.rejectedBy, 'declined the group call');
      return;
    }

    console.log('[Call] Rejected by user', payload.rejectedBy);
    cleanupCall();
  }, []));

  // 🛑 Someone ended the call. For 1-on-1 calls, both sides drop. For group
  // calls we ignore this — the FE only sends a leave broadcast for 1-on-1
  // calls, and group leavers fall off via Agora's user-left event instead.
  useSocketEvent<CallEndedPayload>('call:ended', useCallback((payload) => {
    const state = useCallStore.getState();
    if (state.session?.channelName !== payload.channelName) return;

    if (state.session?.isGroup) {
      console.log('[Call] User', payload.endedBy, 'left the group call');
      return;
    }

    console.log('[Call] Ended by user', payload.endedBy);
    cleanupCall();
  }, []));

  /* ============================================================
   * INTERNAL HELPERS
   * ============================================================ */

  /** Tear down Agora + reset store. Used on hangup, reject, error. */
  const cleanupCall = useCallback(async () => {
    try {
      await agoraRTC.leave();
    } catch (err) {
      console.error('[Call] Cleanup error:', err);
    }
    useCallStore.getState().endCall();

    // After 2 seconds, fully reset to idle
    setTimeout(() => {
      const status = useCallStore.getState().status;
      if (status === 'ended') {
        useCallStore.getState().reset();
      }
    }, 2000);
  }, []);

  /** Get token + join Agora channel. Used by both startCall and acceptCall. */
  const joinChannel = useCallback(
    async (channelName: string, callType: CallType) => {
      const tokenRes = await agoraApi.getToken(channelName);
      await agoraRTC.join({
        token: tokenRes.token,
        channelName: tokenRes.channelName,
        uid: tokenRes.uid,
        callType,
      });
    },
    []
  );

  /* ============================================================
   * PUBLIC ACTIONS — these are what UI components call
   * ============================================================ */

  /**
   * Start an outgoing call.
   * 1. Join Agora channel as caller (so we're ready when they pick up)
   * 2. Tell backend to ring the receivers
   */
  const startCall = useCallback(
    async (opts: {
      conversationId: number;
      callType: CallType;
      participants: { id: number; name: string; email?: string }[];
      isGroup?: boolean;
    }) => {
      if (!currentUser) throw new Error('Not authenticated');

      const channelName = makeChannelName(opts.conversationId);
      const targetIds = opts.participants.filter((p) => p.id !== currentUser.id).map((p) => p.id);

      if (targetIds.length === 0) {
        throw new Error('No one to call');
      }

      // Set state immediately so UI shows "calling..."
      useCallStore.getState().startOutgoing({
        conversationId: opts.conversationId,
        channelName,
        callType: opts.callType,
        isGroup: opts.isGroup ?? false,
        participantIds: targetIds,
        participants: opts.participants,
      });

      try {
        // Join Agora as publisher so we're ready
        await joinChannel(channelName, opts.callType);

        // Ring the others
        await agoraApi.ring({
          conversationId: opts.conversationId,
          channelName,
          callType: opts.callType,
          participantIds: targetIds,
          isGroup: opts.isGroup ?? false,
        });
      } catch (err) {
        console.error('[Call] startCall failed:', err);
        await cleanupCall();
        throw err;
      }
    },
    [currentUser, joinChannel, cleanupCall]
  );

  /**
   * Accept an incoming call.
   * 1. Tell backend (which notifies caller)
   * 2. Join Agora channel
   */
  const acceptCall = useCallback(async () => {
    const session = sessionRef.current;
    if (!session || !session.caller) return;

    useCallStore.getState().setConnecting();

    try {
      // Tell caller we accepted (do this first so caller's UI updates fast)
      await agoraApi.accept({
        channelName: session.channelName,
        participantIds: [session.caller.id],
        isGroup: session.isGroup,
      });

      // Now join the channel
      await joinChannel(session.channelName, session.callType);

      useCallStore.getState().setConnected();
    } catch (err) {
      console.error('[Call] acceptCall failed:', err);
      await cleanupCall();
      throw err;
    }
  }, [joinChannel, cleanupCall]);

  /** Reject an incoming call */
  const rejectCall = useCallback(async () => {
    const session = sessionRef.current;
    if (!session || !session.caller) {
      useCallStore.getState().reset();
      return;
    }

    try {
      await agoraApi.reject({
        channelName: session.channelName,
        participantIds: [session.caller.id],
        isGroup: session.isGroup,
      });
    } catch (err) {
      console.error('[Call] rejectCall error:', err);
    } finally {
      useCallStore.getState().reset();
    }
  }, []);

  /** End / hang up an active call */
  const endCall = useCallback(async () => {
    const session = sessionRef.current;
    if (!session) {
      useCallStore.getState().reset();
      return;
    }

    try {
      // For group calls, just leave the channel locally — don't kick others.
      // Other participants will see the user-left event from Agora itself.
      if (!session.isGroup) {
        await agoraApi.end({
          channelName: session.channelName,
          participantIds: session.participantIds,
        });
      }
    } catch (err) {
      console.error('[Call] endCall error:', err);
    }

    await cleanupCall();
  }, [cleanupCall]);

  /* ============================================================
   * MEDIA CONTROLS
   * ============================================================ */

  const toggleMic = useCallback(async () => {
    const newMuted = useCallStore.getState().toggleMic();
    await agoraRTC.setMicMuted(newMuted);
  }, []);

  const toggleCamera = useCallback(async () => {
    const newOff = useCallStore.getState().toggleCamera();
    await agoraRTC.setCameraOff(newOff);
  }, []);

  const toggleScreenShare = useCallback(async () => {
    const isSharing = useCallStore.getState().isScreenSharing;
    try {
      if (isSharing) {
        await agoraRTC.stopScreenShare();
        useCallStore.getState().setScreenSharing(false);
      } else {
        await agoraRTC.startScreenShare();
        useCallStore.getState().setScreenSharing(true);
      }
    } catch (err) {
      // User cancelled the screen-pick dialog — not an error
      console.log('[Call] Screen share toggle:', err);
      useCallStore.getState().setScreenSharing(agoraRTC.isCurrentlyScreenSharing());
    }
  }, []);

  return {
    // State (reactive)
    status: store.status,
    session: store.session,
    micMuted: store.micMuted,
    cameraOff: store.cameraOff,
    isScreenSharing: store.isScreenSharing,
    remoteUsers: store.remoteUsers,

    // Actions
    startCall,
    acceptCall,
    rejectCall,
    endCall,

    // Media controls
    toggleMic,
    toggleCamera,
    toggleScreenShare,
  };
}

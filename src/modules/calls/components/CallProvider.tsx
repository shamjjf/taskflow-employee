'use client';

import { useAgoraCall } from '../hooks/useAgoraCall';
import { IncomingCallToast } from './IncomingCallToast';
import { CallWindow } from './CallWindow';

/**
 * Mount this once at the app root (inside the authenticated layout).
 * It listens for incoming calls and shows the appropriate UI based on call state.
 *
 * UI states:
 *   • idle    → renders nothing
 *   • incoming → IncomingCallToast (with ringtone)
 *   • outgoing/connecting/connected → CallWindow
 *   • ended   → CallWindow briefly shows "Call ended", then auto-resets
 */
export function CallProvider() {
  const call = useAgoraCall();

  if (call.status === 'idle' || !call.session) {
    return null;
  }

  if (call.status === 'incoming') {
    return (
      <IncomingCallToast
        session={call.session}
        onAccept={call.acceptCall}
        onReject={call.rejectCall}
      />
    );
  }

  // outgoing / connecting / connected / ended → show CallWindow
  return (
    <CallWindow
      session={call.session}
      status={call.status}
      micMuted={call.micMuted}
      cameraOff={call.cameraOff}
      isScreenSharing={call.isScreenSharing}
      remoteUsers={call.remoteUsers}
      onToggleMic={call.toggleMic}
      onToggleCamera={call.toggleCamera}
      onToggleScreenShare={call.toggleScreenShare}
      onEnd={call.endCall}
    />
  );
}

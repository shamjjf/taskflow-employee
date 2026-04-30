import AgoraRTC, {
  IAgoraRTCClient,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
  ILocalVideoTrack,
  IAgoraRTCRemoteUser,
} from 'agora-rtc-sdk-ng';

const APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID || '';

if (!APP_ID && typeof window !== 'undefined') {
  console.warn('⚠️  NEXT_PUBLIC_AGORA_APP_ID not set');
}

export type CallType = 'audio' | 'video';

export interface RemoteUser {
  uid: number;
  hasVideo: boolean;
  hasAudio: boolean;
  videoTrack?: IAgoraRTCRemoteUser['videoTrack'];
  audioTrack?: IAgoraRTCRemoteUser['audioTrack'];
}

export interface AgoraServiceCallbacks {
  onUserJoined?: (uid: number) => void;
  onUserLeft?: (uid: number) => void;
  onUserPublished?: (user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => void;
  onUserUnpublished?: (user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => void;
  onConnectionStateChange?: (state: string, prevState: string) => void;
}

class AgoraRTCService {
  private client: IAgoraRTCClient | null = null;
  private localAudioTrack: IMicrophoneAudioTrack | null = null;
  private localVideoTrack: ICameraVideoTrack | null = null;
  private localScreenTrack: ILocalVideoTrack | null = null;
  private callbacks: AgoraServiceCallbacks = {};
  private currentChannel: string | null = null;
  private currentUid: number | null = null;
  private isScreenSharing = false;

  /** Set event callbacks (call before join) */
  setCallbacks(callbacks: AgoraServiceCallbacks) {
    this.callbacks = callbacks;
  }

  /** Initialize client + join channel */
  async join(opts: {
    token: string;
    channelName: string;
    uid: number;
    callType: CallType;
  }): Promise<void> {
    if (!APP_ID) throw new Error('Agora App ID not configured');

    // Reuse the same client if it's already in the right state
    if (!this.client) {
      this.client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      this.attachClientListeners();
    }

    // Join the channel
    await this.client.join(APP_ID, opts.channelName, opts.token, opts.uid);
    this.currentChannel = opts.channelName;
    this.currentUid = opts.uid;

    // Create + publish local tracks
    this.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();

    if (opts.callType === 'video') {
      this.localVideoTrack = await AgoraRTC.createCameraVideoTrack({
        encoderConfig: '480p_1', // 640x480, 15fps, 500kbps - good balance
      });
      await this.client.publish([this.localAudioTrack, this.localVideoTrack]);
    } else {
      await this.client.publish([this.localAudioTrack]);
    }
  }

  /** Renew token before expiry (call this from a timer) */
  async renewToken(token: string): Promise<void> {
    if (!this.client) return;
    await this.client.renewToken(token);
  }

  /** Get the local video track to render in a DOM element */
  getLocalVideoTrack(): ICameraVideoTrack | null {
    return this.localVideoTrack;
  }

  /** Get screen share track (when active) */
  getLocalScreenTrack(): ILocalVideoTrack | null {
    return this.localScreenTrack;
  }

  /** Mute / unmute microphone */
  async setMicMuted(muted: boolean): Promise<void> {
    if (!this.localAudioTrack) return;
    await this.localAudioTrack.setMuted(muted);
  }

  /** Turn camera on / off */
  async setCameraOff(off: boolean): Promise<void> {
    if (!this.localVideoTrack) return;
    await this.localVideoTrack.setMuted(off);
  }

  /** Start screen sharing - replaces video track */
  async startScreenShare(): Promise<void> {
    if (!this.client || this.isScreenSharing) return;

    // Create screen track
    const screenTrack = await AgoraRTC.createScreenVideoTrack(
      { encoderConfig: '1080p_1' },
      'disable' // Don't share screen audio (simpler)
    );

    // Handle case where it returns an array
    this.localScreenTrack = Array.isArray(screenTrack) ? screenTrack[0] : screenTrack;

    // Unpublish camera, publish screen
    if (this.localVideoTrack) {
      await this.client.unpublish(this.localVideoTrack);
    }
    await this.client.publish(this.localScreenTrack);

    // Listen for user clicking "Stop sharing" in browser
    this.localScreenTrack.on('track-ended', () => {
      this.stopScreenShare().catch(console.error);
    });

    this.isScreenSharing = true;
  }

  /** Stop screen sharing - restore camera if it existed */
  async stopScreenShare(): Promise<void> {
    if (!this.client || !this.isScreenSharing) return;

    if (this.localScreenTrack) {
      await this.client.unpublish(this.localScreenTrack);
      this.localScreenTrack.close();
      this.localScreenTrack = null;
    }

    // Restore camera if it existed before
    if (this.localVideoTrack) {
      await this.client.publish(this.localVideoTrack);
    }

    this.isScreenSharing = false;
  }

  isCurrentlyScreenSharing(): boolean {
    return this.isScreenSharing;
  }

  /** Leave the channel + clean up all tracks */
  async leave(): Promise<void> {
    try {
      // Stop screen share if active
      if (this.isScreenSharing) {
        await this.stopScreenShare();
      }

      // Close local tracks
      if (this.localAudioTrack) {
        this.localAudioTrack.close();
        this.localAudioTrack = null;
      }
      if (this.localVideoTrack) {
        this.localVideoTrack.close();
        this.localVideoTrack = null;
      }

      // Leave channel
      if (this.client) {
        await this.client.leave();
      }
    } catch (err) {
      console.error('[Agora] Leave error:', err);
    } finally {
      this.currentChannel = null;
      this.currentUid = null;
      this.isScreenSharing = false;
    }
  }

  /** Subscribe + play a remote user's audio/video */
  async subscribeToUser(
    user: IAgoraRTCRemoteUser,
    mediaType: 'audio' | 'video'
  ): Promise<void> {
    if (!this.client) return;
    await this.client.subscribe(user, mediaType);

    if (mediaType === 'audio') {
      // Audio plays automatically
      user.audioTrack?.play();
    }
    // Video needs to be played in a DOM element by the component
  }

  private attachClientListeners() {
    if (!this.client) return;

    this.client.on('user-published', async (user, mediaType) => {
      await this.subscribeToUser(user, mediaType);
      this.callbacks.onUserPublished?.(user, mediaType);
    });

    this.client.on('user-unpublished', (user, mediaType) => {
      this.callbacks.onUserUnpublished?.(user, mediaType);
    });

    this.client.on('user-joined', (user) => {
      this.callbacks.onUserJoined?.(Number(user.uid));
    });

    this.client.on('user-left', (user) => {
      this.callbacks.onUserLeft?.(Number(user.uid));
    });

    this.client.on('connection-state-change', (curState, prevState) => {
      console.log(`[Agora] State: ${prevState} → ${curState}`);
      this.callbacks.onConnectionStateChange?.(curState, prevState);
    });
  }
}

// Singleton — only one call at a time per browser tab
export const agoraRTC = new AgoraRTCService();

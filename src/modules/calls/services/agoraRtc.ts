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

  setCallbacks(callbacks: AgoraServiceCallbacks) {
    this.callbacks = callbacks;
  }

  async join(opts: {
    token: string;
    channelName: string;
    uid: number;
    callType: CallType;
  }): Promise<void> {
    if (!APP_ID) throw new Error('Agora App ID not configured');

    if (!this.client) {
      this.client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      this.attachClientListeners();
    }

    await this.client.join(APP_ID, opts.channelName, opts.token, opts.uid);
    this.currentChannel = opts.channelName;
    this.currentUid = opts.uid;

    this.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();

    if (opts.callType === 'video') {
      this.localVideoTrack = await AgoraRTC.createCameraVideoTrack({
        encoderConfig: '480p_1',
      });
      await this.client.publish([this.localAudioTrack, this.localVideoTrack]);
    } else {
      await this.client.publish([this.localAudioTrack]);
    }
  }

  async renewToken(token: string): Promise<void> {
    if (!this.client) return;
    await this.client.renewToken(token);
  }

  getLocalVideoTrack(): ICameraVideoTrack | null {
    return this.localVideoTrack;
  }

  getLocalScreenTrack(): ILocalVideoTrack | null {
    return this.localScreenTrack;
  }

  async setMicMuted(muted: boolean): Promise<void> {
    if (!this.localAudioTrack) return;
    await this.localAudioTrack.setMuted(muted);
  }

  async setCameraOff(off: boolean): Promise<void> {
    if (!this.localVideoTrack) return;
    await this.localVideoTrack.setMuted(off);
  }

  async startScreenShare(): Promise<void> {
    if (!this.client || this.isScreenSharing) return;

    const screenTrackResult = await AgoraRTC.createScreenVideoTrack(
      { encoderConfig: '1080p_1' },
      'disable'
    );

    // createScreenVideoTrack returns a single track when audio is 'disable'
    const screenTrack: ILocalVideoTrack = Array.isArray(screenTrackResult)
      ? screenTrackResult[0]
      : screenTrackResult;

    if (this.localVideoTrack) {
      await this.client.unpublish(this.localVideoTrack);
    }

    await this.client.publish(screenTrack);

    screenTrack.on('track-ended', () => {
      this.stopScreenShare().catch(console.error);
    });

    this.localScreenTrack = screenTrack;
    this.isScreenSharing = true;
  }

  async stopScreenShare(): Promise<void> {
    if (!this.client || !this.isScreenSharing) return;

    const screenTrack = this.localScreenTrack;
    if (screenTrack) {
      await this.client.unpublish(screenTrack);
      screenTrack.close();
      this.localScreenTrack = null;
    }

    if (this.localVideoTrack) {
      await this.client.publish(this.localVideoTrack);
    }

    this.isScreenSharing = false;
  }

  isCurrentlyScreenSharing(): boolean {
    return this.isScreenSharing;
  }

  async leave(): Promise<void> {
    try {
      if (this.isScreenSharing) {
        await this.stopScreenShare();
      }

      if (this.localAudioTrack) {
        this.localAudioTrack.close();
        this.localAudioTrack = null;
      }
      if (this.localVideoTrack) {
        this.localVideoTrack.close();
        this.localVideoTrack = null;
      }

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

  async subscribeToUser(
    user: IAgoraRTCRemoteUser,
    mediaType: 'audio' | 'video'
  ): Promise<void> {
    if (!this.client) return;
    await this.client.subscribe(user, mediaType);

    if (mediaType === 'audio') {
      user.audioTrack?.play();
    }
  }

  getClient(): IAgoraRTCClient | null {
    return this.client;
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

export const agoraRTC = new AgoraRTCService();

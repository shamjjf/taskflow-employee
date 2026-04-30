import { api } from '@/lib/api';
import type { ApiResponse } from '@/types';

export interface RtcTokenResponse {
  token: string;
  appId: string;
  channelName: string;
  uid: number;
  expiresIn: number;
}

export interface CallParticipant {
  id: number;
  email: string;
}

export type CallType = 'audio' | 'video';

/**
 * Backend API wrapper for Agora call endpoints.
 * Token generation + signaling via existing socket infrastructure.
 */
export const agoraApi = {
  /**
   * Get an RTC token to join the given channel.
   * Server uses authenticated user's id as Agora uid.
   */
  async getToken(channelName: string): Promise<RtcTokenResponse> {
    const res = await api.post<ApiResponse<RtcTokenResponse>>('/agora/token', { channelName });
    if (!res.data) throw new Error('Failed to get Agora token');
    return res.data;
  },

  /**
   * Notify other participants that a call is incoming.
   * They will receive 'call:incoming' socket event and show ringing UI.
   */
  async ring(payload: {
    conversationId: number;
    channelName: string;
    callType: CallType;
    participantIds: number[];
  }): Promise<void> {
    await api.post<ApiResponse<{ ringing: number }>>('/agora/ring', payload);
  },

  /**
   * Signal that the current user accepted the call.
   * Caller (and other ringing devices of receiver) will receive 'call:accepted'.
   */
  async accept(payload: { channelName: string; participantIds: number[] }): Promise<void> {
    await api.post<ApiResponse<{ accepted: boolean }>>('/agora/accept', payload);
  },

  /**
   * Signal that the current user rejected the call.
   * Caller will receive 'call:rejected'.
   */
  async reject(payload: { channelName: string; participantIds: number[] }): Promise<void> {
    await api.post<ApiResponse<{ rejected: boolean }>>('/agora/reject', payload);
  },

  /**
   * Signal that the current user ended/left the call.
   * All participants will receive 'call:ended'.
   */
  async end(payload: { channelName: string; participantIds: number[] }): Promise<void> {
    await api.post<ApiResponse<{ ended: boolean }>>('/agora/end', payload);
  },
};

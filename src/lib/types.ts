// Pure shared types (safe to import from both server and client bundles).

export type PrivacyStatus = 'private' | 'unlisted' | 'public';

export type StreamKeyInfo = {
  broadcastId: string;
  streamId: string;
  title: string;
  ingestUrl: string;
  streamKey: string;
};

export type BroadcastSummary = {
  broadcastId: string;
  streamId: string | null;
  title: string;
  privacy: string;
  broadcastStatus: string;
  scheduledStartTime: string | null;
  createdAt: string | null;
};

export type MeData = {
  email: string;
  name: string;
  picture: string;
  channel: { channelId: string; title: string; thumbnail: string };
};

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

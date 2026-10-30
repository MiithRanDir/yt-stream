// YouTube Data API v3 client (server side only).
// Every function takes a fresh OAuth access token and throws YouTubeError
// with a Thai user-facing message for known failure reasons.

import { ENV } from './env';
import type { BroadcastSummary, PrivacyStatus, StreamKeyInfo } from './types';

export type { BroadcastSummary, PrivacyStatus, StreamKeyInfo };

const YT_BASE = 'https://www.googleapis.com/youtube/v3';

export class YouTubeError extends Error {
  readonly status: number;
  readonly reason: string;

  constructor(status: number, reason: string, message: string) {
    super(message);
    this.name = 'YouTubeError';
    this.status = status;
    this.reason = reason;
  }
}

type YtFetchOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  query?: Record<string, string | number | undefined>;
  body?: unknown;
};

async function ytFetch<T>(
  accessToken: string,
  path: string,
  { method = 'GET', query = {}, body }: YtFetchOptions = {},
): Promise<T> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) params.set(key, String(value));
  }
  const url = `${YT_BASE}${path}?${params.toString()}`;
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new YouTubeError(res.status, ...parseGoogleError(await safeJson(res)));
  }
  return (await res.json()) as T;
}

async function safeJson(res: Response): Promise<Record<string, unknown>> {
  return ((await res.json().catch(() => ({}))) as Record<string, unknown>) ?? {};
}

function parseGoogleError(payload: Record<string, unknown>): [string, string] {
  const err = (payload.error ?? {}) as Record<string, unknown>;
  const first = Array.isArray(err.errors)
    ? (err.errors[0] as Record<string, unknown>)
    : undefined;
  const reason = typeof first?.reason === 'string' ? first.reason : String(err.status ?? '');
  const rawMessage = typeof err.message === 'string' ? err.message : 'YouTube API error';
  return [reason, explain(reason, rawMessage)];
}

// ponytail: keep the reason→Thai mapping in one table so API routes stay thin
// and the UI never sees raw Google error strings.
const REASON_MESSAGES: Record<string, string> = {
  liveStreamingNotEnabled:
    'ช่องนี้ยังไม่ได้เปิดสิทธิ์ไลฟ์สด — ต้องยืนยันเบอร์โทรและเปิดใช้การไลฟ์ก่อน (youtube.com/enable/livestream)',
  insufficientLivePermissions:
    'สิทธิ์ OAuth ไม่ครอบคลุมการจัดการไลฟ์ — กรุณาออกจากระบบแล้วล็อกอินใหม่',
  authError: 'เซสชันหมดอายุหรือถูกเพิกถอน — กรุณาล็อกอินใหม่',
  forbidden: ' YouTube ปฏิเสธคำขอ (forbidden): ',
  quotaExceeded: 'ใช้ quota ของ YouTube API ประจำวันหมดแล้ว — ลองใหม่อีกทีพรุ่งนี้',
  liveBroadcastDeletionNotAllowed:
    'สถานะของไลฟ์นี้ถูกลบไม่ได้ตามกฎ YouTube (เช่นไลฟ์จบไปแล้วและมีการบันทึกไว้)',
  broadcastUpdateLiveBroadcastNotAllowed:
    'แก้ชื่อไม่ได้ระหว่างไลฟ์กำลังสด — หยุดไลฟ์ก่อนแล้วค่อยแก้',
  invalid: 'ข้อมูลส่งไม่ถูกต้องตามกฎ YouTube API: ',
  requiredParamMissing: 'YouTube API ต้องการฟิลด์บังคับเพิ่มเติม',
  keyInvalid: 'Google OAuth credential ไม่ถูกต้อง — เช็ก .env.local',
};

function explain(reason: string, rawMessage: string): string {
  const mapped = REASON_MESSAGES[reason];
  if (mapped) {
    return mapped.endsWith(': ') ? `${mapped}${rawMessage}` : mapped;
  }
  return rawMessage;
}

function extractStreamKey(ingestUrl: string): string {
  const segments = ingestUrl.split('/');
  return segments[segments.length - 1] ?? '';
}

/** Verifies the channel can live-stream and returns its display info. */
export async function getChannel(accessToken: string) {
  const data = await ytFetch<{
    items?: Array<{
      id: string;
      snippet?: { title?: string; thumbnails?: Record<string, { url: string }> };
      contentDetails?: Record<string, unknown>;
    }>;
  }>(accessToken, '/channels', { query: { part: 'snippet,contentDetails', mine: 'true' } });
  const channel = data.items?.[0];
  if (!channel) {
    throw new YouTubeError(403, 'noChannel', 'ไม่พบ YouTube channel สำหรับบัญชีนี้');
  }
  return {
    channelId: channel.id,
    title: channel.snippet?.title ?? 'Unknown channel',
    thumbnail:
      channel.snippet?.thumbnails?.medium?.url ??
      channel.snippet?.thumbnails?.default?.url ??
      '',
  };
}

/**
 * Creates a reusable stream + scheduled broadcast bound to it and returns the
 * stream key. enableAutoStart means YouTube flips the broadcast to "live"
 * automatically as soon as RTMP input arrives — no extra button needed.
 */
export async function createStreamKey(
  accessToken: string,
  input: { title: string; privacy: PrivacyStatus },
): Promise<StreamKeyInfo> {
  const stream = await ytFetch<{ id: string; cdn?: { ingestUrl?: string } }>(
    accessToken,
    '/liveStreams',
    {
      method: 'POST',
      query: { part: 'snippet,cdn' },
      body: {
        snippet: { title: input.title },
        cdn: {
          ingestionType: 'rtmp', // enum in CdnSettings — "YOUTUBE" is rejected as invalid
          format: '1080p',
          resolution: '1080p',
          frameRate: '30fps',
        },
      },
    },
  );
  const ingestUrl = stream.cdn?.ingestUrl;
  if (!ingestUrl) {
    throw new YouTubeError(502, 'missingIngestUrl', 'YouTube ไม่ส่ง stream URL กลับมา — ลองใหม่อีกครั้ง');
  }

  const broadcast = await ytFetch<{ id: string }>(accessToken, '/liveBroadcasts', {
    method: 'POST',
    query: { part: 'snippet,status,contentDetails' },
    body: {
      snippet: {
        title: input.title,
        description: `สร้างผ่าน YT Stream Key (${ENV.appUrl})`,
        scheduledStartTime: new Date().toISOString(),
      },
      status: { privacyStatus: input.privacy },
      contentDetails: {
        enableAutoStart: true,
        enableAutoStop: false,
        enableDvr: true,
        monitorStream: { enableMonitorStream: false },
      },
    },
  });

  await ytFetch(accessToken, '/liveBroadcasts/bind', {
    method: 'POST',
    query: { id: broadcast.id, part: 'snippet', streamId: stream.id },
  });

  return {
    broadcastId: broadcast.id,
    streamId: stream.id,
    title: input.title,
    ingestUrl,
    streamKey: extractStreamKey(ingestUrl),
  };
}

export async function listBroadcasts(accessToken: string): Promise<BroadcastSummary[]> {
  const data = await ytFetch<{
    items?: Array<{
      id: string;
      snippet?: {
        title?: string;
        scheduledStartTime?: string;
        publishedAt?: string;
      };
      status?: { privacyStatus?: string; broadcastStatus?: string };
      contentDetails?: {
        boundStreamId?: string;
        stream?: { id?: string };
        monitorStream?: { streamId?: string };
      };
    }>;
  }>(accessToken, '/liveBroadcasts', {
    query: {
      part: 'snippet,status,contentDetails',
      mine: 'true',
      maxResults: 25,
    },
  });
  return (data.items ?? []).map((item) => ({
    broadcastId: item.id,
    streamId:
      item.contentDetails?.stream?.id ??
      item.contentDetails?.boundStreamId ??
      null,
    title: item.snippet?.title ?? '(ไม่มีชื่อ)',
    privacy: item.status?.privacyStatus ?? 'unknown',
    broadcastStatus: item.status?.broadcastStatus ?? 'unknown',
    scheduledStartTime: item.snippet?.scheduledStartTime ?? null,
    createdAt: item.snippet?.publishedAt ?? null,
  }));
}

export async function getBroadcastStreamKey(
  accessToken: string,
  streamId: string,
): Promise<{ ingestUrl: string; streamKey: string }> {
  const data = await ytFetch<{
    items?: Array<{ cdn?: { ingestUrl?: string } }>;
  }>(accessToken, '/liveStreams', { query: { part: 'cdn', id: streamId } });
  const ingestUrl = data.items?.[0]?.cdn?.ingestUrl;
  if (!ingestUrl) {
    throw new YouTubeError(404, 'streamNotFound', 'ไม่พบสตรีมของไลฟ์นี้ (ถูกลบไปแล้ว?)');
  }
  return { ingestUrl, streamKey: extractStreamKey(ingestUrl) };
}

/** Rename fetches the full resource first because liveBroadcasts.update replaces parts. */
export async function renameBroadcast(
  accessToken: string,
  broadcastId: string,
  title: string,
): Promise<void> {
  const current = await ytFetch<{
    items?: Array<{
      id: string;
      snippet?: Record<string, unknown>;
      status?: Record<string, unknown>;
    }>;
  }>(accessToken, '/liveBroadcasts', {
    query: { part: 'snippet,status', id: broadcastId },
  });
  const broadcast = current.items?.[0];
  if (!broadcast?.snippet) {
    throw new YouTubeError(404, 'notFound', 'ไม่พบไลฟ์นี้บนแชนแนลของคุณ');
  }
  await ytFetch(accessToken, '/liveBroadcasts', {
    method: 'PUT',
    query: { part: 'snippet,status' },
    body: {
      id: broadcast.id,
      snippet: { ...broadcast.snippet, title },
      status: broadcast.status ?? {},
    },
  });
}

/** Ends the broadcast permanently (broadcastStatus → complete). */
export async function stopBroadcast(
  accessToken: string,
  broadcastId: string,
): Promise<void> {
  await ytFetch(accessToken, '/liveBroadcasts/transition', {
    method: 'POST',
    query: { id: broadcastId, part: 'snippet,status', broadcastStatus: 'complete' },
  });
}

/** Deletes the broadcast, then best-effort deletes its bound stream (the key). */
export async function deleteBroadcast(
  accessToken: string,
  target: { broadcastId: string; streamId: string | null },
): Promise<{ streamDeleted: boolean }> {
  await ytFetch(accessToken, '/liveBroadcasts', {
    method: 'DELETE',
    query: { id: target.broadcastId },
  });
  if (target.streamId) {
    try {
      await ytFetch(accessToken, '/liveStreams', {
        method: 'DELETE',
        query: { id: target.streamId },
      });
      return { streamDeleted: true };
    } catch {
      return { streamDeleted: false };
    }
  }
  return { streamDeleted: false };
}

/** Looks up one broadcast so the delete flow can know its bound stream id. */
export async function findBroadcast(
  accessToken: string,
  broadcastId: string,
): Promise<BroadcastSummary | null> {
  const items = await listBroadcasts(accessToken);
  return items.find((item) => item.broadcastId === broadcastId) ?? null;
}

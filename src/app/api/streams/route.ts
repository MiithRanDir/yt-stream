import { NextRequest } from 'next/server';
import { jsonError, withSession } from '@/lib/api';
import {
  createStreamKey,
  listBroadcasts,
  type PrivacyStatus,
} from '@/lib/youtube';

const PRIVACY_VALUES: PrivacyStatus[] = ['private', 'unlisted', 'public'];
const MAX_TITLE_LENGTH = 90; // YouTube hard-limits broadcast titles

/** Lists the channel's broadcasts for the manage screen. */
export async function GET(req: NextRequest) {
  return withSession(req, (session) => listBroadcasts(session.access));
}

/** Creates a stream + auto-start broadcast and returns the stream key. */
export async function POST(req: NextRequest) {
  const payload = (await req.json().catch(() => null)) as {
    title?: string;
    privacy?: string;
  } | null;

  const title = payload?.title?.trim() ?? '';
  if (title.length === 0 || title.length > MAX_TITLE_LENGTH) {
    return jsonError(`ชื่อไลฟ์ต้องยาว 1–${MAX_TITLE_LENGTH} ตัวอักษร`);
  }
  const privacy = payload?.privacy as PrivacyStatus | undefined;
  if (privacy !== undefined && !PRIVACY_VALUES.includes(privacy)) {
    return jsonError('โหมดการมองเห็นไม่ถูกต้อง');
  }

  return withSession(req, (session) =>
    createStreamKey(session.access, { title, privacy: privacy ?? 'private' }),
  );
}

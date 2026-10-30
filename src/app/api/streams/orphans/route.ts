import { NextRequest } from 'next/server';
import { jsonError, withSession } from '@/lib/api';
import { deleteStreams, listOrphanStreams } from '@/lib/youtube';

/** Lists streams not bound to any broadcast (cleanup candidates). */
export async function GET(req: NextRequest) {
  return withSession(req, (session) => listOrphanStreams(session.access));
}

/** Deletes the selected orphan streams. */
export async function DELETE(req: NextRequest) {
  const payload = (await req.json().catch(() => null)) as { ids?: string[] } | null;
  const ids = payload?.ids?.filter((id) => typeof id === 'string' && id.length > 0) ?? [];
  if (ids.length === 0 || ids.length > 100) {
    return jsonError('ไม่มี stream ที่เลือก (หรือเลือกมากเกินไป)');
  }
  return withSession(req, (session) => deleteStreams(session.access, ids));
}

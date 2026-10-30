import { NextRequest } from 'next/server';
import { withSession } from '@/lib/api';
import { findBroadcast, getBroadcastStreamKey, YouTubeError } from '@/lib/youtube';

/** Reveals the stream key for one broadcast (used by the "ดูคีย์" button). */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return withSession(req, async (session) => {
    const broadcast = await findBroadcast(session.access, id);
    if (!broadcast?.streamId) {
      throw new YouTubeError(
        404,
        'unboundBroadcast',
        'ไลฟ์นี้ไม่มีสตรีมผูกอยู่ (ถูกลบหรือยังไม่ bind)',
      );
    }
    return getBroadcastStreamKey(session.access, broadcast.streamId);
  });
}

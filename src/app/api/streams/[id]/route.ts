import { NextRequest } from 'next/server';
import { jsonError, withSession } from '@/lib/api';
import {
  deleteBroadcast,
  findBroadcast,
  renameBroadcast,
  YouTubeError,
} from '@/lib/youtube';

type Context = { params: Promise<{ id: string }> };

/** Renames a broadcast (title change). */
export async function PATCH(req: NextRequest, { params }: Context) {
  const { id } = await params;
  const payload = (await req.json().catch(() => null)) as { title?: string } | null;
  const title = payload?.title?.trim() ?? '';
  if (title.length === 0 || title.length > 90) {
    return jsonError('ชื่อไลฟ์ต้องยาว 1–90 ตัวอักษร');
  }
  return withSession(req, (session) =>
    renameBroadcast(session.access, id, title).then(() => ({ renamed: true })),
  );
}

/** Deletes the broadcast and its bound stream (removes the key). */
export async function DELETE(req: NextRequest, { params }: Context) {
  const { id } = await params;
  return withSession(req, async (session) => {
    const broadcast = await findBroadcast(session.access, id);
    if (!broadcast) {
      throw new YouTubeError(404, 'notFound', 'ไม่พบไลฟ์นี้บนแชนแนลของคุณ');
    }
    const liveStates = ['live', 'liveStarting', 'recording'];
    if (liveStates.includes(broadcast.broadcastStatus)) {
      throw new YouTubeError(
        409,
        'liveInProgress',
        'ไลฟ์กำลังสดอยู่ — กด "หยุดไลฟ์" ก่อนค่อยลบ',
      );
    }
    return deleteBroadcast(session.access, {
      broadcastId: broadcast.broadcastId,
      streamId: broadcast.streamId,
    });
  });
}

import { NextRequest } from 'next/server';
import { withSession } from '@/lib/api';
import { stopBroadcast } from '@/lib/youtube';

/** Transitions the broadcast to `complete` (ends the live stream). */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return withSession(req, (session) =>
    stopBroadcast(session.access, id).then(() => ({ stopped: true })),
  );
}

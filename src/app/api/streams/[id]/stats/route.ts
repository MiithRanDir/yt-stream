import { NextRequest } from 'next/server';
import { withSession } from '@/lib/api';
import { getBroadcastStats } from '@/lib/youtube';

/** Viewer count + live duration for one broadcast (polled by the stats modal). */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return withSession(req, (session) => getBroadcastStats(session.access, id));
}

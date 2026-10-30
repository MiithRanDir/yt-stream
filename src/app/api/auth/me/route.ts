import { NextRequest, NextResponse } from 'next/server';
import { withSession } from '@/lib/api';
import { getChannel } from '@/lib/youtube';

/** Returns the logged-in Google profile plus YouTube channel info. */
export async function GET(req: NextRequest) {
  return withSession(req, async (session) => {
    const channel = await getChannel(session.access);
    return {
      email: session.email,
      name: session.name,
      picture: session.picture,
      channel,
    };
  }) as Promise<NextResponse>;
}

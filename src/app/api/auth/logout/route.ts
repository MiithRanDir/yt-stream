import { NextResponse } from 'next/server';
import { sessionCookieOptions } from '@/lib/session';

/** Clears the session cookie. Google-side revocation is left to the user's
 *  security settings, which is fine for a personal tool. */
export function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(sessionCookieOptions());
  return res;
}

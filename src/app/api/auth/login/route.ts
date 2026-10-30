import { randomBytes } from 'node:crypto';
import { NextResponse } from 'next/server';
import { ENV, googleConfigured } from '@/lib/env';
import { buildAuthUrl } from '@/lib/oauth';
import { STATE_COOKIE } from '@/lib/session';

/** Starts the Google OAuth flow with a CSRF state token stored in a cookie. */
export function GET() {
  if (!googleConfigured) {
    return NextResponse.redirect(`${ENV.appUrl}/?error=config`);
  }
  const state = randomBytes(16).toString('hex');
  const res = NextResponse.redirect(buildAuthUrl(state));
  res.cookies.set({
    name: STATE_COOKIE,
    value: state,
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 600,
  });
  return res;
}

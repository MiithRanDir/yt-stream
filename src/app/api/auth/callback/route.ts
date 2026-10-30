import { NextRequest, NextResponse } from 'next/server';
import { ENV } from '@/lib/env';
import { decodeIdToken, exchangeCodeForTokens } from '@/lib/oauth';
import { sessionCookieOptions, STATE_COOKIE, type SessionData } from '@/lib/session';
import { getChannel, YouTubeError } from '@/lib/youtube';

/** OAuth redirect target: validates state, exchanges code, creates session. */
export async function GET(req: NextRequest) {
  const fail = (reason: string, detail?: string) => {
    const q = new URLSearchParams({ error: reason });
    if (detail) q.set('detail', detail.slice(0, 300));
    return NextResponse.redirect(`${ENV.appUrl}/?${q.toString()}`);
  };

  const { code, state, error } = Object.fromEntries(req.nextUrl.searchParams) as {
    code?: string;
    state?: string;
    error?: string;
  };
  if (error === 'access_denied') return fail('cancelled');
  if (!code || !state) return fail('badcallback');

  const expectedState = req.cookies.get(STATE_COOKIE)?.value;
  if (!expectedState || expectedState !== state) return fail('state');

  let session: SessionData;
  try {
    const tokens = await exchangeCodeForTokens(code);
    const profile =
      (tokens.idToken ? decodeIdToken(tokens.idToken) : null) ??
      (await fetchProfile(tokens.access));
    // Fail fast if this Google account cannot stream at all.
    await getChannel(tokens.access);
    session = {
      email: profile.email,
      name: profile.name,
      picture: profile.picture,
      access: tokens.access,
      refresh: tokens.refresh,
      expiresAt: tokens.expiresAt,
    };
  } catch (err) {
    console.error('[auth/callback]', err);
    const detail =
      err instanceof YouTubeError
        ? `${err.reason}: ${err.message}`
        : err instanceof Error
          ? err.message
          : String(err);
    return fail('youtube', detail);
  }

  const res = NextResponse.redirect(`${ENV.appUrl}/dashboard`);
  res.cookies.set({ name: STATE_COOKIE, value: '', path: '/', maxAge: 0 });
  res.cookies.set(sessionCookieOptions(session));
  return res;
}

async function fetchProfile(accessToken: string) {
  const res = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  });
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  return {
    email: typeof json.email === 'string' ? json.email : '',
    name: typeof json.name === 'string' ? json.name : '',
    picture: typeof json.picture === 'string' ? json.picture : '',
  };
}

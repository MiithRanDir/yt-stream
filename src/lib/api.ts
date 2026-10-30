// Shared response envelope + route wrapper for all /api routes.
// Guarantees: 401 when logged out, auto token refresh with cookie rewrite,
// and Thai-friendly error messages from YouTubeError/OAuthError.

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  SESSION_COOKIE,
  readSessionFromCookieHeader,
  sessionCookieOptions,
  type SessionData,
} from './session';
import { ensureFreshSession, OAuthError } from './oauth';
import { YouTubeError } from './youtube';
import type { ApiResult } from './types';

export type { ApiResult };

export function jsonOk<T>(data: T): NextResponse<ApiResult<T>> {
  return NextResponse.json({ ok: true, data } as ApiResult<T>);
}

export function jsonError(message: string, status = 400): NextResponse<ApiResult<never>> {
  return NextResponse.json({ ok: false, error: message } as ApiResult<never>, {
    status,
  });
}

/** Reads the session in a React Server Component (page guard). */
export async function readSessionFromStore(): Promise<SessionData | null> {
  const store = await cookies();
  return readSessionFromCookieHeader(store.get(SESSION_COOKIE)?.value);
}

type Handler<T> = (session: SessionData) => Promise<T>;

/**
 * Wraps an API route: resolves a fresh session, runs the handler, and maps
 * errors. When the access token rotates, the rewritten cookie is attached to
 * the outgoing response.
 */
export async function withSession<T>(
  req: NextRequest,
  handler: Handler<T>,
): Promise<NextResponse<ApiResult<T>>> {
  const stored = readSessionFromCookieHeader(req.cookies.get(SESSION_COOKIE)?.value);
  if (!stored) {
    return jsonError('กรุณาล็อกอินใหม่', 401);
  }
  let session = stored;
  let rotated = false;
  try {
    [session, rotated] = await ensureFreshSession(stored);
    const result = await handler(session);
    const res = jsonOk(result);
    if (rotated) res.cookies.set(sessionCookieOptions(session));
    return res;
  } catch (error) {
    if (error instanceof YouTubeError) {
      if (error.status === 401) {
        const res = jsonError('เซสชันหมดอายุ — กรุณาล็อกอินใหม่', 401);
        res.cookies.set(sessionCookieOptions());
        return res;
      }
      return jsonError(error.message, error.status >= 400 && error.status < 600 ? error.status : 502);
    }
    if (error instanceof OAuthError) {
      const res = jsonError('เชื่อมต่อกับ Google ไม่สำเร็จ — กรุณาล็อกอินใหม่', 401);
      res.cookies.set(sessionCookieOptions());
      return res;
    }
    console.error('[api] unexpected error', error);
    return jsonError('เกิดข้อผิดพลาดไม่ทราบสาเหตุ', 500);
  }
}

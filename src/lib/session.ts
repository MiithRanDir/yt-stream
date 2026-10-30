// Encrypted httpOnly cookie session.
// ponytail: we hand-roll AES-256-GCM instead of a session library because the
// payload is tiny (tokens + profile) and we need the codec usable from both
// route handlers (NextRequest) and server components (await cookies()).

import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'node:crypto';
import { ENV, isSecureApp } from './env';

export type SessionData = {
  email: string;
  name: string;
  picture: string;
  access: string;
  refresh: string;
  /** epoch millis when the current access token expires */
  expiresAt: number;
};

export const SESSION_COOKIE = 'ytsess';
export const STATE_COOKIE = 'ytsstate';
const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

const aesKey = createHash('sha256').update(ENV.sessionSecret).digest();

export function encryptSession(data: SessionData): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', aesKey, iv);
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(data), 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [
    iv.toString('base64url'),
    ciphertext.toString('base64url'),
    tag.toString('base64url'),
  ].join('.');
}

export function decryptSession(token: string): SessionData | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const iv = Buffer.from(parts[0], 'base64url');
    const ciphertext = Buffer.from(parts[1], 'base64url');
    const tag = Buffer.from(parts[2], 'base64url');
    const decipher = createDecipheriv('aes-256-gcm', aesKey, iv);
    decipher.setAuthTag(tag);
    const plain = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]).toString('utf8');
    return JSON.parse(plain) as SessionData;
  } catch {
    return null;
  }
}

export function sessionCookieOptions(data?: SessionData) {
  return {
    name: SESSION_COOKIE,
    value: data ? encryptSession(data) : '',
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: isSecureApp,
    path: '/',
    maxAge: data ? SESSION_MAX_AGE : 0,
  };
}

export function readSessionFromCookieHeader(
  cookieValue?: string | null,
): SessionData | null {
  if (!cookieValue) return null;
  return decryptSession(cookieValue);
}

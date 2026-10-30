// Google OAuth 2.0 authorization-code flow (server side only).
// The client secret never reaches the browser; only the encrypted session
// cookie (access + refresh token) is stored client-side.

import { ENV, OAUTH_SCOPES, REDIRECT_URI } from './env';
import type { SessionData } from './session';

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';

export type GoogleTokens = {
  access: string;
  refresh: string;
  expiresAt: number;
  idToken?: string;
};

export function buildAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: ENV.clientId,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: OAUTH_SCOPES,
    state,
    access_type: 'offline', // required to receive a refresh token
    prompt: 'consent', // force refresh token issuance on re-consent
    include_granted_scopes: 'true',
  });
  return `${AUTH_URL}?${params.toString()}`;
}

async function postForm(
  body: URLSearchParams,
): Promise<{ ok: boolean; status: number; json: Record<string, unknown> }> {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    cache: 'no-store',
  });
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  return { ok: res.ok, status: res.status, json };
}

/** Exchanges the authorization code from the OAuth callback for tokens. */
export async function exchangeCodeForTokens(
  code: string,
): Promise<GoogleTokens> {
  const body = new URLSearchParams({
    code,
    client_id: ENV.clientId,
    client_secret: ENV.clientSecret,
    redirect_uri: REDIRECT_URI,
    grant_type: 'authorization_code',
  });
  const { ok, status, json } = await postForm(body);
  if (!ok) {
    throw new OAuthError(
      typeof json.error_description === 'string'
        ? json.error_description
        : `token exchange failed (${status})`,
    );
  }
  return toTokens(json);
}

/** Uses the stored refresh token to mint a new access token. */
export async function refreshAccessToken(
  refreshToken: string,
): Promise<GoogleTokens> {
  const body = new URLSearchParams({
    refresh_token: refreshToken,
    client_id: ENV.clientId,
    client_secret: ENV.clientSecret,
    grant_type: 'refresh_token',
  });
  const { ok, status, json } = await postForm(body);
  if (!ok) {
    throw new OAuthError(
      typeof json.error === 'string'
        ? `refresh failed: ${json.error} (${status})`
        : `refresh failed (${status})`,
    );
  }
  return toTokens(json, refreshToken);
}

function toTokens(
  json: Record<string, unknown>,
  fallbackRefresh?: string,
): GoogleTokens {
  const access = json.access_token;
  if (typeof access !== 'string') {
    throw new OAuthError('Google response missing access_token');
  }
  const refresh =
    typeof json.refresh_token === 'string'
      ? json.refresh_token
      : fallbackRefresh;
  if (!refresh) {
    throw new OAuthError('Google response missing refresh_token');
  }
  const expiresIn =
    typeof json.expires_in === 'number' ? json.expires_in : 3600;
  return {
    access,
    refresh,
    expiresAt: Date.now() + (expiresIn - 60) * 1000, // 60s safety margin
    idToken: typeof json.id_token === 'string' ? json.id_token : undefined,
  };
}

/**
 * Returns a session with a guaranteed-fresh access token.
 * The second element is true when the token was rotated and the caller must
 * rewrite the session cookie on the response.
 */
export async function ensureFreshSession(
  session: SessionData,
): Promise<[SessionData, boolean]> {
  if (Date.now() < session.expiresAt) {
    return [session, false];
  }
  const tokens = await refreshAccessToken(session.refresh);
  return [
    {
      ...session,
      access: tokens.access,
      refresh: tokens.refresh,
      expiresAt: tokens.expiresAt,
    },
    true,
  ];
}

export class OAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OAuthError';
  }
}

/** Minimal claims we need from the ID token (signature is verified by Google at exchange time). */
export type GoogleProfile = {
  email: string;
  name: string;
  picture: string;
};

export function decodeIdToken(idToken: string): GoogleProfile | null {
  const parts = idToken.split('.');
  if (parts.length !== 3) return null;
  try {
    const claims = JSON.parse(
      Buffer.from(parts[1], 'base64url').toString('utf8'),
    ) as Record<string, unknown>;
    return {
      email: typeof claims.email === 'string' ? claims.email : '',
      name: typeof claims.name === 'string' ? claims.name : '',
      picture: typeof claims.picture === 'string' ? claims.picture : '',
    };
  } catch {
    return null;
  }
}

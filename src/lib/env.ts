// Central env access for the server side of the app.
// APP_URL drives the OAuth redirect URI, so it must match an Authorized
// redirect URI registered in Google Cloud Console.

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

export const ENV = {
  clientId: process.env.GOOGLE_CLIENT_ID ?? '',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
  appUrl: trimTrailingSlash(process.env.APP_URL ?? 'http://localhost:3000'),
  // In dev we fall back to a fixed string so `npm run dev` works without setup;
  // production (Vercel) must set SESSION_SECRET.
  sessionSecret:
    process.env.SESSION_SECRET ?? 'yt-stream-dev-secret-change-me-in-prod',
};

export const OAUTH_SCOPES = [
  'https://www.googleapis.com/auth/youtube',
  'openid',
  'email',
  'profile',
].join(' ');

export const REDIRECT_URI = `${ENV.appUrl}/api/auth/callback`;

export const googleConfigured =
  ENV.clientId !== '' && ENV.clientSecret !== '';

export const isSecureApp = ENV.appUrl.startsWith('https://');

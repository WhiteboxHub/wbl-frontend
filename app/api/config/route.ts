import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const envKey = process.env.POSTHOG_KEY;
  const envPubKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  let resolvedKey = '';
  if (typeof envKey === 'string' && envKey.trim().length > 0) {
    resolvedKey = envKey.trim();
  } else if (typeof envPubKey === 'string' && envPubKey.trim().length > 0) {
    resolvedKey = envPubKey.trim();
  }

  const envHost = process.env.POSTHOG_HOST;
  const envPubHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;
  let resolvedHost = 'https://us.i.posthog.com';
  if (typeof envHost === 'string' && envHost.trim().length > 0) {
    resolvedHost = envHost.trim();
  } else if (typeof envPubHost === 'string' && envPubHost.trim().length > 0) {
    resolvedHost = envPubHost.trim();
  }

  return NextResponse.json({
    posthogKey: resolvedKey,
    posthogHost: resolvedHost,
  });
}

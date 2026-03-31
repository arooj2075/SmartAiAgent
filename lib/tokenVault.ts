import { getSession } from '@auth0/nextjs-auth0/edge';
import { NextRequest, NextResponse } from 'next/server';

export async function getAuth0Token(req: NextRequest) {
  try {
    const res = new NextResponse();
    const session = await getSession(req, res);

    if (!session?.accessToken) {
      throw new Error('No access token available in the current session');
    }

    return session.accessToken;
  } catch (err) {
    console.error('Failed to fetch access token:', err);
    throw err;
  }
}

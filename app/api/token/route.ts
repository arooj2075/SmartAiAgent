// app/api/token/route.ts
import { NextRequest } from 'next/server';
import { getAuth0Token } from '@/lib/tokenVault';

export async function GET(req: NextRequest) {
  try {
    const accessToken = await getAuth0Token(req);

    return Response.json({ token: accessToken }, { status: 200 });
  } catch (err) {
    console.error(err);
    return Response.json({ error: 'Failed to get token' }, { status: 500 });
  }
}

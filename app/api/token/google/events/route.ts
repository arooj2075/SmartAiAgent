import { NextRequest } from 'next/server';
import { listCalendarEvents } from '@/lib/googleApi';

export async function GET(req: NextRequest) {
  try {
    const cookieHeader = req.headers.get('cookie') ?? '';

    const exchangeRes = await fetch(
      `${process.env.AUTH0_BASE_URL}/api/exchange-google-token`,
      {
        method: 'POST',
        headers: {
          cookie: cookieHeader,
        },
      }
    );

    const exchangeData = await exchangeRes.json();

    if (!exchangeRes.ok) {
      return Response.json(
        {
          error:
            exchangeData.error ||
            'Failed to exchange Auth0 token for Google token.',
        },
        { status: 500 }
      );
    }

    const googleAccessToken = exchangeData.access_token;

    if (!googleAccessToken) {
      return Response.json(
        { error: 'No Google access token was returned from Token Vault exchange.' },
        { status: 500 }
      );
    }

    const events = await listCalendarEvents(googleAccessToken);
    return Response.json({ events }, { status: 200 });
  } catch (err) {
    console.error('Failed to fetch Google Calendar events:', err);
    return Response.json(
      { error: 'Failed to fetch Google Calendar events' },
      { status: 500 }
    );
  }
}

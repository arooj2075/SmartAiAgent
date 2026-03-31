import { getAccessToken } from '@auth0/nextjs-auth0';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { accessToken } = await getAccessToken(req, res);

    if (!accessToken) {
      return res.status(401).json({ error: 'No My Account API token found' });
    }

    const redirectUri = 'http://localhost:3000/connected-accounts/callback';

    const auth0Response = await fetch(
      `https://${process.env.AUTH0_DOMAIN}/me/v1/connected-accounts/connect`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          connection: process.env.AUTH0_CONNECTION || 'google-oauth2',
          redirect_uri: redirectUri,
          state: 'google-calendar-connect',
          scopes: [
            'openid',
            'profile',
            'https://www.googleapis.com/auth/calendar.readonly',
            'https://www.googleapis.com/auth/calendar.events',
          ],
        }),
      }
    );

    const data = await auth0Response.json();

    if (!auth0Response.ok) {
      return res.status(auth0Response.status).json({
        error: data.message || data.error || 'Failed to create connect URI',
        details: data,
      });
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error('connect-google error:', err);
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Internal server error',
    });
  }
}


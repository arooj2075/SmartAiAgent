import { getAccessToken } from '@auth0/nextjs-auth0';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { auth_session, connect_code } = req.body || {};

    if (!auth_session || !connect_code) {
      return res.status(400).json({ error: 'Missing auth_session or connect_code' });
    }

    const { accessToken } = await getAccessToken(req, res);

    if (!accessToken) {
      return res.status(401).json({ error: 'No My Account API token found' });
    }

    const redirectUri = 'http://localhost:3000/connected-accounts/callback';

    const auth0Response = await fetch(
      `https://${process.env.AUTH0_DOMAIN}/me/v1/connected-accounts/complete`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          auth_session,
          connect_code,
          redirect_uri: redirectUri,
        }),
      }
    );

    const data = await auth0Response.json();

    if (!auth0Response.ok) {
      return res.status(auth0Response.status).json({
        error: data.message || data.error || 'Failed to complete Google connection',
        details: data,
      });
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error('complete-google-connect error:', err);
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Internal server error',
    });
  }
}


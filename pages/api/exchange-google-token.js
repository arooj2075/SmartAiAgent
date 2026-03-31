import { getAccessToken } from '@auth0/nextjs-auth0';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { accessToken: subjectToken } = await getAccessToken(req, res);

    if (!subjectToken) {
      return res.status(401).json({ error: 'No Auth0 access token found' });
    }

    const auth0Response = await fetch(
      `https://${process.env.AUTH0_DOMAIN}/oauth/token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          grant_type:
            'urn:auth0:params:oauth:grant-type:token-exchange:federated-connection-access-token',
          client_id: process.env.AUTH0_EXCHANGE_CLIENT_ID,
          client_secret: process.env.AUTH0_EXCHANGE_CLIENT_SECRET,
          subject_token_type: 'urn:ietf:params:oauth:token-type:access_token',
          subject_token: subjectToken,
          requested_token_type:
            'http://auth0.com/oauth/token-type/federated-connection-access-token',
          connection: process.env.AUTH0_CONNECTION || 'google-oauth2',
        }),
      }
    );

    const data = await auth0Response.json();

    if (!auth0Response.ok) {
      return res.status(auth0Response.status).json({
        error: data.error_description || data.error || 'Failed to exchange Google token',
        details: data,
      });
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error('exchange-google-token error:', err);
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Internal server error',
    });
  }
}

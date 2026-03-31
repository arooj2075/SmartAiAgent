'use client';

import { useEffect, useState } from 'react';

export default function ConnectedAccountsCallbackPage() {
  const [message, setMessage] = useState('Completing Google connection...');

  useEffect(() => {
    const run = async () => {
      try {
        const queryParams = new URLSearchParams(window.location.search);
        const hash = window.location.hash.startsWith('#')
          ? window.location.hash.slice(1)
          : window.location.hash;
        const hashParams = new URLSearchParams(hash);

        const connectCode =
          queryParams.get('connect_code') ||
          hashParams.get('connect_code') ||
          queryParams.get('code') ||
          hashParams.get('code');

        const authSession = sessionStorage.getItem('auth_session');

        if (!connectCode || !authSession) {
          setMessage(
            JSON.stringify({
              missing_connect_code: !connectCode,
              missing_auth_session: !authSession,
              search: window.location.search,
              hash: window.location.hash,
            })
          );
          return;
        }

        const res = await fetch('/api/complete-google-connect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            auth_session: authSession,
            connect_code: connectCode,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          setMessage(
            data.details
              ? JSON.stringify(data.details)
              : data.error || 'Failed to complete connection.'
          );
          return;
        }

        sessionStorage.removeItem('auth_session');
        setMessage('Google account connected successfully. You can go back to the home page.');
      } catch (err) {
        setMessage(err instanceof Error ? err.message : 'Failed to complete connection.');
      }
    };

    run();
  }, []);

  return (
    <div style={{ padding: 40, textAlign: 'center' }}>
      <h1>Google Connection</h1>
      <p style={{ whiteSpace: 'pre-wrap' }}>{message}</p>
      <a href="/" style={{ color: 'blue' }}>
        Back to Home
      </a>
    </div>
  );
}

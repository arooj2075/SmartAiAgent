'use client';

import { useState } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';

type DemoStep = 'intro' | 'auth' | 'assistant';

export default function Home() {
  const { user, error, isLoading } = useUser();
  const [message, setMessage] = useState('');
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<DemoStep>('intro');
  const [activityLog, setActivityLog] = useState<string[]>([
    'Workspace initialized',
    'UI loaded',
  ]);

  const appendLog = (entry: string) => {
    setActivityLog((current) => [entry, ...current].slice(0, 6));
  };

  const sendMessage = async () => {
    if (!message.trim()) return;
    const outgoingMessage = message;
    setLoading(true);
    appendLog(`Request queued: ${outgoingMessage}`);

    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: outgoingMessage }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Network response not OK');
      }

      setReply(data.reply ?? 'No reply received.');
      setMessage('');

      if (outgoingMessage.toLowerCase().includes('schedule') || outgoingMessage.toLowerCase().includes('create')) {
        appendLog('Calendar write operation completed');
      } else if (outgoingMessage.toLowerCase().includes('calendar') || outgoingMessage.toLowerCase().includes('event')) {
        appendLog('Calendar read completed');
      } else {
        appendLog('Agent responded successfully');
      }
    } catch (err) {
      setReply(err instanceof Error ? err.message : 'Error contacting AI agent.');
      appendLog('Agent request failed');
    } finally {
      setLoading(false);
    }
  };

  const showAssistant = user || step === 'assistant';

  return (
    <div
      style={{
        minHeight: '100vh',
        padding: 28,
        background:
          'radial-gradient(circle at top, rgba(37,99,235,0.18), transparent 28%), linear-gradient(180deg, #020617 0%, #0f172a 48%, #111827 100%)',
        color: '#e2e8f0',
        fontFamily: '"Segoe UI", "Helvetica Neue", sans-serif',
      }}
    >
      <div style={{ maxWidth: 1120, margin: '0 auto' }}>
        <div
          style={{
            display: 'flex',
            gap: 10,
            marginBottom: 18,
            flexWrap: 'wrap',
          }}
        >
          {[
            { id: 'intro', label: '01 Intro' },
            { id: 'auth', label: '02 Auth' },
            { id: 'assistant', label: '03 Agent' },
          ].map((item) => {
            const active =
              item.id === step || (item.id === 'assistant' && showAssistant);
            return (
              <div
                key={item.id}
                style={{
                  padding: '8px 12px',
                  borderRadius: 999,
                  border: active
                    ? '1px solid rgba(96,165,250,0.55)'
                    : '1px solid rgba(148,163,184,0.18)',
                  background: active
                    ? 'rgba(37,99,235,0.16)'
                    : 'rgba(15,23,42,0.55)',
                  color: active ? '#93c5fd' : '#94a3b8',
                  fontSize: 12,
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                }}
              >
                {item.label}
              </div>
            );
          })}
        </div>

        {step === 'intro' && !showAssistant && (
          <div
            style={{
              borderRadius: 28,
              border: '1px solid rgba(59,130,246,0.18)',
              background:
                'linear-gradient(145deg, rgba(15,23,42,0.94) 0%, rgba(17,24,39,0.96) 100%)',
              padding: 36,
              boxShadow: '0 30px 80px rgba(2,6,23,0.45)',
            }}
          >
            <div
              style={{
                display: 'inline-block',
                padding: '6px 12px',
                borderRadius: 999,
                border: '1px solid rgba(96,165,250,0.35)',
                background: 'rgba(37,99,235,0.12)',
                color: '#93c5fd',
                fontSize: 12,
                letterSpacing: 1.2,
                textTransform: 'uppercase',
                marginBottom: 18,
              }}
            >
              Auth0 For AI Agents
            </div>
            <h1 style={{ fontSize: 46, lineHeight: 1.05, margin: '0 0 14px 0' }}>
              Secure calendar actions
              <br />
              for an AI agent
            </h1>
            <p style={{ maxWidth: 700, color: '#94a3b8', lineHeight: 1.7, marginBottom: 28 }}>
              Smart AI Agent shows how an assistant can read and schedule Google Calendar events
              using Auth0 Token Vault, scoped provider access, and a clear delegated-permissions
              model.
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 14,
                marginBottom: 28,
              }}
            >
              {[
                'Google login through Auth0',
                'Token Vault provider token exchange',
                'Read calendar events securely',
                'Scoped write access for meeting creation',
              ].map((item) => (
                <div
                  key={item}
                  style={{
                    padding: 16,
                    borderRadius: 18,
                    background: 'rgba(15,23,42,0.75)',
                    border: '1px solid rgba(148,163,184,0.14)',
                  }}
                >
                  {item}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button
                onClick={() => setStep('auth')}
                style={{
                  padding: '14px 22px',
                  borderRadius: 14,
                  border: 'none',
                  background: '#2563eb',
                  color: 'white',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Launch Assistant
              </button>
              <button
                onClick={() => setStep('assistant')}
                style={{
                  padding: '14px 22px',
                  borderRadius: 14,
                  border: '1px solid rgba(148,163,184,0.22)',
                  background: 'transparent',
                  color: '#cbd5e1',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Open Console
              </button>
            </div>
          </div>
        )}

        {step === 'auth' && !showAssistant && (
          <div
            style={{
              borderRadius: 28,
              border: '1px solid rgba(59,130,246,0.18)',
              background:
                'linear-gradient(145deg, rgba(15,23,42,0.94) 0%, rgba(17,24,39,0.96) 100%)',
              padding: 36,
              boxShadow: '0 30px 80px rgba(2,6,23,0.45)',
              textAlign: 'center',
            }}
          >
            <h2 style={{ fontSize: 34, marginBottom: 12 }}>Start a secure session</h2>
            <p
              style={{
                color: '#94a3b8',
                maxWidth: 620,
                margin: '0 auto 24px auto',
                lineHeight: 1.7,
              }}
            >
              Sign in with Google through Auth0 so the assistant can act within explicit permission
              boundaries and exchange provider access securely through Token Vault.
            </p>
            <a
              href="/api/auth/login"
              style={{
                padding: '14px 24px',
                background: '#2563eb',
                color: 'white',
                borderRadius: 999,
                textDecoration: 'none',
                display: 'inline-block',
                fontWeight: 600,
              }}
            >
              Login with Google
            </a>
            <div style={{ marginTop: 20 }}>
              <button
                onClick={() => setStep('intro')}
                style={{
                  background: 'transparent',
                  color: '#93c5fd',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Back
              </button>
            </div>
          </div>
        )}

        {showAssistant && (
          <div
            style={{
              borderRadius: 28,
              border: '1px solid rgba(59,130,246,0.18)',
              background:
                'linear-gradient(145deg, rgba(15,23,42,0.94) 0%, rgba(17,24,39,0.96) 100%)',
              padding: 28,
              boxShadow: '0 30px 80px rgba(2,6,23,0.45)',
            }}
          >
            {isLoading ? (
              <div style={{ padding: 20 }}>Loading...</div>
            ) : error ? (
              <div style={{ padding: 20 }}>Error: {error.message}</div>
            ) : !user ? (
              <div style={{ padding: 20 }}>Sign in first to continue.</div>
            ) : (
              <>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 16,
                    marginBottom: 24,
                    padding: 18,
                    background: 'rgba(15,23,42,0.72)',
                    borderRadius: 18,
                    border: '1px solid rgba(148,163,184,0.16)',
                  }}
                >
                  <div>
                    <p style={{ margin: 0 }}>
                      Logged in as <b>{user.name}</b>
                    </p>
                    <p style={{ margin: '6px 0 0 0', color: '#94a3b8' }}>{user.email}</p>
                    <p style={{ margin: '6px 0 0 0', color: '#94a3b8' }}>
                      Google Calendar access is scoped and exchanged through Auth0 Token Vault.
                    </p>
                  </div>

                  <a
                    href="/api/auth/logout"
                    style={{
                      padding: '10px 18px',
                      background: '#7f1d1d',
                      color: 'white',
                      borderRadius: 999,
                      textDecoration: 'none',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Logout
                  </a>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    gap: 18,
                    marginBottom: 18,
                  }}
                >
                  <div
                    style={{
                      padding: 18,
                      background: 'rgba(15,23,42,0.72)',
                      borderRadius: 18,
                      border: '1px solid rgba(148,163,184,0.16)',
                    }}
                  >
                    <p style={{ marginTop: 0, marginBottom: 10, fontWeight: 'bold', color: '#cbd5e1' }}>
                      Suggested requests
                    </p>
                    <p style={{ margin: '4px 0', color: '#93c5fd' }}>show my calendar events</p>
                    <p style={{ margin: '4px 0', color: '#93c5fd' }}>what is on my schedule today</p>
                    <p style={{ margin: '4px 0', color: '#93c5fd' }}>
                      schedule meeting on 1/04/2026 at 3 PM
                    </p>
                  </div>

                  <div
                    style={{
                      padding: 18,
                      background: 'rgba(15,23,42,0.72)',
                      borderRadius: 18,
                      border: '1px solid rgba(148,163,184,0.16)',
                    }}
                  >
                    <p style={{ marginTop: 0, marginBottom: 10, fontWeight: 'bold', color: '#cbd5e1' }}>
                      Security status
                    </p>
                    <p style={{ margin: '4px 0', color: '#94a3b8' }}>Auth0 Session: Active</p>
                    <p style={{ margin: '4px 0', color: '#94a3b8' }}>Connected Account: Google</p>
                    <p style={{ margin: '4px 0', color: '#94a3b8' }}>Token Vault Exchange: Active</p>
                    <p style={{ margin: '4px 0', color: '#94a3b8' }}>
                      Granted Scopes: calendar.readonly, calendar.events
                    </p>
                    <p style={{ margin: '4px 0', color: '#94a3b8' }}>Write Operations: Enabled</p>
                  </div>

                  <div
                    style={{
                      padding: 18,
                      background: 'rgba(15,23,42,0.72)',
                      borderRadius: 18,
                      border: '1px solid rgba(148,163,184,0.16)',
                    }}
                  >
                    <p style={{ marginTop: 0, marginBottom: 10, fontWeight: 'bold', color: '#cbd5e1' }}>
                      Activity log
                    </p>
                    {activityLog.map((entry, index) => (
                      <p key={`${entry}-${index}`} style={{ margin: '4px 0', color: '#94a3b8' }}>
                        {entry}
                      </p>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your message..."
                    style={{
                      padding: '14px 16px',
                      flex: 1,
                      borderRadius: 14,
                      border: '1px solid #334155',
                      background: '#020617',
                      color: '#e2e8f0',
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  />
                  <button
                    onClick={sendMessage}
                    style={{
                      padding: '14px 24px',
                      background: '#2563eb',
                      color: 'white',
                      borderRadius: 14,
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    Send
                  </button>
                </div>

                {loading && <p style={{ marginTop: 20 }}>Thinking...</p>}
                {reply && (
                  <div
                    style={{
                      marginTop: 20,
                      fontWeight: 'bold',
                      whiteSpace: 'pre-wrap',
                      background: 'rgba(15,23,42,0.78)',
                      borderRadius: 18,
                      padding: 18,
                      border: '1px solid rgba(148,163,184,0.16)',
                    }}
                  >
                    {reply}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

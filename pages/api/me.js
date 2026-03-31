import { getSession } from '@auth0/nextjs-auth0';

export default function handler(req, res) {
  const session = getSession(req, res);

  if (!session) {
    return res.status(200).json({ user: null });
  }

  res.status(200).json({ user: session.user });
}
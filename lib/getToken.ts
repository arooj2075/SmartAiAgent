// app/lib/getToken.ts
import { NextRequest } from 'next/server';
import { getAuth0Token } from './tokenVault';

export async function getTokenVaultAccessToken(req: NextRequest) {
  return getAuth0Token(req);
}

export async function getClientToken(req: NextRequest) {
  return getTokenVaultAccessToken(req);
}

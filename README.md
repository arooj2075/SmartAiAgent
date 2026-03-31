# Smart AI Agent

Smart AI Agent is a secure calendar assistant built for the **Authorized to Act: AI Agents with Auth0** hackathon. It uses **Auth0 for AI Agents Token Vault** so an assistant can read and schedule Google Calendar events on behalf of a user without exposing raw provider credentials in the frontend.

## What It Does

- Authenticates users with Auth0 and Google
- Connects Google Calendar access through Auth0 Token Vault
- Exchanges provider access securely before calling Google APIs
- Reads upcoming calendar events
- Creates calendar events from natural-language prompts
- Shows security context in the UI, including access flow and status panels

## Why It Matters

This project demonstrates a safer model for agentic actions:

- the user signs in explicitly
- delegated provider access is scoped
- provider tokens are exchanged through Auth0 Token Vault
- the frontend never stores raw Google credentials

## Core Flow

1. User signs in with Google through Auth0
2. Auth0 manages connected account and delegated access
3. The backend exchanges provider access through Token Vault
4. The assistant reads or creates Google Calendar events

## Example Prompts

- `show my calendar events`
- `what is on my schedule today`
- `schedule meeting on 1/04/2026 at 3 PM`
- `schedule meeting tomorrow at 4 PM`

## Tech Stack

- Next.js
- React
- TypeScript
- Auth0 for AI Agents
- Auth0 Token Vault
- Google Calendar API

## Environment Variables

This repository does **not** include `.env.local` for security reasons.

Use [`.env.example`](./.env.example) as a template, create your own `.env.local`, and fill in your Auth0 and Google credentials locally before running the app.

## Local Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create `.env.local`

Copy `.env.example` to `.env.local` and fill in your real values.

### 3. Configure Auth0

Set up:

- a **Regular Web Application**
- a Google social connection
- **Authentication and Connected Accounts for Token Vault**
- Google Calendar scopes
- an API/resource server for exchange
- a Token Vault-enabled exchange client

Recommended callback values:

- `http://localhost:3000/api/auth/callback`
- `http://localhost:3000/connected-accounts/callback`

### 4. Configure Google Cloud

Make sure:

- Google Calendar API is enabled
- OAuth consent screen is configured
- test users are added if the app is in testing mode
- the OAuth client used by Auth0 has the correct Auth0 redirect URI

### 5. Run the app

```bash
npm run dev
```

Open `http://localhost:3000`.

## Testing Instructions

1. Launch the app locally
2. Click `Launch Assistant`
3. Sign in with Google through Auth0
4. Return to the assistant console
5. Try:
   - `show my calendar events`
   - `schedule meeting on 1/04/2026 at 3 PM`

Expected behavior:

- the assistant lists upcoming events from Google Calendar
- the assistant can schedule a meeting and confirm it in the UI

## Security Notes

- Tokens are not manually stored in the frontend
- Provider access is delegated through Auth0 Token Vault
- Scopes are limited to the Google Calendar access needed for the demo
- The UI explicitly shows security and permission context

## Hackathon Scope

This project was significantly built and updated during the hackathon period, including:

- Auth0 login integration
- connected account and Token Vault flow
- provider token exchange
- Google Calendar read integration
- Google Calendar event creation
- technical product UI with guided flow and status panels

## Demo Angle

This project is designed to show that an AI agent can act on behalf of a user with explicit permissions, delegated provider access, and a clear security boundary enforced by Auth0 Token Vault.

# Chat

A standalone username-based messaging app deployed independently from CineFlix.

## Deploy on Vercel

Create a Vercel project linked to this repository and set **Root Directory** to `chat-app`. The project uses Vercel Node.js Functions from `api/` and serves the static `index.html` page.

## Database

Connect a Neon Postgres database to the Vercel project and set `DATABASE_URL` for Production, Preview, and Development. The API creates its tables and indexes on first request. No CineFlix database or Cloudflare binding is used.

## Notes

- Visitors choose a guest username; there is no email/password registration.
- A random session token is kept in the browser and its SHA-256 hash is stored in Postgres.
- Usernames are temporary guest identities, not verified accounts.
- Expired username claims are reclaimed and the previous conversation history for that username is deleted.
- Messages are stored in plaintext in Postgres and are not end-to-end encrypted. Do not send sensitive information.
- The API limits each guest session to 20 messages per minute and message length to 3,000 characters.
- Unicode messages and right-to-left scripts are supported.

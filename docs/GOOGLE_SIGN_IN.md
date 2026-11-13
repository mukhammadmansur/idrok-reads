# Optional Google sign-in

The integration is implemented but **not enabled in this checkout**: the owner has no Google Web Client ID yet and chose to defer setup. Email/password accounts, the parent gate and monitoring work independently. The UI clearly says Google is unavailable rather than simulating authentication. No real Google credentials or live Google account were used in tests.

## Enable when ready

1. In Google Cloud Console, configure your app's OAuth consent screen and create an **OAuth 2.0 Client ID → Web application**. While the consent screen is in testing, configure its allowed test users as required by Google.
2. Add the exact **Authorized JavaScript origins** used in the browser, for example `http://localhost:5173`, `http://127.0.0.1:5173`, and `http://127.0.0.1:3001` for local testing. Add the actual HTTPS origin before using a hosted app. Different ports and hostnames are different origins. This is the Identity Services credential flow; no application redirect/callback endpoint is required.
3. Put the **public Client ID** in the server's ignored `.env` as `GOOGLE_CLIENT_ID=...`. This flow needs no Client Secret. Do not paste passwords, ID tokens or session cookies into source or chat.
4. Restart `npm run dev`, or rebuild/start the shared Node server as appropriate. The server exposes the public ID through `/api/auth/options`. The frontend loads Google's official Identity Services button only when configured.
5. Test a new Google account, returning sign-in, parent reauthentication and explicit linking to an existing password account. Console consent/authorized-origin errors must be corrected in Google Cloud. An unavailable provider/network produces a retryable error; email login remains available.

The frontend must be able to load `https://accounts.google.com/gsi/client` and use Google's frames/styles/connections. The server must reach `https://www.googleapis.com/oauth2/v3/certs` over verified HTTPS. Restricted hosting/cloud environments need these destinations allowed before testing. The application CSP includes the relevant Google Identity Services sources; the cloud network policy is not changed by this feature. HTTPS and Secure cookies remain required for public hosting. No public deployment is performed here.

## What the server verifies

- RS256 signature against Google's cached, rotating public signing keys.
- Exact client audience, authorized party when supplied, issuer, expiry/issued-at, subject and verified email claim.
- A ten-minute nonce bound to an HttpOnly browser cookie and a single-use server record.
- Same-origin JSON write checks, request size and Google-login rate limits.

Only a Google subject identifies an existing linked Google user; an email alone never silently links accounts. If a password account already uses that email, sign in with its password, unlock parent controls, and explicitly link the same-email Google account under **Ota-onalar himoyasi**. A new Google-only account has password login disabled. Set its parent PIN while freshly authenticated; when needed it can reauthenticate through Google.

Automated tests sign real RSA tokens with a test key and a local test key set. They cover invalid signatures, audience/issuer/expiry/nonce/verified-email rejection, nonce replay, repeat login, unavailable configuration and explicit account linking. These tests verify application behavior; they do not establish live Google consent/origin configuration. Live end-to-end Google login remains unverified until the owner supplies a configured Client ID.

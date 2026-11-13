import { createPublicKey, verify } from "node:crypto";
import { ApiError } from "./store.mjs";

// Verify Google's signed ID token locally; no Client Secret or password is needed.
export function createGoogleVerifier({
  clientId,
  fetchKeys = async () => {
    const response = await fetch("https://www.googleapis.com/oauth2/v3/certs", {
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error("Google keys unavailable");
    return response.json();
  },
  clock = () => Date.now(),
}) {
  let cached = null,
    loadedAt = 0;
  return async function verifyGoogle(credential, nonce) {
    const invalid = () =>
      new ApiError(
        401,
        "Google orqali tasdiqlash bajarilmadi. Qayta urinib ko‘ring.",
        "invalid_google_token",
      );
    if (!clientId)
      throw new ApiError(
        503,
        "Google orqali kirish hozircha mavjud emas.",
        "google_not_configured",
      );
    if (
      typeof credential !== "string" ||
      credential.length > 16000 ||
      typeof nonce !== "string" ||
      !nonce
    )
      throw invalid();
    let header, claims, parts;
    try {
      parts = credential.split(".");
      if (parts.length !== 3) throw invalid();
      header = JSON.parse(Buffer.from(parts[0], "base64url").toString());
      claims = JSON.parse(Buffer.from(parts[1], "base64url").toString());
    } catch {
      throw invalid();
    }
    if (
      !header ||
      typeof header !== "object" ||
      !claims ||
      typeof claims !== "object" ||
      Array.isArray(claims)
    )
      throw invalid();
    if (
      header.alg !== "RS256" ||
      typeof header.kid !== "string" ||
      header.kid.length > 200
    )
      throw invalid();
    const seconds = clock() / 1000;
    if (
      !["https://accounts.google.com", "accounts.google.com"].includes(
        claims.iss,
      ) ||
      claims.aud !== clientId ||
      (claims.azp && claims.azp !== clientId) ||
      typeof claims.exp !== "number" ||
      claims.exp <= seconds ||
      typeof claims.iat !== "number" ||
      claims.iat > seconds + 60 ||
      claims.iat < seconds - 7200 ||
      claims.nonce !== nonce ||
      claims.email_verified !== true ||
      typeof claims.sub !== "string" ||
      !claims.sub ||
      claims.sub.length > 255 ||
      typeof claims.email !== "string" ||
      claims.email.length > 254 ||
      /\p{Cc}/u.test(claims.email) ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(claims.email)
    )
      throw invalid();
    try {
      // Rotate hourly, or refresh an unknown key at most once per minute.
      if (
        !cached ||
        clock() - loadedAt > 3600000 ||
        (!cached.keys.some((key) => key.kid === header.kid) &&
          clock() - loadedAt > 60000)
      ) {
        cached = await fetchKeys();
        if (!Array.isArray(cached.keys)) throw new Error("Invalid key set");
        loadedAt = clock();
      }
    } catch {
      throw new ApiError(
        503,
        "Google bilan aloqa o‘rnatilmadi. Birozdan keyin qayta urinib ko‘ring.",
        "google_unavailable",
      );
    }
    const jwk = cached.keys.find(
      (key) =>
        key.kid === header.kid &&
        key.kty === "RSA" &&
        (!key.use || key.use === "sig") &&
        (!key.alg || key.alg === "RS256"),
    );
    if (!jwk) throw invalid();
    try {
      if (
        !verify(
          "RSA-SHA256",
          Buffer.from(parts[0] + "." + parts[1]),
          createPublicKey({ key: jwk, format: "jwk" }),
          Buffer.from(parts[2], "base64url"),
        )
      )
        throw invalid();
    } catch {
      throw invalid();
    }
    return claims;
  };
}

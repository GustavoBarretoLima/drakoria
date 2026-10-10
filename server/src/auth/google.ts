import { OAuth2Client, type TokenPayload } from "google-auth-library";
import { AuthError, normalizeEmail } from "./security.js";

export interface GoogleIdentity { subject: string; email: string; }
export function validatedGoogleClaims(payload: TokenPayload | undefined, nonce: string): GoogleIdentity {
  const claims = payload as (TokenPayload & { nonce?: string }) | undefined;
  const email = normalizeEmail(claims?.email);
  if (!claims || !email || claims.email_verified !== true || typeof claims.sub !== "string" || !claims.sub || claims.sub.length > 255 || claims.nonce !== nonce ||
      (!email.endsWith("@gmail.com") && !(typeof claims.hd === "string" && claims.hd.length > 0))) {
    throw new AuthError(401, "Não foi possível validar o login com Google.");
  }
  return { subject: claims.sub, email };
}
export function googleVerifier(clientId: string) {
  const client = new OAuth2Client({ transporterOptions: { timeout: 5000, retry: false } });
  return async (credential: string, nonce: string): Promise<GoogleIdentity> => {
    try {
      const ticket = await client.verifyIdToken({ idToken: credential, audience: clientId });
      return validatedGoogleClaims(ticket.getPayload(), nonce);
    } catch { throw new AuthError(401, "Não foi possível validar o login com Google."); }
  };
}

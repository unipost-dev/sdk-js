import type { VerifyWebhookOptions } from "./types/index.js";

function getSubtle(): SubtleCrypto {
  if (globalThis.crypto?.subtle) return globalThis.crypto.subtle;
  // Node.js <20 fallback
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require("node:crypto").webcrypto.subtle;
}

/**
 * Verify the signature of a UniPost webhook request.
 *
 * Uses HMAC-SHA256 with the webhook secret to validate the payload.
 */
export async function verifyWebhookSignature(options: VerifyWebhookOptions): Promise<boolean> {
  const { payload, signature, secret } = options;
  const subtle = getSubtle();

  const encoder = new TextEncoder();
  const key = await subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const payloadBytes = typeof payload === "string" ? encoder.encode(payload) : new Uint8Array(payload);
  const signatureBytes = await subtle.sign("HMAC", key, payloadBytes);
  const computed = bufferToHex(signatureBytes);

  return timingSafeEqual(computed, signature);
}

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Constant-time string comparison to prevent timing attacks. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

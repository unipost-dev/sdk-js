import { describe, it, expect } from "vitest";
import { webcrypto } from "node:crypto";
import { verifyWebhookSignature } from "../src/index.js";

const subtle = webcrypto.subtle;

describe("verifyWebhookSignature", () => {
  it("returns true for valid signature", async () => {
    const secret = "whsec_test_secret";
    const payload = '{"event":"post.published","data":{"post_id":"post_1"}}';

    // Compute expected signature
    const encoder = new TextEncoder();
    const key = await subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const sig = await subtle.sign("HMAC", key, encoder.encode(payload));
    const signature = Array.from(new Uint8Array(sig))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const result = await verifyWebhookSignature({ payload, signature, secret });
    expect(result).toBe(true);
  });

  it("returns false for invalid signature", async () => {
    const result = await verifyWebhookSignature({
      payload: '{"event":"post.published"}',
      signature: "0000000000000000000000000000000000000000000000000000000000000000",
      secret: "whsec_test_secret",
    });
    expect(result).toBe(false);
  });
});

/**
 * Payload Crypto — AES-256-GCM encryption/decryption for API payloads.
 *
 * This matches the backend PayloadCryptoService.java exactly:
 * - Same key derivation (HMAC-SHA256 of config key with "CharusatNeedsKDF" salt)
 * - Same AES-256-GCM with 12-byte random IV prepended
 * - Same Base64 encoding
 *
 * Prevents Burp Suite / Wireshark from reading API traffic.
 */

const PAYLOAD_KEY_STRING = "CharusatNeedsPayloadKey2026!!";
const KDF_SALT = "CharusatNeedsKDF";

let _aesKey: CryptoKey | null = null;

/**
 * Derive the AES-256 key using HMAC-SHA256 (mirrors backend's deriveKey method).
 */
async function getPayloadKey(): Promise<CryptoKey> {
  if (_aesKey) return _aesKey;

  const encoder = new TextEncoder();

  // Import the salt as HMAC key
  const hmacKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(KDF_SALT),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  // HMAC-SHA256(salt, payloadKeyString) → 32-byte AES key
  const derived = await crypto.subtle.sign("HMAC", hmacKey, encoder.encode(PAYLOAD_KEY_STRING));

  // Import as AES-GCM key
  _aesKey = await crypto.subtle.importKey(
    "raw",
    derived,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"]
  );

  return _aesKey;
}

/**
 * Encrypt plaintext → Base64(IV + ciphertext)
 */
export async function encryptPayload(plaintext: string): Promise<string> {
  const key = await getPayloadKey();
  const encoder = new TextEncoder();

  // Random 12-byte IV
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv, tagLength: 128 },
    key,
    encoder.encode(plaintext)
  );

  // Prepend IV to ciphertext: [IV (12 bytes)][ciphertext]
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), iv.length);

  // Base64 encode
  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypt Base64(IV + ciphertext) → plaintext
 */
export async function decryptPayload(encryptedBase64: string): Promise<string> {
  const key = await getPayloadKey();

  // Base64 decode
  const combined = Uint8Array.from(atob(encryptedBase64), (c) => c.charCodeAt(0));

  // Extract IV (first 12 bytes)
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv, tagLength: 128 },
    key,
    ciphertext
  );

  return new TextDecoder().decode(decrypted);
}

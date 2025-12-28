import fs from "fs";
import path from "path";
import crypto from "crypto";

/**
 * decrypt-secrets.ts
 * Usage:
 *   SECRETS_PASSPHRASE="minha-pass" ts-node scripts/decrypt-secrets.ts ./secrets/secrets.enc
 * Outputs the JSON to stdout.
 */
const ALGO = "aes-256-gcm";
const IV_LENGTH = 12;

function decryptBuffer(encBuffer: Buffer, passphrase: string) {
  if (encBuffer.length < IV_LENGTH + 16) throw new Error("Encrypted file too small");
  const iv = encBuffer.slice(0, IV_LENGTH);
  const tag = encBuffer.slice(IV_LENGTH, IV_LENGTH + 16);
  const ciphertext = encBuffer.slice(IV_LENGTH + 16);
  const key = crypto.createHash("sha256").update(passphrase).digest();
  const decipher = crypto.createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error("Usage: ts-node decrypt-secrets.ts <input.enc>");
    process.exit(1);
  }
  const [inputPath] = args;
  const passphrase = process.env.SECRETS_PASSPHRASE;
  if (!passphrase) {
    console.error("SECRETS_PASSPHRASE env var is required");
    process.exit(2);
  }
  const enc = fs.readFileSync(path.resolve(inputPath));
  const json = decryptBuffer(enc, passphrase);
  console.log(json);
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(99);
  });
}
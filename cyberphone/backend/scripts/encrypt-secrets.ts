import fs from "fs";
import path from "path";
import crypto from "crypto";

/**
 * encrypt-secrets.ts
 * Usage (node):
 *   NODE_ENV=development SECRETS_PASSPHRASE="minha-pass" ts-node scripts/encrypt-secrets.ts ./secrets/example.secrets.json ./secrets/secrets.enc
 *
 * Produz um ficheiro encriptado com layout: [iv(12)][tag(16)][ciphertext]
 */

const ALGO = "aes-256-gcm";
const IV_LENGTH = 12;

function encryptString(plain: string, passphrase: string) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = crypto.createHash("sha256").update(passphrase).digest();
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  // output: iv + tag + ciphertext
  return Buffer.concat([iv, tag, ciphertext]);
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error("Usage: ts-node encrypt-secrets.ts <input.json> <output.enc>");
    process.exit(1);
  }
  const [inputPath, outputPath] = args;
  const passphrase = process.env.SECRETS_PASSPHRASE;
  if (!passphrase) {
    console.error("SECRETS_PASSPHRASE env var is required");
    process.exit(2);
  }
  const absIn = path.resolve(inputPath);
  const absOut = path.resolve(outputPath);
  if (!fs.existsSync(absIn)) {
    console.error("Input file not found:", absIn);
    process.exit(3);
  }
  const json = fs.readFileSync(absIn, "utf8");
  // validate JSON
  try {
    JSON.parse(json);
  } catch (err) {
    console.error("Input file is not valid JSON:", err);
    process.exit(4);
  }
  const enc = encryptString(json, passphrase);
  fs.writeFileSync(absOut, enc);
  console.log("Encrypted file written to", absOut);
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(99);
  });
}
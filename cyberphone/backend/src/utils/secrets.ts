import fs from "fs";
import path from "path";
import crypto from "crypto";

/**
 * secrets.ts
 * - Primeiro tenta obter segredos de process.env (recomendado para CI/containers)
 * - Se não existir, tenta carregar um ficheiro encriptado: backend/secrets/secrets.enc
 * - A desencriptação exige que env var SECRETS_PASSPHRASE esteja definida (ou passa no CLI)
 *
 * Exemplo de uso:
 *   import { getSecret } from "../utils/secrets";
 *   const serviceKey = getSecret("SUPABASE_SERVICE_ROLE_KEY");
 */

const ENC_FILE_DEFAULT = path.join(process.cwd(), "backend", "secrets", "secrets.enc");
const ALGO = "aes-256-gcm";
const IV_LENGTH = 12; // recommended for GCM

function decryptBuffer(encBuffer: Buffer, passphrase: string) {
  // file layout: [iv(12)][tag(16)][ciphertext]
  if (encBuffer.length < IV_LENGTH + 16) throw new Error("Encrypted file too small");
  const iv = encBuffer.slice(0, IV_LENGTH);
  const tag = encBuffer.slice(IV_LENGTH, IV_LENGTH + 16);
  const ciphertext = encBuffer.slice(IV_LENGTH + 16);

  const key = crypto.createHash("sha256").update(passphrase).digest();
  const decipher = crypto.createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return decrypted.toString("utf8");
}

// load decrypted secrets JSON (memoized)
let cachedSecrets: Record<string, any> | null = null;

export function loadSecrets(): Record<string, any> {
  if (cachedSecrets) return cachedSecrets;

  // 1) Load from process.env if available (prefix SECRETS_ or direct keys)
  // We prefer explicit env vars for each secret (recommended for production)
  // But to support a single ENCRYPTED FILE flow, continue below.
  const fromEnv: Record<string, any> = {};
  for (const k of Object.keys(process.env)) {
    if (k === "") continue;
    // adopt any env var that is UPPERCASE and looks like a secret name
    if (k.startsWith("SUPABASE_") || k.startsWith("S3_") || k === "JWT_SECRET" || k.endsWith("_KEY") || k.endsWith("_SECRET")) {
      fromEnv[k] = process.env[k] as string;
    }
  }
  // If we found env secrets, use them (highest priority)
  if (Object.keys(fromEnv).length > 0) {
    cachedSecrets = fromEnv;
    return cachedSecrets;
  }

  // 2) If no env secrets, try reading encrypted file
  const encPath = process.env.SECRETS_FILE || ENC_FILE_DEFAULT;
  if (!fs.existsSync(encPath)) {
    cachedSecrets = {};
    return cachedSecrets;
  }
  const passphrase = process.env.SECRETS_PASSPHRASE;
  if (!passphrase) throw new Error("SECRETS_PASSPHRASE is required to decrypt secrets file");

  const encBuffer = fs.readFileSync(encPath);
  const json = decryptBuffer(encBuffer, passphrase);
  try {
    const parsed = JSON.parse(json);
    cachedSecrets = parsed;
    return parsed;
  } catch (err) {
    throw new Error("Failed parsing decrypted secrets JSON: " + String(err));
  }
}

export function getSecret<T = string>(key: string, fallback?: T): T | undefined {
  const secrets = loadSecrets();
  if (key in secrets) return secrets[key] as T;
  // try direct env fallback
  if (process.env[key]) return process.env[key] as unknown as T;
  return fallback;
}

export function getAllSecrets(): Record<string, any> {
  return loadSecrets();
}
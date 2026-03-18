import crypto from "crypto";

function getKey() {
  const raw = process.env.SMTP_CRED_KEY || "";
  if (!raw) return null;
  // Accept base64 (preferred) or hex
  let buf = null;
  try {
    buf = Buffer.from(raw, "base64");
    if (buf.length !== 32) throw new Error("bad");
    return buf;
  } catch {}
  try {
    buf = Buffer.from(raw, "hex");
    if (buf.length !== 32) throw new Error("bad");
    return buf;
  } catch {}
  return null;
}

export function encryptSmtpPassword(plain) {
  const key = getKey();
  if (!key) {
    const err = new Error("SMTP_CRED_KEY is missing/invalid (must be 32 bytes, base64 or hex).");
    err.status = 500;
    throw err;
  }
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(String(plain), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    encB64: enc.toString("base64"),
    ivB64: iv.toString("base64"),
    tagB64: tag.toString("base64")
  };
}

export function decryptSmtpPassword({ encB64, ivB64, tagB64 }) {
  const key = getKey();
  if (!key) {
    const err = new Error("SMTP_CRED_KEY is missing/invalid (must be 32 bytes, base64 or hex).");
    err.status = 500;
    throw err;
  }
  if (!encB64 || !ivB64 || !tagB64) return "";
  const iv = Buffer.from(ivB64, "base64");
  const tag = Buffer.from(tagB64, "base64");
  const enc = Buffer.from(encB64, "base64");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const dec = Buffer.concat([decipher.update(enc), decipher.final()]);
  return dec.toString("utf8");
}


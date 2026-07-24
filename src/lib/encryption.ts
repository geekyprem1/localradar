import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';

function resolveSecret(): string {
  const secret = process.env.ENCRYPTION_SECRET;
  if (secret && secret.length >= 32) {
    return secret;
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'ENCRYPTION_SECRET must be set to a strong value (32+ chars) in production. BYOK encryption cannot use a default key.'
    );
  }
  // Dev-only fallback — never used in production
  return 'localradar-dev-only-encryption-secret-do-not-use-in-prod!!';
}

const getEncryptionKey = (): Buffer => {
  return crypto.createHash('sha256').update(String(resolveSecret())).digest();
};

/**
 * Encrypts a string using AES-256-GCM.
 * Returns a colon-separated string: iv:authTag:encryptedText
 */
export function encrypt(text: string): string {
  if (!text) return '';

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag().toString('hex');

  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypts AES-256-GCM envelope. Rejects non-envelope input in production.
 */
export function decrypt(encryptedText: string): string {
  if (!encryptedText) return '';

  const parts = encryptedText.split(':');
  if (parts.length !== 3) {
    if (process.env.NODE_ENV === 'production') {
      console.error('decrypt: rejecting non-envelope ciphertext in production');
      return '';
    }
    // Dev convenience only
    return encryptedText;
  }

  try {
    const key = getEncryptionKey();
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const ciphertext = parts[2];

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error);
    return '';
  }
}

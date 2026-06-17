import { createHash, randomBytes } from 'crypto';

export function hashToken(raw: string) {
  return createHash('sha256').update(raw).digest('hex');
}

export function generateTokenHelper() {
  const raw = randomBytes(32).toString('hex');
  return { raw, hash: hashToken(raw) };
}

import crypto from 'crypto';
import { PrismaClient } from '../../lib/generated/prisma/index.js';

const prisma = new PrismaClient();

/**
 * Generate a secure random password (base64url) of given length.
 */
export function generatePassword(length = 16): string {
  const buf = crypto.randomBytes(length);
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Generate a unique SCC id and ensure uniqueness by checking DB.
 * Format: SCC-<6 alphanumeric uppercase>
 */
export async function generateUniqueSccId(): Promise<string> {
  for (let i = 0; i < 5; i++) {
    const id = `SCC-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const exists = await prisma.team.findFirst({ where: { scc_id: id } });
    if (!exists) return id;
  }
  return `SCC-${Date.now()}`;
}

export default { generatePassword, generateUniqueSccId };

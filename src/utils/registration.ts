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
 * Generate a sequential SCC id by finding the highest existing ID and incrementing.
 * Format: SCC001, SCC002, SCC003, etc.
 */
export async function generateUniqueSccId(): Promise<string> {
  try {
    // Find the team with the highest SCC ID
    const lastTeam = await prisma.team.findFirst({
      where: {
        scc_id: {
          startsWith: 'SCC'
        }
      },
      orderBy: {
        scc_id: 'desc'
      }
    });

    let nextNumber = 1;
    if (lastTeam?.scc_id) {
      // Extract number from SCC001, SCC002, etc.
      const match = lastTeam.scc_id.match(/SCC(\d+)/);
      if (match && match[1]) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }

    // Zero-pad to 3 digits
    return `SCC${nextNumber.toString().padStart(3, '0')}`;
  } catch (error) {
    console.error('Error generating SCC ID:', error);
    // Fallback to timestamp-based ID
    return `SCC-${Date.now()}`;
  }
}

export default { generatePassword, generateUniqueSccId };

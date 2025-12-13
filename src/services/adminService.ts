import { PrismaClient } from '@prisma/client';
import type { Admin } from "@prisma/client";

const prisma = new PrismaClient();

export async function getAdminById(adminId: number): Promise<Admin | null> {
  return await prisma.admin.findUnique({
    where: { id: adminId },
  });
}
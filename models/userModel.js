import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

class UserModel {
    async getAll() {
        return await prisma.user.findMany();
    }

    async getById(id) {
        return await prisma.user.findUnique({ where: { id: Number(id) } });
    }

    async create(data) {
        return await prisma.user.create({ data });
    }

    async update(id, data) {
        return await prisma.user.update({
            where: { id: Number(id) },
            data,
        });
    }

    async delete(id) {
        return await prisma.user.delete({ where: { id: Number(id) } });
    }
}

export default new UserModel();
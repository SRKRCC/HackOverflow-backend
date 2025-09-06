import { PrismaClient } from '../../lib/generated/prisma/index.js';
import type { Request, Response } from "express";
const prisma = new PrismaClient();

export const getDetails = async (req: Request, res: Response) => {
    const teamId: number = (req as any).teamId;

    if (!teamId) {
        return res.status(400).json({ error: "teamId is missing" });
    }

    try {
        const team = await prisma.team.findUnique({
            where: { id: teamId },
            include: {
                team_members: true,
            },
        });

        if (!team) {
            return res.status(404).json({ error: "Team not found" });
        }

        res.json({
            teamId: team.id,
            title: team.title,
            members: team.team_members,
        });
    } catch (error) {
        console.error("Error fetching team members:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

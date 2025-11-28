import { prisma } from "../../lib/prisma.js";
import type { Request, Response } from "express";

export const getProblemStatement = async (req: Request, res: Response) => {
    try {
        const teamId: number = (req as any).user.teamId;

        if (!teamId) {
            return res.status(400).json({ error: "Team ID is missing" });
        }

        const team = await prisma.team.findUnique({
            where: { id: teamId },
        });

        if (!team || !team.ps_id) {
            return res.status(404).json({ error: "Team or Problem Statement ID not found" });
        }

        const problemStatement = await prisma.problemStatement.findUnique({
            where: { id: team.ps_id },
        });

        if (!problemStatement) {
            return res.status(404).json({ error: "Problem Statement not found" });
        }

        res.status(200).json({
            success: true,
            data: problemStatement,
            message: "Problem Statement retrieved successfully"
        });
    } catch (error) {
        console.error("Error fetching Problem Statement:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}


export const getImages = async (req: Request, res: Response) => {
    try {
        const teamId: number = (req as any).user.teamId;

        if (!teamId) {
            return res.status(400).json({ error: "Team ID is missing" });
        }
        
        const team = await prisma.team.findUnique({
            where: { id: teamId },
            select: { gallery_images: true },
        });

        if (!team || !team.gallery_images) {
            return res.status(404).json({ error: "Team or Gallery Images not found" });
        }

        res.status(200).json({
            success: true,
            data: team.gallery_images,
            message: "Gallery Images retrieved successfully"
        });
    } catch (error) {
        console.error("Error fetching Gallery Images:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

export const getAnnouncements = async (req: Request, res: Response) => {
    try {
        const announcements = await prisma.announcement.findMany();

        res.status(200).json({
            success: true,
            data: announcements,
            message: "Announcements retrieved successfully"
        });
    } catch (error) {
        console.error("Error fetching Announcements:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}
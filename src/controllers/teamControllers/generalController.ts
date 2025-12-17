import { prisma } from "../../lib/prisma.js";
import type { Request, Response } from "express";
import { auditService } from "../../services/auditService.js";

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

export const getGeneralInfo = async (req: Request, res: Response) => {
    try {
        const teamId: number = (req as any).user.teamId;

        if (!teamId) {
            return res.status(400).json({ error: "Team ID is missing" });
        }

        const team = await prisma.team.findUnique({
            where: { id: teamId },
            select: {
                id: true,
                title: true,
                team_members: {
                    select: {
                        id: true,
                        name: true,
                        certification_name: true,
                        roll_number: true,
                        gender: true,
                    },
                },
            },
        });

        if (!team) {
            return res.status(404).json({ error: "Team or General Information not found" });
        }

        res.status(200).json({
            success: true,
            data: {
                team: { id: team.id, title: team.title },
                members: team.team_members,
            },
            message: "General Information retrieved successfully"
        });

    } catch (error) {
        console.error("Error fetching General Information:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

export const updateGeneralInfo = async (req: Request, res: Response) => {
    try {
        const teamId: number = (req as any).user.teamId;

        if (!teamId) {
            return res.status(400).json({ error: "Team ID is missing" });
        }

        const members: any[] = req.body.members;
        if (!Array.isArray(members) || members.length === 0) {
            return res.status(400).json({ error: "Members array is required" });
        }

        const existing = await prisma.member.findMany({
            where: { teamId },
            select: { id: true },
        });

        const allowedIds = new Set(existing.map(m => m.id));

        const updates = [];

        for (const m of members) {
            if (typeof m.id !== "number" || !allowedIds.has(m.id)) {
                return res.status(403).json({ error: "One or more member IDs are invalid or do not belong to your team" });
            }

            if (!("certification_name" in m) || !("roll_number" in m) || !("gender" in m)) {
                return res.status(400).json({ error: "Each member must include certification_name, roll_number and gender fields (can be null)" });
            }

            const certification_name = m.certification_name == null ? null : String(m.certification_name).trim().toUpperCase() || null;
            const roll_number = m.roll_number == null ? null : String(m.roll_number).trim().toUpperCase() || null;

            let gender: "Male" | "Female" | null = null;
            if (m.gender == null) {
                gender = null;
            } else if (m.gender === "Male" || m.gender === "Female") {
                gender = m.gender;
            } else {
                return res.status(400).json({ error: "Invalid gender. Allowed values: 'Male', 'Female', or null" });
            }

            updates.push(prisma.member.update({
                where: { id: m.id },
                data: { certification_name, roll_number, gender }
            }));
        }

        const updatedMembers = await prisma.$transaction(updates);

        try {
            const context = auditService.extractContext(req);
            const meta = { updated: updatedMembers.map((m: any) => ({ id: m.id, certification_name: m.certification_name, roll_number: m.roll_number, gender: m.gender })) };
            await auditService.logAdmin('MODIFY_DATA', context, 'member:update', 200, 'Team updated member details', meta);
        } catch (auditError) {
            console.error('Audit logging failed for updateGeneralInfo:', auditError);
        }

        res.status(200).json({
            success: true,
            data: updatedMembers,
            message: "Member details updated successfully"
        });
    } catch (error) {
        console.error("Error updating General Information:", error);
        try {
            const context = auditService.extractContext(req);
            await auditService.logError(error as Error, context, 'member:update', { attempted_payload: req.body });
        } catch (auditError) {
            console.error('Audit error while logging failure for updateGeneralInfo:', auditError);
        }

        res.status(500).json({ error: "Internal server error" });
    }
}

export const dashboardInfo = async (req: Request, res: Response) => {
    try {
        const teamId: number = (req as any).user.teamId;

        if (!teamId) {
            return res.status(400).json({ error: "Team ID is missing" });
        }
    }
    catch (error) {
        console.error("Error fetching Dashboard Information:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}
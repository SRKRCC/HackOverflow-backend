import { prisma } from "../../lib/prisma.js";
import { Prisma } from '@prisma/client';
import type { Request, Response } from "express";

export const getDetails = async (req: Request, res: Response) => {
    
    const user = (req as any).user;
    const isAdmin = user && String(user.role).toLowerCase() === "admin";

    const teamId: number = isAdmin
        ? (req.params.teamId ? Number(req.params.teamId) : NaN)
        : Number(user?.teamId);

    if (!Number.isFinite(teamId) || Number.isNaN(teamId)) {
        return res.status(400).json({ error: "teamId must be a valid number" });
    }

    if (!teamId) {
        return res.status(400).json({ error: "Team ID is missing" });
    }

    try {
        const team = await prisma.team.findUnique({
            where: { id: teamId },
            include: {
                team_members: true,
                problem_statement: true,
            },
        });

        if (!team) {
            return res.status(404).json({ error: "Team not found" });
        }

        const sortedMembers = [...(team.team_members ?? [])].sort(
            (a, b) => Number(a.id) - Number(b.id)
        );

        res.json({
            teamId: team.id,
            title: team.title,
            scc_id: team.scc_id,
            ps_id: team.ps_id,
            paymentVerified: team.paymentVerified,
            problem_statement: team.problem_statement ?? null,
            members: sortedMembers,
        });
    } catch (error) {
        console.error("Error fetching team members:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const patchTeam = async (req: Request, res: Response) => {
    try {
        const teamId = Number(req.params.teamId);
        
        if (!Number.isFinite(teamId) || Number.isNaN(teamId)) {
            return res.status(400).json({
                success: false,
                message: "teamId must be a valid number"
            });
        }

        const existingTeam = await prisma.team.findUnique({
            where: { id: teamId }
        });

        if (!existingTeam) {
            return res.status(404).json({
                success: false,
                message: "Team not found"
            });
        }

        if (req.body.ps_id) {
            const problemStatement = await prisma.problemStatement.findUnique({
                where: { id: req.body.ps_id }
            });

            if (!problemStatement) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid problem statement ID"
                });
            }
        }

        const updatedTeam = await prisma.team.update({
            where: { id: teamId },
            data: req.body,
            include: {
            team_members: true,
            problem_statement: true
            }
        });

        if ((updatedTeam as any).scc_password !== undefined) {
            delete (updatedTeam as any).scc_password;
        }

        res.status(200).json({
            success: true,
            message: "Team updated successfully",
            data: updatedTeam
        });
    } catch (error) {
        console.error("Error updating team:", error);
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P5010') {
                return res.status(503).json({
                    success: false,
                    message: "Database service unavailable. Please try again later."
                });
            }

            res.status(500).json({
                success: false,
                message: "Internal server error"
            });
    }
};

export const patchMember = async (req: Request, res: Response) => {
    try {
        const teamId = Number(req.params.teamId);
        const memberId = Number(req.params.memberId);

        if (!Number.isFinite(teamId) || Number.isNaN(teamId)) {
            return res.status(400).json({
                success: false,
                message: "teamId must be a valid number"
            });
        }

        if (!Number.isFinite(memberId) || Number.isNaN(memberId)) {
            return res.status(400).json({
                success: false,
                message: "memberId must be a valid number"
            });
        }

        const existingMember = await prisma.member.findUnique({
            where: { id: memberId }
        });

        if (!existingMember) {
            return res.status(404).json({
                success: false,
                message: "Member not found"
            });
        }

        if (existingMember.teamId !== teamId) {
            return res.status(400).json({
                success: false,
                message: "Member does not belong to the specified team"
            });
        }

        if (req.body.email) {
            const emailExists = await prisma.member.findFirst({
                where: {
                    email: req.body.email,
                    id: { not: memberId }
                }
            });

            if (emailExists) {
                return res.status(409).json({
                    success: false,
                    message: "Email already exists for another member"
                });
            }
        }

        const updatedMember = await prisma.member.update({
            where: { id: memberId },
            data: req.body
        });

        res.status(200).json({
            success: true,
            message: "Member updated successfully",
            data: updatedMember
        });
    } catch (error) {
        console.error("Error updating member:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

export const getAllTeams = async (req: Request, res: Response) => {
    try {
        const teams = await prisma.team.findMany({
            orderBy: { id: 'asc' },
            include: {
                team_members: true,
                problem_statement: true,
            },
        });

        const formattedTeams = teams.map((team: any) => ({
            teamId: team.id,
            scc_id: team.scc_id,
            ps_id: team.problem_statement?.psId ?? team.ps_id ?? null,
            title: team.title,
            category: team.problem_statement?.category ?? null,
            member_count: team.team_members.length ?? 0,
            paymentVerified: team.paymentVerified,
        }));

        res.json(formattedTeams);
    } catch (error) {
        console.error("Error fetching teams:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const verifyPayment = async (req: Request, res: Response) => {
    try {
        const { teamId } = req.params;
        const { verified } = req.body;

        if (!teamId) {
            return res.status(400).json({ error: "Team ID is required" });
        }

        if (typeof verified !== 'boolean') {
            return res.status(400).json({ error: "verified must be a boolean value" });
        }

        const team = await prisma.team.update({
            where: { id: Number(teamId) },
            data: {
                paymentVerified: verified,
            },
        });

        res.json({
            success: true,
            message: `Payment ${verified ? 'verified' : 'unverified'} for team "${team.title}"`,
            teamId: team.id,
            paymentVerified: team.paymentVerified,
        });
    } catch (error) {
        console.error("Error verifying payment:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const deleteTeam = async (req: Request, res: Response) => {
    try {
        const teamId = Number(req.params.teamId);

        if (!Number.isFinite(teamId) || Number.isNaN(teamId)) {
            return res.status(400).json({
                success: false,
                message: "teamId must be a valid number"
            });
        }

        const existingTeam = await prisma.team.findUnique({
            where: { id: teamId },
            include: { 
                team_members: true,
                problem_statement: true
            }
        });

        if (!existingTeam) {
            return res.status(404).json({
                success: false,
                message: "Team not found"
            });
        }

        await prisma.$transaction(async (tx) => {
            for (const member of existingTeam.team_members) {
                await tx.deletedMember.create({
                    data: {
                        original_id: member.id,
                        name: member.name,
                        email: member.email,
                        phone_number: member.phone_number,
                        profile_image: member.profile_image,
                        department: member.department,
                        college_name: member.college_name,
                        year_of_study: member.year_of_study,
                        location: member.location,
                        attendance: member.attendance,
                        tShirtSize: member.tShirtSize,
                        teamId: null,
                        team_title: existingTeam.title,
                    }
                });
            }

            await tx.member.deleteMany({
                where: { teamId: teamId }
            });

            await tx.task.deleteMany({
                where: { teamId: teamId }
            });

            await tx.team.delete({
                where: { id: teamId }
            });
        });

        res.status(200).json({
            success: true,
            message: "Team deleted successfully and members moved to archive",
            data: {
                teamId: teamId,
                teamTitle: existingTeam.title,
                membersArchived: existingTeam.team_members.length,
                deletedAt: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error("Error deleting team:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

export const addMember = async (req: Request, res: Response) => {
    try {
        const teamId = Number(req.params.teamId);

        if (!Number.isFinite(teamId) || Number.isNaN(teamId)) {
            return res.status(400).json({
                success: false,
                message: "teamId must be a valid number"
            });
        }

        const existingTeam = await prisma.team.findUnique({
            where: { id: teamId },
            include: { team_members: true }
        });

        if (!existingTeam) {
            return res.status(404).json({
                success: false,
                message: "Team not found"
            });
        }

        // Check if team already has 6 members
        if (existingTeam.team_members.length >= 6) {
            return res.status(400).json({
                success: false,
                message: "Team already has maximum number of members (6)"
            });
        }

        // Validate required fields
        const { name, email, phone_number, department, college_name, year_of_study, tShirtSize } = req.body;

        if (!name || !email || !phone_number || !department || !college_name || !year_of_study || !tShirtSize) {
            return res.status(400).json({
                success: false,
                message: "All required fields must be provided: name, email, phone_number, department, college_name, year_of_study, tShirtSize"
            });
        }

        // Check if email already exists
        const emailExists = await prisma.member.findFirst({
            where: { email }
        });

        if (emailExists) {
            return res.status(409).json({
                success: false,
                message: "Email already exists"
            });
        }

        const newMember = await prisma.member.create({
            data: {
                name,
                email,
                phone_number,
                department,
                college_name,
                year_of_study: Number(year_of_study),
                location: req.body.location || "",
                tShirtSize,
                attendance: 0,
                teamId
            }
        });

        res.status(201).json({
            success: true,
            message: "Member added successfully",
            data: newMember
        });
    } catch (error) {
        console.error("Error adding member:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

export const deleteMember = async (req: Request, res: Response) => {
    try {
        const teamId = Number(req.params.teamId);
        const memberId = Number(req.params.memberId);

        if (!Number.isFinite(teamId) || Number.isNaN(teamId)) {
            return res.status(400).json({
                success: false,
                message: "teamId must be a valid number"
            });
        }

        if (!Number.isFinite(memberId) || Number.isNaN(memberId)) {
            return res.status(400).json({
                success: false,
                message: "memberId must be a valid number"
            });
        }

        const team = await prisma.team.findUnique({
            where: { id: teamId },
            include: { team_members: true }
        });

        if (!team) {
            return res.status(404).json({
                success: false,
                message: "Team not found"
            });
        }

        const existingMember = await prisma.member.findUnique({
            where: { id: memberId }
        });

        if (!existingMember) {
            return res.status(404).json({
                success: false,
                message: "Member not found"
            });
        }

        if (existingMember.teamId !== teamId) {
            return res.status(400).json({
                success: false,
                message: "Member does not belong to the specified team"
            });
        }

        // Check if member is the team lead (first member)
        const sortedMembers = team.team_members.sort((a, b) => a.id - b.id);
        if (sortedMembers.length > 0 && sortedMembers[0]?.id === memberId) {
            return res.status(400).json({
                success: false,
                message: "Cannot delete team lead. Transfer leadership first."
            });
        }

        await prisma.member.delete({
            where: { id: memberId }
        });

        res.status(200).json({
            success: true,
            message: "Member deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting member:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

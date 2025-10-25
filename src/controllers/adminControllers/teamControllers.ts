import { PrismaClient } from "@prisma/client";
import type { Request, Response } from "express";
const prisma = new PrismaClient();

export const getDetails = async (req: Request, res: Response) => {
    const teamId: number = (req as any).user.teamId;

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
            scc_id : team.scc_id,
            ps_id : team.ps_id ,
            team_members: team.team_members,
        });
    } catch (error) {
        console.error("Error fetching team members:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// export const getTeamMembers = async (req: Request, res: Response) => {
//   try {
//     const teamId = Number((req as any).teamId || req.params.teamId || req.query.teamId);

//     if (!teamId) {
//       return res.status(400).json({ error: "teamId is missing" });
//     }

//     // Find all members with the given teamId
//     const members = await prisma.member.findMany({
//       where: { teamId },
//       select: {
//         id: true,
//         name: true,
//         email: true,
//         phone_number: true,
//         profile_image: true,
//         department: true,
//         college_name: true,
//         year_of_study: true,
//         role: true,
//       },
//     });

//     if (members.length === 0) {
//       return res.status(404).json({ error: "No members found for this team" });
//     }

//     res.json({
//       teamId,
//       members,
//       count: members.length,
//     });
//   } catch (error) {
//     console.error("Error fetching team members:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// };

export const getAllTeams = async (req: Request, res: Response) => {
    try {
        const teams = await prisma.team.findMany({
            include: {
                team_members: true,
            },
        });

        const formattedTeams = teams.map((team: any) => ({
            teamId: team.id,
            scc_id : team.scc_id ,
            title: team.title,
            members: team.team_members,
        }));

        res.json(formattedTeams);
    } catch (error) {
        console.error("Error fetching teams:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

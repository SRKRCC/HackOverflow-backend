import type { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const validateTeamId = async (req: Request, res: Response, next: NextFunction) => {
  const { teamId } = req.params;
  
  try {
    let team;
    let numericTeamId;

    // Check if teamId is a number
    const parsedId = Number(teamId);
    
    if (!isNaN(parsedId) && parsedId > 0) {
      // If it's a valid number, find team by numeric ID
      team = await prisma.team.findUnique({
        where: { id: parsedId }
      });
      numericTeamId = parsedId;
    } else {
      // If it's not a number, assume it's scc_id like "SCC001"
      if (teamId) {
        team = await prisma.team.findFirst({
          where: { scc_id: teamId }
        });
        numericTeamId = team?.id;
      }
    }

    if (!team) {
      return res.status(400).json({ error: "Invalid team ID" });
    }

    (req as any).teamId = numericTeamId;
    (req as any).team = team; // Also store the full team object for reference
    next();
  } catch (error) {
    return res.status(500).json({ error: "Database error validating team ID" });
  }
};

import type { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma.js";

export const validateTeamId = async (req: Request, res: Response, next: NextFunction) => {
  const { teamId } = req.params;
  
  try {
    let team;
    let numericTeamId;

    const parsedId = Number(teamId);
    
    if (!isNaN(parsedId) && parsedId > 0) {
      team = await prisma.team.findUnique({
        where: { id: parsedId }
      });
      numericTeamId = parsedId;
    } else {
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
    (req as any).team = team;
    next();
  } catch (error) {
    return res.status(500).json({ error: "Database error validating team ID" });
  }
};

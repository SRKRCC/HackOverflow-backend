import type { Request, Response, NextFunction } from "express";

export const validateTeamId = (req: Request, res: Response, next: NextFunction) => {
  const { teamId } = req.params;
  const parsedId = Number(teamId);

  if (isNaN(parsedId) || parsedId <= 0) {
    return res.status(400).json({ error: "Invalid team ID" });
  }

  (req as any).teamId = parsedId;
  next();
};

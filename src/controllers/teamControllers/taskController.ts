import { prisma } from "../../lib/prisma.js";
import { error } from "console";
import type { Request, Response } from "express";
import { auditService } from '../../services/auditService.js';
import { createAuditContext } from '../../utils/auditHelpers.js';

export const getTeamTasks = async (req: Request, res: Response) => {
  try {
    const teamId = (req as any).user.teamId;
    
    
    if (!teamId) {
      console.log((req as any).user);
      return res.status(400).json({ error: 'Team ID is required' });
    }
    
    const tasks = await prisma.task.findMany({
      where: { teamId: teamId },
      include: { team: true },
      orderBy: { timestamp: 'desc' }
    });
    
    const sanitizedTasks = tasks.map(({ points_earned, ...task }) => task);
    
    res.json(sanitizedTasks);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const submitTaskForReview = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { teamNotes } = req.body;
    const teamId = (req as any).user.teamId;
    
    const context = createAuditContext(req, { team_id: teamId?.toString() });
    
    await auditService.logTask(
      'SUBMIT_TASK',
      context,
      req.path,
      200,
      {
        task_id: id,
        team_id: teamId,
        has_notes: !!teamNotes
      }
    );
    
    const task = await prisma.task.findUnique({
      where: { id: Number(id) }
    });
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    if (task.status !== 'Pending') {
      return res.status(400).json({ error: 'Task must be pending to submit for review' });
    }
    
    const updatedTask = await prisma.task.update({
      where: { id: Number(id) },
      data: {
        status: 'InReview',
        in_review: true,
        completed: false,
        teamNotes: teamNotes || null
      }
    });
    
    res.json({ message: 'Task submitted for review successfully', task: updatedTask });
    const { points_earned, ...sanitizedTask } = updatedTask;
    
    res.json({ message: 'Task submitted for review successfully', task: sanitizedTask });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getTaskById = async (req: Request, res: Response) => {
  try {
    const teamId = (req as any).user.teamId;

    if (!teamId) {
      return res.status(404).json({ error: "Team ID not found" });
    }

    const team = await prisma.team.findUnique({
      where: { id: Number(teamId) },
    });

    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }
    
    const { id } = req.params;
    
    const task = await prisma.task.findUnique({
      where: { id: Number(id) },
      include: { team: true }
    });
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    const { points_earned, ...sanitizedTask } = task;
    
    res.json(sanitizedTask);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

import { PrismaClient } from "../../../lib/generated/prisma/index.js";
import type { Request, Response } from "express";

const prisma = new PrismaClient();

// Get tasks assigned to a specific team
export const getTeamTasks = async (req: Request, res: Response) => {
  try {
    // Get the processed teamId from the validateTeamId middleware
    const teamId = (req as any).teamId;
    
    if (!teamId) {
      return res.status(400).json({ error: 'Team ID is required' });
    }
    
    const tasks = await prisma.task.findMany({
      where: { teamId: teamId },
      include: { team: true },
      orderBy: { timestamp: 'desc' }
    });
    
    res.json(tasks);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Team submits task for review
export const submitTaskForReview = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { teamNotes } = req.body;
    
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
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Get task details for a specific task
export const getTaskById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const task = await prisma.task.findUnique({
      where: { id: Number(id) },
      include: { team: true }
    });
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    res.json(task);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

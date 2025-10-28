import { PrismaClient } from "@prisma/client";
import type { Request, Response } from "express";

const prisma = new PrismaClient();

// Create Task (Admin assigns task to team)
export const createTask = async (req: Request, res: Response) => {
  try {
    const { title, description, difficulty, round_num, points, teamId } = req.body;
    
    // Validate required fields
    if (!title || !teamId || !round_num) {
      return res.status(400).json({ error: 'Title, teamId, and round_num are required' });
    }

    // Find team by scc_id (teamId can be either numeric ID or scc_id string)
    let team;
    if (typeof teamId === 'string' && isNaN(Number(teamId))) {
      // If teamId is a string like "SCC001", find by scc_id
      team = await prisma.team.findFirst({
        where: { scc_id: teamId }
      });
      console.log(teamId);
      if (!team) {
        return res.status(404).json({ error: `Team with scc_id ${teamId} not found` });
      }
    } else {
      // If teamId is numeric, find by numeric ID
      team = await prisma.team.findUnique({
        where: { id: Number(teamId) }
      });
      if (!team) {
        return res.status(404).json({ error: `Team with ID ${teamId} not found` });
      }
    }

    const task = await prisma.task.create({
      data: { 
        title, 
        description, 
        difficulty, 
        round_num, 
        points: points || 0,
        teamId: team.id, // Use the numeric team ID for the database
        status: 'Pending', // Default status when admin assigns
        completed: false,
        in_review: false
      },
    });
    res.json(task);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Get all tasks
export const getTasks = async (req: Request, res: Response) => {
  try {
    const tasks = await prisma.task.findMany({ include: { team: true } });
    res.json(tasks);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Get one task
export const getTaskById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const task = await prisma.task.findUnique({
      where: { id: Number(id) },
      include: { team: true },
    });
    res.json(task);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Update Task
export const updateTask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const task = await prisma.task.update({
      where: { id: Number(id) },
      data,
    });
    res.json(task);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Admin marks task as completed after review
export const completeTask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reviewNotes } = req.body;
    
    const task = await prisma.task.findUnique({
      where: { id: Number(id) }
    });
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    if (task.status !== 'InReview') {
      return res.status(400).json({ error: 'Task must be in review to complete' });
    }
    
    const updatedTask = await prisma.task.update({
      where: { id: Number(id) },
      data: {
        status: 'Completed',
        completed: true,
        in_review: false,
        reviewNotes: reviewNotes || null
      }
    });
    
    res.json({ message: 'Task completed successfully', task: updatedTask });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Delete Task
export const deleteTask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.task.delete({ where: { id: Number(id) } });
    res.json({ message: "Task deleted" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
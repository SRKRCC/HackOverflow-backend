import { PrismaClient } from "../../../lib/generated/prisma/index.js";
import type { Request, Response } from "express";

const prisma = new PrismaClient();

// Create Task
export const createTask = async (req: Request, res: Response) => {
  try {
    const { title, description, difficulty, round_num, points, teamId } = req.body;
    const task = await prisma.task.create({
      data: { title, description, difficulty, round_num, points, teamId },
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

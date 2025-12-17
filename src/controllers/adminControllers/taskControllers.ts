import { prisma } from "../../lib/prisma.js";
import type { Request, Response } from "express";
import { auditService } from '../../services/auditService.js';
import { createAuditContext, logTaskDecision } from '../../utils/auditHelpers.js';

export const createTask = async (req: Request, res: Response) => {
  try {
    const { title, description, difficulty, round_num, points, points_earned, teamId } = req.body;
    const context = createAuditContext(req);
    
    if (!title || !teamId || !round_num) {
      return res.status(400).json({ error: 'Title, teamId, and round_num are required' });
    }

    if (points_earned !== undefined) {
      const maxPoints = points || 0;
      if (typeof points_earned !== 'number' || points_earned < 0 || points_earned > maxPoints) {
        return res.status(400).json({ error: `points_earned must be between 0 and ${maxPoints}` });
      }
    }

    let team;
    if (typeof teamId === 'string' && isNaN(Number(teamId))) {
      team = await prisma.team.findFirst({
        where: { scc_id: teamId }
      });
      console.log(teamId);
      if (!team) {
        return res.status(404).json({ error: `Team with scc_id ${teamId} not found` });
      }
    } else {
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
        points_earned: points_earned ?? 0,
        teamId: team.id,
        status: 'Pending',
        completed: false,
        in_review: false
      },
    });
    
    await auditService.logAdmin(
      'CREATE_TASK' as any,
      { ...context, team_id: team.id.toString() },
      req.path,
      200,
      `Created task "${title}" for team ${team.scc_id}`,
      {
        task_id: task.id,
        team_id: team.id,
        team_scc_id: team.scc_id,
        task_title: title,
        difficulty,
        points: points || 0
      }
    );
    
    res.json(task);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};


export const getTasks = async (req: Request, res: Response) => {
  try {
    const tasks = await prisma.task.findMany({ include: { team: true } });
    res.json(tasks);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};


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


export const updateTask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;
    
    const task = await prisma.task.findUnique({ where: { id: Number(id) } });
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    if (data.points_earned !== undefined) {
      const maxPoints = data.points !== undefined ? data.points : task.points;
      if (typeof data.points_earned !== 'number' || data.points_earned < 0 || data.points_earned > maxPoints) {
        return res.status(400).json({ error: `points_earned must be between 0 and ${maxPoints}` });
      }
    }
    
    if (data.points !== undefined && data.points_earned === undefined) {
      if (task.points_earned !== null && task.points_earned > data.points) {
        data.points_earned = data.points;
      }
    }
    
    const updatedTask = await prisma.task.update({
      where: { id: Number(id) },
      data,
    });
    res.json(updatedTask);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};


export const completeTask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reviewNotes, points_earned } = req.body;
    const context = createAuditContext(req);
    
    const task = await prisma.task.findUnique({
      where: { id: Number(id) },
      include: { team: true }
    });
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    if (task.status !== 'InReview') {
      return res.status(400).json({ error: 'Task must be in review to complete' });
    }
    
    if (points_earned !== undefined) {
      if (typeof points_earned !== 'number' || points_earned < 0 || points_earned > task.points) {
        return res.status(400).json({ error: `points_earned must be between 0 and ${task.points}` });
      }
    }
    
    const updatedTask = await prisma.task.update({
      where: { id: Number(id) },
      data: {
        status: 'Completed',
        completed: true,
        in_review: false,
        reviewNotes: reviewNotes || null,
        points_earned: points_earned !== undefined ? points_earned : task.points
      }
    });
    
    if (id) {
      await logTaskDecision(
        'APPROVE_TASK',
        req,
        id.toString(),
        {
          task_title: task.title,
          team_id: task.teamId,
          team_scc_id: task.team?.scc_id,
          review_notes: reviewNotes,
          points_max: task.points,
          points_awarded: points_earned !== undefined ? points_earned : task.points
        }
      );
    }
    
    res.json({ message: 'Task completed successfully', task: updatedTask });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};


export const deleteTask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const context = createAuditContext(req);
    
    const task = await prisma.task.findUnique({
      where: { id: Number(id) },
      include: { team: true }
    });
    
    if (task) {
      await auditService.logAdmin(
        'DELETE_DATA',
        { ...context, team_id: task.teamId?.toString() },
        req.path,
        200,
        `Deleted task "${task.title}" for team ${task.team?.scc_id}`,
        {
          task_id: Number(id),
          task_title: task.title,
          team_id: task.teamId,
          team_scc_id: task.team?.scc_id
        }
      );
    }
    
    await prisma.task.delete({ where: { id: Number(id) } });
    res.json({ message: "Task deleted" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const moveTaskToPending = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const context = createAuditContext(req);
    
    const task = await prisma.task.findUnique({
      where: { id: Number(id) },
      include: { team: true }
    });
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    const updatedTask = await prisma.task.update({
      where: { id: Number(id) },
      data: {
        status: 'Pending',
        completed: false,
        in_review: false,
        reviewNotes: null
      }
    });
    
    await auditService.logAdmin(
      'MOVE_TASK_TO_PENDING' as any,
      { ...context, team_id: task.teamId?.toString() },
      req.path,
      200,
      `Moved task "${task.title}" for team ${task.team?.scc_id} to Pending`,
      {
        task_id: Number(id),
        task_title: task.title,
        team_id: task.teamId,
        team_scc_id: task.team?.scc_id
      }
    );
    
    res.json({ message: 'Task moved to Pending successfully', task: updatedTask });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
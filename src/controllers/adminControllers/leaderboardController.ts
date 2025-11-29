import { prisma, connectPrisma } from "../../lib/prisma.js";
import type { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 300 }); // 5 minutes TTL

interface LeaderboardEntry {
  id: number;
  title: string;
  totalPoints: number;
  completedTasks: number;
  rank : number
}

export const fetchLeaderboard = async (): Promise<void> => {
  try {
    // Try query; on P5010 (cannot fetch data) attempt reconnect once
    let teams;
    try {
      teams = await prisma.team.findMany({ include: { tasks: true } });
    } catch (err: any) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P5010') {
        console.warn('Prisma fetch failed (P5010). Attempting to reconnect...');
        await connectPrisma();
        teams = await prisma.team.findMany({ include: { tasks: true } });
      } else {
        throw err;
      }
    }

    const leaderboard: LeaderboardEntry[] = teams.map((team: any) => ({
      id: team.id,                     // match your LeaderboardEntry interface
      title: team.title,                // renamed accordingly
      totalPoints: team.tasks
        .filter((task: any) => task.status === "Completed")  // ✅ only completed
        .reduce((sum: number, task: any) => sum + (task.points || 0), 0),
      completedTasks: team.tasks.filter((task: any) => task.status === "Completed").length,
      rank: 0, // will update after sorting
    }));

    leaderboard.sort((a, b) => b.totalPoints - a.totalPoints);

    leaderboard.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    cache.set("leaderboard", leaderboard);
    console.log("Leaderboard cache updated at", new Date().toISOString());
  } catch (error: any) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P5010') {
      console.error('Error fetching leaderboard (DB fetch failed):', error.message);
    } else {
      console.error("Error fetching leaderboard:", error);
    }
  }
};


export const getLeaderboard = async (req: Request, res: Response) => {
  try {
    let leaderboard = cache.get<LeaderboardEntry[]>('leaderboard');
    if (!leaderboard) {
      await fetchLeaderboard();
      leaderboard = cache.get<LeaderboardEntry[]>('leaderboard');
    }
    res.json(leaderboard || []);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
};
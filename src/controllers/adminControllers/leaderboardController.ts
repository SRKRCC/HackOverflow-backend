import { PrismaClient } from "@prisma/client";
import type { Request, Response } from 'express';
import NodeCache from 'node-cache';

const prisma = new PrismaClient();
const cache = new NodeCache({ stdTTL: 300 }); // 5 minutes TTL

interface LeaderboardEntry {
  id: number;
  title: string;
  totalPoints: number;
}

export const fetchLeaderboard = async (): Promise<void> => {
  try {
    const teams = await prisma.team.findMany({
      include: { tasks: true },
    });

    const leaderboard: LeaderboardEntry[] = teams.map((team: any) => ({
      id: team.id,
      title: team.title,
      totalPoints: team.tasks.reduce((sum: number, task: any) => sum + task.points, 0),
    }));

    leaderboard.sort((a, b) => b.totalPoints - a.totalPoints);

    cache.set('leaderboard', leaderboard);
    console.log('Leaderboard cache updated at', new Date().toISOString());
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
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
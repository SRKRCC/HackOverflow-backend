import { PrismaClient } from "@prisma/client";
import type { Request, Response } from 'express';
import NodeCache from 'node-cache';

const prisma = new PrismaClient();
const cache = new NodeCache({ stdTTL: 300 }); // 5 minutes TTL

interface LeaderboardEntry {
  id: number;
  title: string;
  totalPoints: number;
  rank : number
}

export const fetchLeaderboard = async (): Promise<void> => {
  try {
    const teams = await prisma.team.findMany({
      include: { tasks: true },
    });

    const leaderboard: LeaderboardEntry[] = teams.map((team: any) => ({
      id: team.id,                     // match your LeaderboardEntry interface
      title: team.title,                // renamed accordingly
      totalPoints: team.tasks
        .filter((task: any) => task.status === "Completed")  // ✅ only completed
        .reduce((sum: number, task: any) => sum + (task.points || 0), 0),
      completedTasks: team.tasks.filter((task: any) => task.status === "Completed").length,
      rank: 0, // will update after sorting
    }));

    // ✅ Sort by total points descending
    leaderboard.sort((a, b) => b.totalPoints - a.totalPoints);

    // ✅ Assign ranks after sorting
    leaderboard.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    cache.set("leaderboard", leaderboard);
    console.log("Leaderboard cache updated at", new Date().toISOString());
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
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
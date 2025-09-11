import { Router } from "express";
import { PrismaClient, Prisma } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

// ✅ Strongly typed Team with relations
type TeamWithRelations = Prisma.TeamGetPayload<{
  include: {
    leader: true;
    team_members: true;
    _count: { select: { team_members: true } };
  };
}>;

router.get("/", async (req, res) => {
  const { query } = req.query;

  if (!query || typeof query !== "string") {
    return res.status(400).json({ error: "Query parameter is required" });
  }

  try {
    const filters: Prisma.TeamWhereInput[] = [];

    // Search by numeric team ID
    if (!isNaN(Number(query))) {
      filters.push({ id: Number(query) } as Prisma.TeamWhereInput);
    }

    // Search by team title
    filters.push({ title: { contains: query, mode: "insensitive" } });

    // Search by leader name
    filters.push({
      leader: { name: { contains: query, mode: "insensitive" } },
    });

    // Search by member name
    filters.push({
      team_members: {
        some: { name: { contains: query, mode: "insensitive" } },
      },
    });

    // Fetch teams with leader + members + member count
    const teams: TeamWithRelations[] = await prisma.team.findMany({
      where: { OR: filters },
      include: {
        leader: true,
        team_members: true,
        _count: { select: { team_members: true } },
      },
    });

    // Transform response
    const results = teams.map((team) => ({
      id: team.id,
      title: team.title,
      teamLeader: team.leader ? team.leader.name : "N/A",
      memberCount: team._count.team_members,
      members: team.team_members.map((m) => ({
        id: m.id,
        name: m.name,
      })),
    }));

    res.json({ results });
  } catch (error) {
    console.error("❌ Search API error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

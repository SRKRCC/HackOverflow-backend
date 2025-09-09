import type { Request, Response } from 'express';
import { PrismaClient } from '../../lib/generated/prisma/index.js';
import { generatePassword, generateUniqueSccId } from '../utils/registration.js';

const prisma = new PrismaClient();

/**
 * Expected payload shape (JSON):
 * {
 *  lead: { name, email, phone_number, profile_image?, department?, college_name, year_of_study?, location? },
 *  members: [{ name, email, phone_number, ... }],
 *  problemStatement: { id? (ps id), title?, category?, description? },
 *  gallery_images?: string[]
 * }
 */
export async function registerTeam(req: Request, res: Response) {
  console.log('Register route hit');
  try {
    const { lead, members = [], problemStatement, gallery_images = [] } = req.body;

    // Basic validation
    if (!lead || !lead.name || !lead.email || !lead.phone_number || !lead.college_name) {
      return res.status(400).json({ error: 'Missing required lead fields' });
    }

    // Ensure lead email not already used
    const existingLead = await prisma.member.findUnique({ where: { email: lead.email } });
    if (existingLead) {
      return res.status(409).json({ error: 'Lead email already registered' });
    }

    // Check duplicate emails among provided members (including lead)
    const emails = [lead.email, ...members.map((m: any) => m.email)];
    const dup = emails.find((e, i) => emails.indexOf(e) !== i);
    if (dup) return res.status(400).json({ error: `Duplicate email in payload: ${dup}` });

    // Check any existing member emails in DB
    const existingMembers = await prisma.member.findMany({ where: { email: { in: emails } } });
    if (existingMembers.length > 0) {
      return res.status(409).json({ error: 'One or more emails already registered', emails: existingMembers.map(m => m.email) });
    }

    // Handle problem statement: if id provided use existing, otherwise create new
    let psId: number | null = null;
    if (problemStatement) {
      if (problemStatement.id) {
        const existing = await prisma.problemStatement.findUnique({ where: { id: Number(problemStatement.id) } });
        if (!existing) return res.status(400).json({ error: 'Provided problemStatement.id not found' });
        psId = existing.id;
      } else if (problemStatement.title) {
        const created = await prisma.problemStatement.create({ data: {
          psId: problemStatement.psId ?? `PS-${Date.now()}`,
          title: problemStatement.title,
          category: problemStatement.category ?? 'Uncategorized',
          description: problemStatement.description ?? '',
          tags: problemStatement.tags ?? [],
        }});
        psId = created.id;
      }
    }

    // Generate SCC credentials
    const scc_id = await generateUniqueSccId();
    const scc_password = generatePassword(12);

    // Create team and members in a transaction
    const created = await prisma.$transaction(async (tx) => {
      const teamData: any = {
        scc_id,
        scc_password,
        title: lead.team_title ?? `Team ${lead.name}`,
        gallery_images: gallery_images || [],
      };
      if (typeof psId === 'number') teamData.ps_id = psId;

      const team = await tx.team.create({ data: teamData });

      // Create lead as a member assigned to team
      const leadMember = await tx.member.create({
        data: {
          name: lead.name,
          email: lead.email,
          phone_number: lead.phone_number,
          profile_image: lead.profile_image ?? null,
          department: lead.department ?? null,
          college_name: lead.college_name,
          year_of_study: lead.year_of_study ?? null,
          location: lead.location ?? null,
          attendance: lead.attendance ?? 0,
          teamId: team.id,
        },
      });

      // Create other members
      for (const m of members) {
        await tx.member.create({ data: {
          name: m.name,
          email: m.email,
          phone_number: m.phone_number,
          profile_image: m.profile_image ?? null,
          department: m.department ?? null,
          college_name: m.college_name ?? lead.college_name,
          year_of_study: m.year_of_study ?? null,
          location: m.location ?? null,
          attendance: m.attendance ?? 0,
          teamId: team.id,
        }});
      }

      return team;
    });

    // Return full team with members
    const teamWithMembers = await prisma.team.findUnique({
      where: { id: created.id },
      include: { team_members: true, tasks: true, problem_statement: true },
    });

    return res.status(201).json(teamWithMembers);
  } catch (err: any) {
    console.error('Registration error', err);
    if (err?.code === 'P2002') {
      return res.status(409).json({ error: 'Unique constraint failed', meta: err.meta });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default { registerTeam };

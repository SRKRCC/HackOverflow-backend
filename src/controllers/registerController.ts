import { PrismaClient } from '../../lib/generated/prisma/index.js';
import type { Request, Response } from 'express';
import { generatePassword, generateUniqueSccId } from '../utils/registration.js';

const prisma = new PrismaClient();

/**
 * Expected payload shape (JSON):
 * {
 *  data: {
 *    team: { title: string, gallery_images?: string[] },
 *    lead: { name, email, phone_number, profile_image?, department?, college_name, year_of_study?, location? },
 *    members: [{ name, email, phone_number, profile_image?, department?, college_name, year_of_study?, location? }],
 *    problemStatement: { id?: number } OR { title, category, description, tags: string[] }
 *  }
 * }
 */
export async function registerTeam(req: Request, res: Response) {
  console.log('Register route hit');
  try {
    const { data } = req.body;
    
    if (!data) {
      return res.status(400).json({ error: 'Missing data object in request body' });
    }

    const { team, lead, members = [], problemStatement } = data;

    // Validate team data
    if (!team || !team.title) {
      return res.status(400).json({ error: 'Missing required team title' });
    }

    // Basic validation for lead
    if (!lead || !lead.name || !lead.email || !lead.phone_number || !lead.college_name) {
      return res.status(400).json({ error: 'Missing required lead fields (name, email, phone_number, college_name)' });
    }

    // Ensure lead email not already used
    const existingLead = await prisma.member.findUnique({ where: { email: lead.email } });
    if (existingLead) {
      return res.status(409).json({ error: 'Lead email already registered' });
    }

    // Check duplicate emails among provided members (including lead)
    const emails = [lead.email, ...members.map((m: any) => m.email)];
    const dup = emails.find((e, i) => emails.indexOf(e) !== i);
    if (dup) {
      return res.status(400).json({ error: `Duplicate email found: ${dup}` });
    }

    // Check any existing member emails in DB
    const existingMembers = await prisma.member.findMany({ where: { email: { in: emails } } });
    if (existingMembers.length > 0) {
      return res.status(409).json({ 
        error: 'One or more emails already registered', 
        existing: existingMembers.map(m => m.email) 
      });
    }

    // Handle problem statement: if id provided use existing, otherwise create new
    let psId: number;
    if (problemStatement) {
      if (problemStatement.id) {
        // Use existing problem statement
        const existingPs = await prisma.problemStatement.findUnique({ 
          where: { id: problemStatement.id } 
        });
        if (!existingPs) {
          return res.status(400).json({ error: 'Problem statement with provided ID not found' });
        }
        psId = problemStatement.id;
      } else if (problemStatement.title && problemStatement.category && problemStatement.description) {
        // Create new problem statement
        const newPs = await prisma.problemStatement.create({
          data: {
            psId: `PS-${Date.now()}`, // Generate unique psId
            title: problemStatement.title,
            category: problemStatement.category,
            description: problemStatement.description,
            tags: problemStatement.tags || []
          }
        });
        psId = newPs.id;
      } else {
        return res.status(400).json({ 
          error: 'Problem statement must have either id OR (title, category, description)' 
        });
      }
    } else {
      return res.status(400).json({ error: 'Problem statement is required' });
    }

    // Generate SCC credentials
    const scc_id = await generateUniqueSccId();
    const scc_password = generatePassword(12);

    // Create team and members in a transaction
    const created = await prisma.$transaction(async (tx) => {
      // Create the team
      const newTeam = await tx.team.create({
        data: {
          scc_id,
          scc_password,
          title: team.title,
          ps_id: psId,
          gallery_images: team.gallery_images || [],
        },
      });

      // Create lead as a member
      const leadMember = await tx.member.create({
        data: {
          name: lead.name,
          email: lead.email,
          phone_number: lead.phone_number,
          profile_image: lead.profile_image || null,
          department: lead.department || null,
          college_name: lead.college_name,
          year_of_study: lead.year_of_study || null,
          location: lead.location || null,
          teamId: newTeam.id,
        },
      });

      // Create other members
      const otherMembers = await Promise.all(
        members.map((member: any) =>
          tx.member.create({
            data: {
              name: member.name,
              email: member.email,
              phone_number: member.phone_number,
              profile_image: member.profile_image || null,
              department: member.department || null,
              college_name: member.college_name,
              year_of_study: member.year_of_study || null,
              location: member.location || null,
              teamId: newTeam.id,
            },
          })
        )
      );

      return { ...newTeam, members: [leadMember, ...otherMembers] };
    });

    // Return full team with members, problem statement, and tasks
    const teamWithDetails = await prisma.team.findUnique({
      where: { id: created.id },
      include: { 
        team_members: true, 
        tasks: true, 
        problem_statement: true 
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Team registered successfully',
      team: teamWithDetails
    });

  } catch (err: any) {
    console.error('Registration error', err);
    if (err?.code === 'P2002') {
      return res.status(409).json({ error: 'Database constraint violation - duplicate data' });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default { registerTeam };

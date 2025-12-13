import { prisma } from "../../lib/prisma.js";
import type { Request, Response } from "express";

export const getAllMembers = async (req: Request, res: Response) => {
    try {
        const {
            search,
            department,
            college,
            year,
            tShirtSize,
            hasTeam
        } = req.query;

        const where: any = {};

        if (search && typeof search === 'string') {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { phone_number: { contains: search, mode: 'insensitive' } }
            ];
        }

        if (department && typeof department === 'string') {
            where.department = { contains: department, mode: 'insensitive' };
        }

        if (college && typeof college === 'string') {
            where.college_name = { contains: college, mode: 'insensitive' };
        }

        if (year) {
            const yearNum = Number(year);
            if (!isNaN(yearNum)) {
                where.year_of_study = yearNum;
            }
        }

        if (tShirtSize && typeof tShirtSize === 'string') {
            where.tShirtSize = tShirtSize;
        }

        if (hasTeam !== undefined) {
            if (hasTeam === 'true') {
                where.teamId = { not: null };
            } else if (hasTeam === 'false') {
                where.teamId = null;
            }
        }

        const members = await prisma.member.findMany({
            where,
            include: {
                team: {
                    select: {
                        id: true,
                        title: true,
                        scc_id: true
                    }
                }
            },
            orderBy: {
                id: 'asc'
            }
        });

        res.json(members);
    } catch (error) {
        console.error("Error fetching members:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};


export const getMemberFilters = async (req: Request, res: Response) => {
    try {
        const [departments, colleges, years, tShirtSizes] = await Promise.all([
            prisma.member.findMany({
                where: { department: { not: null } },
                select: { department: true },
                distinct: ['department']
            }),
            prisma.member.findMany({
                select: { college_name: true },
                distinct: ['college_name']
            }),
            prisma.member.findMany({
                where: { year_of_study: { not: null } },
                select: { year_of_study: true },
                distinct: ['year_of_study']
            }),
            prisma.member.findMany({
                where: { tShirtSize: { not: null } },
                select: { tShirtSize: true },
                distinct: ['tShirtSize']
            })
        ]);

        res.json({
            departments: departments.map(d => d.department).filter(Boolean).sort(),
            colleges: colleges.map(c => c.college_name).sort(),
            years: years.map(y => y.year_of_study).filter(Boolean).sort((a, b) => a! - b!),
            tShirtSizes: tShirtSizes.map(t => t.tShirtSize).filter(Boolean).sort()
        });
    } catch (error) {
        console.error("Error fetching member filters:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

import { PrismaClient } from "../../../lib/generated/prisma/index.js";
import type { Request, Response } from "express";

const prisma = new PrismaClient();

const statementSelect = {
  id: false, // exclude id
  psId: true,
  title: true,
  description: true,
  category: true,
  tags: true,
};

// Create Statement
export const createStatement = async (req: Request, res: Response) => {
  try {
    const { title, description, category, tags } = req.body;

    if (!title || !description || !category || !tags) {
      return res.status(400).json({ error: "All fields (title, description, category, tags) are required." });
    }

    const lastStatement = await prisma.problemStatement.findFirst({
      orderBy: { id: "desc" },
    });

    let nextNumber = 1;
    if (lastStatement?.psId) {
      const lastNumber = parseInt(lastStatement.psId.replace("HO2K25", ""), 10);
      nextNumber = lastNumber + 1;
    }

    const psId = `HO2K25${String(nextNumber).padStart(3, "0")}`;

    const statement = await prisma.problemStatement.create({
      data: { psId, title, description, category, tags },
      select: statementSelect,
    });

    res.status(201).json({ message: "Problem Statement created successfully", data: statement });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Get all Statements
export const getStatements = async (req: Request, res: Response) => {
  try {
    const statements = await prisma.problemStatement.findMany({
      select: statementSelect,
    });
    res.json({ message: "Problem Statements fetched successfully", data: statements });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Get one statement
export const getStatementById = async (req: Request, res: Response) => {
  try {
    const psId = req.params.id;
    if (!psId) {
      return res.status(400).json({ error: "Problem Statement ID is required." });
    }

    const statement = await prisma.problemStatement.findUnique({
      where: { psId },
      select: statementSelect,
    });

    if (!statement) {
      return res.status(404).json({ error: "Problem Statement not found." });
    }

    res.json({ message: "Problem Statement fetched successfully", data: statement });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Update Statement
export const updateStatement = async (req: Request, res: Response) => {
  try {
    const psId = req.params.id;
    if (!psId) {
      return res.status(400).json({ error: "Problem Statement ID is required." });
    }

    const data = req.body;
    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: "At least one field must be provided for update." });
    }

    const statement = await prisma.problemStatement.update({
      where: { psId },
      data,
      select: statementSelect,
    });

    res.json({ message: "Problem Statement updated successfully", data: statement });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Delete Statement
export const deleteStatement = async (req: Request, res: Response) => {
  try {
    const psId = req.params.id;
    if (!psId) {
      return res.status(400).json({ error: "Problem Statement ID is required." });
    }

    const deletedStatement = await prisma.problemStatement.delete({
      where: { psId },
      select: statementSelect,
    });

    res.json({ message: "Problem Statement deleted successfully", data: deletedStatement });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

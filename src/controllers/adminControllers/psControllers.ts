import { PrismaClient } from "@prisma/client";
import type { Request, Response } from "express";
import fs from "fs";
import csv from "csv-parser";

const prisma = new PrismaClient();

const statementSelect = {
  id: false, // exclude id
  psId: true,
  title: true,
  description: true,
  category: true,
  tags: true,
};

const createProblemStatement = async (row: any) => {
  const lastStatement = await prisma.problemStatement.findFirst({
    orderBy: { id: "desc" },
  });

  let nextNumber = 1;
  if (lastStatement?.psId) {
    const lastNumber = parseInt(lastStatement.psId.replace("HO2K25", ""), 10);
    nextNumber = lastNumber + 1;
  }

  const psId = `HO2K25${String(nextNumber).padStart(3, "0")}`;

  return prisma.problemStatement.create({
    data: {
      psId,
      title: row.title,
      description: row.description,
      category: row.category,
      tags:
        typeof row.tags === "string"
          ? row.tags.split(",").map((tag: string) => tag.trim())
          : row.tags,
    },
  });
};

export const uploadCsv = async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const uploadedFile = req.file;
  const results: any[] = [];

  try {
    const stream = fs.createReadStream(uploadedFile.path)
      .pipe(csv());

    stream.on("data", (data) => results.push(data));

    stream.on("end", async () => {
      try {
        let insertedCount = 0;

        for (const row of results) {
          if (!row.title || !row.description || !row.category || !row.tags) {
            console.warn("Skipping invalid row:", row);
            continue;
          }
          await createProblemStatement(row);
          insertedCount++;
        }

        // Delete file after processing
        fs.unlink(uploadedFile.path, (err) => {
          if (err) console.error("Error deleting file:", err);
        });

        res
          .status(201)
          .json({ message: `${insertedCount} problem statements created successfully` });
      } catch (err) {
        console.error("Error inserting problem statements:", err);
        res.status(500).json({ error: "Failed to create problem statements" });
      }
    });

    stream.on("error", (err) => {
      console.error("CSV parsing error:", err);
      res.status(400).json({ error: "Invalid CSV format" });
    });

  } catch (err) {
    console.error("Error processing CSV upload:", err);
    res.status(500).json({ error: "Something went wrong while processing the file" });
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
      where: { id : Number(psId) },
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

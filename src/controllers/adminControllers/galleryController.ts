import type { Request, Response } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 🧩 Configure Cloudinary using environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

// ===================================================
// 1️⃣ Upload Multiple Images to a Team
// ===================================================
export const uploadTeamImages = async (req: Request, res: Response): Promise<void> => {
  try {
    const teamId = req.params.teamId;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      res.status(400).json({ error: 'No files uploaded' });
      return;
    }

    // Upload all images to Cloudinary in parallel
    const uploadPromises = files.map((file) => {
      return new Promise<string>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: `hackoverflow_2k25/teams/${teamId}` },
          (error, result) => {
            if (error || !result) return reject(error);
            resolve(result.secure_url);
          }
        );
        streamifier.createReadStream(file.buffer).pipe(uploadStream);
      });

    });

    const uploadedUrls = await Promise.all(uploadPromises);

    // Append new URLs to existing gallery_images array
    const updatedTeam = await prisma.team.update({
      where: { id: Number(teamId) },
      data: {
        gallery_images: {
          push: uploadedUrls, // ✅ push multiple images at once
        },
      },
    });

    res.status(200).json({
      message: 'Images uploaded successfully',
      uploaded: uploadedUrls,
      team: updatedTeam,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to upload images' });
  }
};

// ===================================================
// 2️⃣ Remove a Specific Image from a Team
// ===================================================
export const removeTeamImage = async (req: Request, res: Response): Promise<void> => {
  try {
    const teamId = req.params.teamId;
    const { imageUrl }: { imageUrl: string } = req.body;

    const team = await prisma.team.findUnique({where: { id: Number(teamId) }});
    if (!team) {
      res.status(404).json({ error: 'Team not found' });
      return;
    }

    const updatedImages = team.gallery_images.filter((url : string ) => url !== imageUrl);

    console.log(imageUrl);

    const updatedTeam = await prisma.team.update({
      where: { id: Number(teamId) },
      data: { gallery_images: updatedImages },
    });

    res.status(200).json({
      message: 'Image removed successfully',
      team: updatedTeam,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to remove image' });
  }
};

// ===================================================
// 3️⃣ Get All Images for a Team
// ===================================================
export const getTeamImages = async (req: Request, res: Response): Promise<void> => {
  try {
    const teamId = req.params.teamId;
    console.log(teamId);
    const team = await prisma.team.findUnique({
      where: { id: Number(teamId) },
      select: { gallery_images: true },
    });

    if (!team) {
      res.status(404).json({ error: 'Team not found' });
      return;
    }

    res.status(200).json({
      teamId,
      images: team.gallery_images,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch team images' });
  }
};


export const getTeamImagesByToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const teamId: number = (req as any).user.teamId;
    console.log(teamId);
    const team = await prisma.team.findUnique({
      where: { id: Number(teamId) },
      select: { gallery_images: true },
    });

    if (!team) {
      res.status(404).json({ error: 'Team not found' });
      return;
    }

    res.status(200).json({
      teamId,
      images: team.gallery_images,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch team images' });
  }
};

import { PrismaClient } from "@prisma/client";
import type { Request, Response } from 'express';


const prisma = new PrismaClient();

// Get all announcements
export const getAnnouncements = async (req: Request, res: Response) => {
  try {
    const announcements = await prisma.announcement.findMany({
      orderBy: {
        startTime: 'desc'
      }
    });

    return res.status(200).json({
      success: true,
      data: announcements,
      message: 'Announcements retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching announcements:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch announcements',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get single announcement by ID
export const getAnnouncementById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const announcement = await prisma.announcement.findUnique({
      where: {
        id: Number(id)
      }
    });

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: announcement,
      message: 'Announcement retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching announcement:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch announcement',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Create new announcement
export const createAnnouncement = async (req: Request, res: Response) => {
  try {
    const { title, description, startTime, endTime } = req.body;

    // Validation
    if (!title || !description || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required: title, description, startTime, endTime'
      });
    }

    // Convert to Date objects
    const start = new Date(startTime);
    const end = new Date(endTime);

    // Validate dates
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format'
      });
    }

    if (end <= start) {
      return res.status(400).json({
        success: false,
        message: 'End time must be after start time'
      });
    }

    const announcement = await prisma.announcement.create({
      data: {
        title,
        description,
        startTime: start,
        endTime: end
      }
    });

    return res.status(201).json({
      success: true,
      data: announcement,
      message: 'Announcement created successfully'
    });
  } catch (error) {
    console.error('Error creating announcement:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create announcement',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Update announcement
export const updateAnnouncement = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, startTime, endTime } = req.body;

    // Check if announcement exists
    const existingAnnouncement = await prisma.announcement.findUnique({
      where: {
        id: Number(id)
      }
    });

    if (!existingAnnouncement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    // Prepare update data
    const updateData: any = {};

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    
    if (startTime !== undefined) {
      const start = new Date(startTime);
      if (isNaN(start.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid start time format'
        });
      }
      updateData.startTime = start;
    }

    if (endTime !== undefined) {
      const end = new Date(endTime);
      if (isNaN(end.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid end time format'
        });
      }
      updateData.endTime = end;
    }

    // Validate that end time is after start time
    const finalStartTime = updateData.startTime || existingAnnouncement.startTime;
    const finalEndTime = updateData.endTime || existingAnnouncement.endTime;

    if (finalEndTime <= finalStartTime) {
      return res.status(400).json({
        success: false,
        message: 'End time must be after start time'
      });
    }

    const announcement = await prisma.announcement.update({
      where: {
        id: Number(id)
      },
      data: updateData
    });

    return res.status(200).json({
      success: true,
      data: announcement,
      message: 'Announcement updated successfully'
    });
  } catch (error) {
    console.error('Error updating announcement:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update announcement',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Delete announcement
export const deleteAnnouncement = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if announcement exists
    const existingAnnouncement = await prisma.announcement.findUnique({
      where: {
        id: Number(id)
      }
    });

    if (!existingAnnouncement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    await prisma.announcement.delete({
      where: {
        id: Number(id)
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Announcement deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete announcement',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get active announcements (current time is between start and end)
export const getActiveAnnouncements = async (req: Request, res: Response) => {
  try {
    const now = new Date();

    const announcements = await prisma.announcement.findMany({
      where: {
        AND: [
          {
            startTime: {
              lte: now
            }
          },
          {
            endTime: {
              gte: now
            }
          }
        ]
      },
      orderBy: {
        startTime: 'desc'
      }
    });

    return res.status(200).json({
      success: true,
      data: announcements,
      message: 'Active announcements retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching active announcements:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch active announcements',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

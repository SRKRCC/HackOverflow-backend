import type { Request, Response } from 'express';
import { prisma } from '../../lib/prisma.js';
import { uploadImageToCloudinary } from '../../utils/cloudinary.js';
import { sendRegistrationEmail } from '../../utils/email.js';
import type { TeamRegistrationRequest, RegistrationResponse, ValidationError } from '../../types/registration.js';
import crypto from 'crypto';
import type { PrismaClient } from '@prisma/client';

interface MulterFiles {
  [fieldname: string]: Express.Multer.File[];
}

export const registerTeam = async (req: Request, res: Response): Promise<void> => {
  try {
    const registrationData: TeamRegistrationRequest = JSON.parse(req.body.data || '{}');
    const files = req.files as MulterFiles;

    // Validate input
    const validation = await validateRegistrationData(registrationData);
    if (!validation.isValid) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors
      } as RegistrationResponse);
      return;
    }

    // Use Prisma transaction for data consistency
    const result = await prisma.$transaction(async (tx) => {
      const txClient = tx as unknown as PrismaClient;
      
      // Check for duplicate team name
      const existingTeam = await txClient.team.findFirst({
        where: { title: registrationData.teamName }
      });

      if (existingTeam) {
        throw new Error('Team name already exists');
      }

      // Check for duplicate member emails
      const memberEmails = [
        registrationData.lead.email,
        ...registrationData.members.map(m => m.email)
      ];
      
      const existingMembers = await txClient.member.findMany({
        where: { email: { in: memberEmails } }
      });

      if (existingMembers.length > 0) {
        throw new Error(`Email(s) already registered: ${existingMembers.map((m: any) => m.email).join(', ')}`);
      }

      // Handle problem statement
      let problemStatement;
      if (registrationData.problemStatement.isCustom) {
        // Create custom problem statement
        const customPsId = `CUSTOM_${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
        problemStatement = await txClient.problemStatement.create({
          data: {
            psId: customPsId,
            title: registrationData.problemStatement.title,
            description: registrationData.problemStatement.description,
            category: registrationData.problemStatement.category,
            tags: registrationData.problemStatement.tags,
            isCustom: true
          }
        });
      } else {
        // Use existing problem statement
        if (!registrationData.problemStatement.psId) {
          throw new Error('Problem statement ID is required for non-custom problems');
        }
        
        problemStatement = await txClient.problemStatement.findFirst({
          where: { psId: registrationData.problemStatement.psId }
        });

        if (!problemStatement) {
          throw new Error('Selected problem statement not found');
        }
      }

      // Upload payment screenshot
      let paymentScreenshotUrl = '';
      if (files && files['paymentScreenshot'] && files['paymentScreenshot'][0]) {
        try {
          const uploadResult = await uploadImageToCloudinary(files['paymentScreenshot'][0].buffer, 'payments');
          paymentScreenshotUrl = uploadResult.secure_url;
        } catch (uploadError) {
          console.error('Payment screenshot upload error:', uploadError);
          // Continue without throwing error - payment verification can be done manually
        }
      }
      
      // Generate SCC credentials
      const sccId = await generateSccId(txClient);
      const sccPassword = generateSccPassword();

      // Create team
      const team = await txClient.team.create({
        data: {
          scc_id: sccId,
          scc_password: sccPassword,
          title: registrationData.teamName,
          ps_id: problemStatement.id,
          gallery_images: [], // Initialize empty gallery
          paymentVerified: false // Default to unverified, admin will verify manually
        }
      });

      // Upload member photos and create member records
      const memberPromises = [];

      // Handle team lead photo upload
      let leadPhotoUrl = '';
      if (files && files['leadPhoto'] && files['leadPhoto'][0]) {
        try {
          const uploadResult = await uploadImageToCloudinary(files['leadPhoto'][0].buffer, 'member-photos');
          leadPhotoUrl = uploadResult.secure_url;
        } catch (uploadError) {
          console.error('Lead photo upload error:', uploadError);
          // Continue without throwing error - photo upload is optional
        }
      }      memberPromises.push(
        txClient.member.create({
          data: {
            name: registrationData.lead.name,
            email: registrationData.lead.email,
            phone_number: registrationData.lead.phone,
            college_name: registrationData.lead.collegeName,
            department: registrationData.lead.department,
            year_of_study: registrationData.lead.yearOfStudy,
            location: registrationData.lead.location,
            tShirtSize: registrationData.lead.tShirtSize,
            profile_image: leadPhotoUrl,
            teamId: team.id,
            attendance: 0
          }
        })
      );

      // Handle team members
      for (let i = 0; i < registrationData.members.length; i++) {
        const member = registrationData.members[i];
        if (!member) continue; // Skip if member is undefined
        
        let memberPhotoUrl = '';
        // Handle member photo upload
        const memberPhotoKey = `memberPhoto_${i}`;
        if (files && files[memberPhotoKey] && files[memberPhotoKey][0]) {
          try {
            const memberPhotoFile = files[memberPhotoKey][0];
            const uploadResult = await uploadImageToCloudinary(memberPhotoFile.buffer, 'member-photos');
            memberPhotoUrl = uploadResult.secure_url;
          } catch (uploadError) {
            console.error(`Member ${i} photo upload error:`, uploadError);
            // Continue without throwing error - photo upload is optional
          }
        }

        memberPromises.push(
          txClient.member.create({
            data: {
              name: member.name,
              email: member.email,
              phone_number: member.phone,
              college_name: member.collegeName,
              department: member.department,
              year_of_study: member.yearOfStudy,
              location: member.location,
              tShirtSize: member.tShirtSize,
              profile_image: memberPhotoUrl,
              teamId: team.id,
              attendance: 0
            }
          })
        );
      }

      await Promise.all(memberPromises);

      return {
        teamId: team.id,
        sccId: sccId,
        sccPassword: sccPassword,
        team: team,
        problemStatement: problemStatement,
        allMembers: [registrationData.lead, ...registrationData.members]
      };
    });


    void sendRegistrationEmail(
      {
        id: result.teamId,
        title: registrationData.teamName,
        scc_id: result.sccId,
        scc_password: result.sccPassword
      },
      [
        {
          name: registrationData.lead.name,
          email: registrationData.lead.email,
          phone_number: registrationData.lead.phone
        },
        ...registrationData.members.map(member => ({
          name: member.name,
          email: member.email,
          phone_number: member.phone
        }))
      ],
      result.problemStatement
    ).catch((emailError) => {
      console.error('Failed to send registration email:', emailError);
    });

    res.status(201).json({
      success: true,
      teamId: result.teamId,
      sccId: result.sccId,
      message: `Team "${registrationData.teamName}" registered successfully! Your SCC ID is ${result.sccId}. Please save your credentials safely.`
    } as RegistrationResponse);

  } catch (error: any) {
    console.error('Registration error:', error);
    
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error during registration'
    } as RegistrationResponse);
  }
};

const validateRegistrationData = async (
  data: TeamRegistrationRequest
): Promise<{ isValid: boolean; errors: ValidationError[] }> => {
  const errors: ValidationError[] = [];

  // Validate team name
  if (!data.teamName || data.teamName.trim().length < 3) {
    errors.push({ field: 'teamName', message: 'Team name must be at least 3 characters long' });
  }

  // Validate lead data
  if (!data.lead) {
    errors.push({ field: 'lead', message: 'Team lead information is required' });
  } else {
    validateMemberData(data.lead, 'lead', errors);
  }

  // Validate members data
  if (!data.members || data.members.length === 0) {
    errors.push({ field: 'members', message: 'At least 3 team members are required (including lead)' });
  } else {
    data.members.forEach((member, index) => {
      validateMemberData(member, `members[${index}]`, errors);
    });
  }

  // Validate team size (lead + members should be 4-6)
  const totalMembers = 1 + (data.members?.length || 0);
  if (totalMembers < 4 || totalMembers > 6) {
    errors.push({ field: 'team', message: 'Team must have 4-6 members including the lead' });
  }

  // Validate problem statement
  if (!data.problemStatement) {
    errors.push({ field: 'problemStatement', message: 'Problem statement is required' });
  } else if (data.problemStatement.isCustom) {
    if (!data.problemStatement.title || !data.problemStatement.description) {
      errors.push({ field: 'problemStatement', message: 'Custom problem statement must have title and description' });
    }
  } else if (!data.problemStatement.psId) {
    errors.push({ field: 'problemStatement', message: 'Problem statement ID is required for non-custom problems' });
  }

  // Validate payment data
  if (!data.payment) {
    errors.push({ field: 'payment', message: 'Payment information is required' });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

const validateMemberData = (member: any, prefix: string, errors: ValidationError[]): void => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  // More flexible phone regex to accept various formats
  const phoneRegex = /^(\+91[-\s]?)?[6-9]\d{9}$/;

  if (!member.name || member.name.trim().length < 2) {
    errors.push({ field: `${prefix}.name`, message: 'Name must be at least 2 characters long' });
  }

  if (!member.email || !emailRegex.test(member.email)) {
    errors.push({ field: `${prefix}.email`, message: 'Valid email address is required' });
  }

  if (!member.phone || !phoneRegex.test(member.phone)) {
    errors.push({ field: `${prefix}.phone`, message: 'Valid phone number is required (10 digits starting with 6-9, optionally with +91)' });
  }

  if (!member.collegeName || member.collegeName.trim().length < 3) {
    errors.push({ field: `${prefix}.collegeName`, message: 'College name is required' });
  }

  if (!member.department) {
    errors.push({ field: `${prefix}.department`, message: 'Department is required' });
  }

  if (!member.yearOfStudy || member.yearOfStudy < 1 || member.yearOfStudy > 4) {
    errors.push({ field: `${prefix}.yearOfStudy`, message: 'Year of study must be between 1-4' });
  }

  if (!member.location) {
    errors.push({ field: `${prefix}.location`, message: 'Location is required' });
  }

  if (!member.tShirtSize || !['XS', 'S', 'M', 'L', 'XL', 'XXL'].includes(member.tShirtSize)) {
    errors.push({ field: `${prefix}.tShirtSize`, message: 'Valid T-shirt size is required (XS, S, M, L, XL, XXL)' });
  }
};

const generateSccId = async (tx: any): Promise<string> => {
  const prefix = 'SCC';
  const txClient = tx as unknown as PrismaClient;
  
  // Get the last team's SCC ID to generate incremental ID
  const lastTeam = await txClient.team.findFirst({
    where: {
      scc_id: {
        startsWith: prefix
      }
    },
    orderBy: {
      id: 'desc'
    },
    select: {
      scc_id: true
    }
  });

  let nextNumber = 1;
  if (lastTeam && lastTeam.scc_id) {
    // Extract the number from the last SCC ID (e.g., "SCC001" -> 1)
    const lastNumber = parseInt(lastTeam.scc_id.replace(prefix, ''));
    if (!isNaN(lastNumber)) {
      nextNumber = lastNumber + 1;
    }
  }

  // Pad with zeros to make it 3 digits (SCC001, SCC002, etc.)
  const paddedNumber = nextNumber.toString().padStart(3, '0');
  return `${prefix}${paddedNumber}`;
};

const generateSccPassword = (): string => {
  return crypto.randomBytes(8).toString('hex').toUpperCase();
};
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

    const validation = await validateRegistrationData(registrationData);
    if (!validation.isValid) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors
      } as RegistrationResponse);
      return;
    }

    const result = await prisma.$transaction(async (tx) => {
      const txClient = tx as unknown as PrismaClient;
      
      const existingTeam = await txClient.team.findFirst({
        where: { title: registrationData.teamName }
      });

      if (existingTeam) {
        throw new Error('Team name already exists');
      }

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

      let problemStatement;
      if (registrationData.problemStatement.isCustom) {
        // Count existing custom problem statements to generate sequential ID
        const customPsCount = await txClient.problemStatement.count({
          where: { isCustom: true }
        });
        const nextIndex = customPsCount + 1;
        const customPsId = `CUS_${nextIndex.toString().padStart(2, '0')}`;
        
        problemStatement = await txClient.problemStatement.create({
          data: {
            psId: customPsId,
            title: registrationData.problemStatement.title || 'Custom Problem Statement',
            description: registrationData.problemStatement.description || 'No description provided',
            category: registrationData.problemStatement.category || 'General',
            tags: registrationData.problemStatement.tags || [],
            isCustom: true
          }
        });
      } else {
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

      let paymentScreenshotUrl = '';
      if (files && files['paymentScreenshot'] && files['paymentScreenshot'][0]) {
        try {
          const uploadResult = await uploadImageToCloudinary(files['paymentScreenshot'][0].buffer, 'payments');
          paymentScreenshotUrl = uploadResult.secure_url;
        } catch (uploadError) {
          console.error('Payment screenshot upload error:', uploadError);
        }
      }
      
      const sccId = await generateSccId(txClient);
      const sccPassword = generateSccPassword();

      const team = await txClient.team.create({
        data: {
          scc_id: sccId,
          scc_password: sccPassword,
          title: registrationData.teamName,
          ps_id: problemStatement.id,
          gallery_images: [],
          paymentVerified: false
        }
      });

      const memberPromises = [];

      let leadPhotoUrl = '';
      if (files && files['leadPhoto'] && files['leadPhoto'][0]) {
        try {
          const uploadResult = await uploadImageToCloudinary(files['leadPhoto'][0].buffer, 'member-photos');
          leadPhotoUrl = uploadResult.secure_url;
        } catch (uploadError) {
          console.error('Lead photo upload error:', uploadError);
        }
      }      memberPromises.push(
        txClient.member.create({
          data: {
            name: registrationData.lead.name,
            email: registrationData.lead.email,
            phone_number: registrationData.lead.phone || '',
            college_name: registrationData.lead.collegeName || 'Not Specified',
            department: registrationData.lead.department || null,
            year_of_study: registrationData.lead.yearOfStudy || null,
            location: registrationData.lead.location || null,
            tShirtSize: registrationData.lead.tShirtSize || null,
            profile_image: leadPhotoUrl || null,
            teamId: team.id,
            attendance: 0
          }
        })
      );

      for (let i = 0; i < registrationData.members.length; i++) {
        const member = registrationData.members[i];
        if (!member) continue; // Skip if member is undefined
        
        let memberPhotoUrl = '';
        const memberPhotoKey = `memberPhoto_${i}`;
        if (files && files[memberPhotoKey] && files[memberPhotoKey][0]) {
          try {
            const memberPhotoFile = files[memberPhotoKey][0];
            const uploadResult = await uploadImageToCloudinary(memberPhotoFile.buffer, 'member-photos');
            memberPhotoUrl = uploadResult.secure_url;
          } catch (uploadError) {
            console.error(`Member ${i} photo upload error:`, uploadError);
          }
        }

        memberPromises.push(
          txClient.member.create({
            data: {
              name: member.name,
              email: member.email,
              phone_number: member.phone || '',
              college_name: member.collegeName || 'Not Specified',
              department: member.department || null,
              year_of_study: member.yearOfStudy || null,
              location: member.location || null,
              tShirtSize: member.tShirtSize || null,
              profile_image: memberPhotoUrl || null,
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

  // Only validate critical fields that are absolutely required
  if (!data.teamName || data.teamName.trim().length < 2) {
    errors.push({ field: 'teamName', message: 'Team name is required (minimum 2 characters)' });
  }

  if (!data.lead || !data.lead.name || !data.lead.email) {
    errors.push({ field: 'lead', message: 'Team lead name and email are required' });
  } else {
    validateMemberData(data.lead, 'lead', errors);
  }

  // Validate members if present
  if (data.members && Array.isArray(data.members)) {
    data.members.forEach((member, index) => {
      if (member && (member.name || member.email)) {
        validateMemberData(member, `members[${index}]`, errors);
      }
    });
  }

  // Check team size but don't be too strict
  const totalMembers = 1 + (data.members?.length || 0);
  if (totalMembers < 3) {
    errors.push({ field: 'team', message: 'Team must have at least 3 members including the lead' });
  }

  // Problem statement validation
  if (!data.problemStatement) {
    errors.push({ field: 'problemStatement', message: 'Problem statement is required' });
  } else if (data.problemStatement.isCustom) {
    if (!data.problemStatement.title || data.problemStatement.title.trim().length < 5) {
      errors.push({ field: 'problemStatement', message: 'Custom problem statement must have a title (minimum 5 characters)' });
    }
    if (!data.problemStatement.description || data.problemStatement.description.trim().length < 10) {
      errors.push({ field: 'problemStatement', message: 'Custom problem statement must have a description (minimum 10 characters)' });
    }
  } else if (!data.problemStatement.psId) {
    errors.push({ field: 'problemStatement', message: 'Problem statement ID is required for non-custom problems' });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

const validateMemberData = (member: any, prefix: string, errors: ValidationError[]): void => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^[\d\s+()-]{10,15}$/; // More flexible phone validation

  // Only validate absolutely required fields
  if (!member.name || member.name.trim().length < 2) {
    errors.push({ field: `${prefix}.name`, message: 'Name must be at least 2 characters long' });
  }

  if (!member.email || !emailRegex.test(member.email)) {
    errors.push({ field: `${prefix}.email`, message: 'Valid email address is required' });
  }

  if (!member.phone || !phoneRegex.test(member.phone.toString())) {
    errors.push({ field: `${prefix}.phone`, message: 'Valid phone number is required (10-15 digits)' });
  }

  if (!member.collegeName || member.collegeName.trim().length < 2) {
    errors.push({ field: `${prefix}.collegeName`, message: 'College name is required' });
  }

  // Make these fields optional or more lenient
  // Department, year of study, location, and t-shirt size are not critical for registration
};

const generateSccId = async (tx: any): Promise<string> => {
  const prefix = 'SCC';
  const txClient = tx as unknown as PrismaClient;
  
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
    const lastNumber = parseInt(lastTeam.scc_id.replace(prefix, ''));
    if (!isNaN(lastNumber)) {
      nextNumber = lastNumber + 1;
    }
  }

  const paddedNumber = nextNumber.toString().padStart(3, '0');
  return `${prefix}${paddedNumber}`;
};

const generateSccPassword = (): string => {
  return crypto.randomBytes(8).toString('hex').toUpperCase();
};
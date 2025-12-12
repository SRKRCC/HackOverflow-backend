import type { Request, Response } from 'express';
import { prisma } from '../../lib/prisma.js';
import { sendRegistrationEmail } from '../../utils/email.js';
import type { TeamRegistrationRequest, RegistrationResponse, ValidationError } from '../../types/registration.js';
import crypto from 'crypto';
import type { PrismaClient } from '@prisma/client';
import { logEmailEvent, createAuditContext } from '../../utils/auditHelpers.js';
import { auditService } from '../../services/auditService.js';

export const registerTeam = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('\n========== REGISTRATION REQUEST STARTED ==========');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    const context = createAuditContext(req);
    
    await auditService.logRegistration(
      'REGISTER_ATTEMPT',
      'TEAM_REGISTRATION',
      context,
      req.path,
      200,
      { team_name: req.body.teamName, member_count: req.body.members?.length }
    );
    
    const registrationData: TeamRegistrationRequest = req.body as TeamRegistrationRequest;

    if (!registrationData.members || !Array.isArray(registrationData.members) || registrationData.members.length === 0) {
      console.log('No members array provided.');
      res.status(400).json({
        success: false,
        message: 'Members array is required with at least the lead as the first member'
      } as RegistrationResponse);
      return;
    }

    const lead = registrationData.members[0];
    const otherMembers = registrationData.members.slice(1);

    if (!lead || lead.email === undefined || lead.email === '') {
      console.log('No lead member data provided.');
      res.status(400).json({
        success: false,
        message: 'Lead member data is required'
      } as RegistrationResponse);
      return;
    }
    
    console.log('Team Name:', registrationData.teamName);
    console.log('Lead Email:', lead.email);
    console.log('Other Members Count:', otherMembers.length);

    console.log('\n--- Starting Validation ---');
    const validation = await validateRegistrationData(registrationData);
    if (!validation.isValid) {
      console.log('Validation Failed:', validation.errors);
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors
      } as RegistrationResponse);
      return;
    }
    console.log('Validation Passed');

    console.log('\n--- Starting Database Transaction ---');
    const result = await prisma.$transaction(async (tx) => {
      const txClient = tx as unknown as PrismaClient;
      
      const existingTeam = await txClient.team.findFirst({
        where: { title: registrationData.teamName }
      });

      if (existingTeam) {
        throw new Error('Team name already exists');
      }

      const memberEmails = registrationData.members.map(m => m.email);
      
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
      
      memberPromises.push(
        txClient.member.create({
          data: {
            name: lead.name,
            email: lead.email,
            phone_number: lead.phone || '',
            college_name: lead.collegeName || 'Not Specified',
            department: lead.department || null,
            year_of_study: lead.yearOfStudy || null,
            location: lead.location || null,
            tShirtSize: lead.tShirtSize || null,
            profile_image: null,
            teamId: team.id,
            attendance: 0
          }
        })
      );

      for (let i = 0; i < otherMembers.length; i++) {
        const member = otherMembers[i];
        if (!member) continue;

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
              profile_image: null,
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
        allMembers: registrationData.members
      };
    });

    console.log('\n--- Transaction Completed Successfully ---');
    console.log('Team ID:', result.teamId);
    console.log('SCC ID:', result.sccId);
    console.log('Problem Statement:', result.problemStatement.psId);

    console.log('\n--- Preparing Email Data ---');
    const leadEmail = lead.email;
    const membersData = registrationData.members.map(member => ({
      name: member.name,
      email: member.email,
      phone_number: member.phone
    }));
    
    console.log('Lead Email:', leadEmail);
    console.log('Total Members:', membersData.length);

    console.log('\n--- Attempting to Send Email ---');
    sendRegistrationEmail(
      {
        title: registrationData.teamName,
        scc_id: result.sccId,
        scc_password: result.sccPassword
      },
      membersData,
      result.problemStatement,
      leadEmail
    ).then(async (emailSent) => {
      await logEmailEvent(
        emailSent,
        leadEmail,
        `Registration Confirmation - Team ${registrationData.teamName}`,
        context,
        { team_id: result.teamId, scc_id: result.sccId }
      );
      
      if (emailSent) {
        console.log(`Registration email sent successfully to ${leadEmail}`);
      } else {
        console.error(`Failed to send registration email to ${leadEmail}`);
      }
    }).catch(async (emailError) => {
      console.error('Email sending error:', emailError);
      await logEmailEvent(
        false,
        leadEmail,
        `Registration Confirmation - Team ${registrationData.teamName}`,
        context,
        { team_id: result.teamId, error: emailError.message }
      );
    });

    console.log('\n--- Sending Success Response to Client ---');
    
    await auditService.logRegistration(
      'REGISTER_SUCCESS',
      'TEAM_REGISTRATION',
      { ...context, team_id: result.teamId.toString() },
      req.path,
      201,
      {
        team_name: registrationData.teamName,
        team_id: result.teamId,
        scc_id: result.sccId,
        member_count: registrationData.members.length,
        problem_statement: result.problemStatement.psId
      }
    );
    
    res.status(201).json({
      success: true,
      teamId: result.teamId,
      sccId: result.sccId,
      message: `Team "${registrationData.teamName}" registered successfully! Your SCC ID is ${result.sccId}. Please save your credentials safely.`
    } as RegistrationResponse);
    
    console.log('========== REGISTRATION REQUEST COMPLETED ==========\n');

  } catch (error: any) {
    console.error('\n========== REGISTRATION ERROR ==========');
    console.error('Error occurred at:', new Date().toISOString());
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('=========================================\n');
    
    const context = createAuditContext(req);
    await auditService.logRegistration(
      'REGISTER_FAILED',
      'TEAM_REGISTRATION',
      context,
      req.path,
      500,
      { 
        error_message: error.message,
        team_name: req.body?.teamName,
        member_count: req.body?.members?.length
      }
    );
    
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

  // Validate members (first member is lead)
  if (!data.members || data.members.length === 0) {
    errors.push({ field: 'members', message: 'At least one member (lead) is required' });
  } else {
    data.members.forEach((member, index) => {
      const label = index === 0 ? 'lead' : `members[${index}]`;
      validateMemberData(member, label, errors);
    });
  }

  // Check team size - members array includes lead
  const totalMembers = data.members?.length || 0;
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
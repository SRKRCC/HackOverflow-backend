import { Resend } from 'resend';
import dotenv from 'dotenv';
import { 
  generateRegistrationEmailHTML,
  type TeamData,
  type MemberData,
  type ProblemStatementData
} from './emailTemplates.js';
import { auditService } from '../services/auditService.js';

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendRegistrationEmail = async (
  team: TeamData,
  members: MemberData[],
  problemStatement: ProblemStatementData,
  leadEmail?: string
): Promise<boolean> => {
  console.log('\n[EMAIL] Starting email send process...');
  console.log('[EMAIL] Environment check:', {
    hasResendKey: !!process.env.RESEND_API_KEY
  });
  
  try {
    const recipientEmail = leadEmail || members[0]?.email;
    
    console.log('[EMAIL] Recipient email:', recipientEmail);
    
    if (!recipientEmail) {
      console.error('[EMAIL] No recipient email found');
      return false;
    }

    if (!process.env.RESEND_API_KEY) {
      console.error('[EMAIL] RESEND_API_KEY not configured in environment variables');
      return false;
    }

    console.log('[EMAIL] Generating HTML template...');
    const htmlContent = generateRegistrationEmailHTML(team, members, problemStatement, recipientEmail);
    console.log('[EMAIL] HTML template generated successfully, length:', htmlContent.length);

    const subject = `Registration Successful - Team ${team.title} | HackOverflow 2025`;

    console.log('[EMAIL] Sending email via Resend...');
    const { data, error } = await resend.emails.send({
      from: 'HackOverflow Team <notifications@info.srkrcodingclub.in>',
      to: recipientEmail,
      cc: 'srkrcodingclubofficial@gmail.com',
      subject: subject,
      html: htmlContent,
    });

    if (error) {
      console.error('[EMAIL] Resend error:', error);
      
      await auditService.logEmail(
        'SEND_EMAIL',
        false,
        { team_id: team.scc_id || "" },
        recipientEmail,
        subject,
        {
          team_name: team.title,
          problem_statement: problemStatement.psId,
          error: error.message
        }
      );
      
      return false;
    }

    console.log('[EMAIL] Email sent successfully!');
    console.log('[EMAIL] Message ID:', data?.id);
    
    await auditService.logEmail(
      'SEND_EMAIL',
      true,
      { team_id: team.scc_id || "" },
      recipientEmail,
      subject,
      {
        team_name: team.title,
        problem_statement: problemStatement.psId,
        message_id: data?.id
      }
    );
    
    return true;
  } catch (error: any) {
    console.error('[EMAIL] Failed to send email');
    console.error('[EMAIL] Error type:', error.constructor.name);
    console.error('[EMAIL] Error message:', error.message);
    console.error('[EMAIL] Error stack:', error.stack);
    return false;
  }
};

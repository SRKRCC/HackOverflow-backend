import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const WHATSAPP_GROUP_URL = 'https://chat.whatsapp.com/GUg1kFD0let90x7LCA3amy';

interface TeamData {
  title: string;
  scc_id?: string | null;
  scc_password?: string | null;
}

interface MemberData {
  name: string;
  email: string;
  phone_number?: string;
}

interface ProblemStatementData {
  psId: string;
  title: string;
  description: string;
  category: string;
  isCustom?: boolean;
}

const createTransporter = () => {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: parseInt('587'),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

const generateHTMLTemplate = (
  team: TeamData,
  members: MemberData[],
  problemStatement: ProblemStatementData,
  leadEmail: string
): string => {
  const membersList = members
    .map(
      (member, index) =>
        `<tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${index + 1}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${member.name}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${member.email}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${member.phone_number || 'Not provided'}</td>
        </tr>`
    )
    .join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>HackOverflow - Registration Successful</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px; margin-bottom: 20px;">
        <h1 style="color: white; margin: 0; text-align: center;">🎉 Registration Successful!</h1>
        <p style="color: white; text-align: center; margin: 10px 0 0 0;">Welcome to HackOverflow 2025</p>
      </div>

      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h2 style="margin-top: 0; color: #495057;">Team Details</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; font-weight: bold;">Team Name:</td>
            <td style="padding: 8px 0;">${team.title}</td>
          </tr>
          ${team.scc_id ? `
          <tr>
            <td style="padding: 8px 0; font-weight: bold;">SCC ID:</td>
            <td style="padding: 8px 0;">${team.scc_id}</td>
          </tr>
          ` : ''}
          <tr>
            <td style="padding: 8px 0; font-weight: bold;">Problem Statement:</td>
            <td style="padding: 8px 0;">
              <strong>${problemStatement.psId}</strong> - ${problemStatement.title}
              ${problemStatement.isCustom ? '<br><em>(Custom Problem Statement)</em>' : ''}
            </td>
          </tr>
        </table>
      </div>

      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h2 style="margin-top: 0; color: #495057;">Team Members</h2>
        <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 4px; overflow: hidden;">
          <thead>
            <tr style="background: #6c757d; color: white;">
              <th style="padding: 12px 8px; text-align: left;">#</th>
              <th style="padding: 12px 8px; text-align: left;">Name</th>
              <th style="padding: 12px 8px; text-align: left;">Email</th>
              <th style="padding: 12px 8px; text-align: left;">Phone</th>
            </tr>
          </thead>
          <tbody>
            ${membersList}
          </tbody>
        </table>
      </div>

      <div style="background: #e7f3ff; padding: 20px; border-radius: 8px; border-left: 4px solid #0066cc;">
        <h3 style="margin-top: 0; color: #0066cc;">Next Steps</h3>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li>Keep this email for your records</li>
          <li>Join our WhatsApp group for quick updates: <a href="${WHATSAPP_GROUP_URL}" style="color: #667eea;">Join WhatsApp Group</a></li>
          <li>Check our website for event schedule and rules</li>
          <li>Prepare for the hackathon - it's going to be amazing! 🚀</li>
          <li style="color:#C62828; font-weight:bold; margin-top:8px;">If you face any payment issues, call <a href="tel:9032149776" style="color: #667eea;">9032149776</a> or visit the registration page and use the payment help option.</li>
          <li style="color:#C62828; font-weight:bold;">If money is debited, please do not attempt payment again, contact the organizers for assistance.</li>
          <li style="color:#28a745; font-weight:bold; background-color: #d4edda; padding: 10px; border-radius: 4px; margin-top: 8px;">If payment is done, kindly share your receipts to either <a href="https://wa.me/919966542463" style="color: #667eea;">9966542463</a> or <a href="https://wa.me/919032149776" style="color: #667eea;">9032149776</a> on WhatsApp with your team name and size (count of members and count of affiliates).</li>
        </ul>
      </div>

      <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
        <p style="color: #6c757d; margin: 0;">
          Need help? Contact us at <a href="mailto:srkrcodingclubofficial@gmail.com" style="color: #667eea;">srkrcodingclubofficial@gmail.com</a>
        </p>
        <p style="color: #6c757d; margin: 10px 0 0 0; font-size: 14px;">
          HackOverflow 2025 - Organized by SRKR Coding Club
        </p>
      </div>
    </body>
    </html>
  `;
};

const generateTextTemplate = (
  team: TeamData,
  members: MemberData[],
  problemStatement: ProblemStatementData,
  leadEmail: string
): string => {
  const membersList = members
    .map((member, index) => `  ${index + 1}. ${member.name} (${member.email}) - ${member.phone_number || 'No phone'}`)
    .join('\n');

  return `
🎉 HACKOVERFLOW 2025 - REGISTRATION SUCCESSFUL! 🎉

Congratulations! Your team has been successfully registered for HackOverflow 2025.

TEAM DETAILS:
=============
Team Name: ${team.title}
${team.scc_id ? `SCC ID: ${team.scc_id}\n` : ''}
Problem Statement: ${problemStatement.psId} - ${problemStatement.title}
${problemStatement.isCustom ? '(Custom Problem Statement)\n' : ''}

TEAM MEMBERS:
=============
${membersList}

NEXT STEPS:
===========
• Keep this email for your records
• Passwords will be sent separately again
• Join our WhatsApp group for updates and announcements: ${WHATSAPP_GROUP_URL}  
• Check our website for event schedule and rules
• Prepare for the hackathon - it's going to be amazing! 🚀
• If you face any payment issues, call 9032149776 or go to the registration page and use the payment help option.
• If money is debited, please do not attempt payment again, contact the organizers for assistance.
• If payment is done, kindly share your receipts to either 9966542463 or 9032149776 on WhatsApp with your team name and size (count of members and count of affiliates).



Need help? Contact us at srkrcodingclubofficial@gmail.com

${WHATSAPP_GROUP_URL}
---
HackOverflow 2025 - Organized by SRKR Coding Club
  `.trim();
};

export const sendRegistrationEmail = async (
  team: TeamData,
  members: MemberData[],
  problemStatement: ProblemStatementData,
  leadEmail?: string
): Promise<boolean> => {
  try {
    const recipientEmail = leadEmail || members[0]?.email;
    
    if (!recipientEmail) {
      console.error('No recipient email available for team:', team.title);
      return false;
    }

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error('Email credentials not configured in environment variables');
      return false;
    }

    const transporter = createTransporter();
    const fromEmail = "srkrcodingclubofficial@gmail.com"

    const htmlContent = generateHTMLTemplate(team, members, problemStatement, recipientEmail);
    const textContent = generateTextTemplate(team, members, problemStatement, recipientEmail);

    const mailOptions = {
      from: `"HackOverflow 2025" <${fromEmail}>`,
      to: recipientEmail,
      subject: `🎉 Registration Successful - Team ${team.title} | HackOverflow 2025`,
      text: textContent,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Registration email sent successfully:', info.messageId);
    console.log('Email sent to:', recipientEmail, 'for team:', team.title);
    
    return true;
  } catch (error) {
    console.error('Failed to send registration email:', error);
    return false;
  }
};

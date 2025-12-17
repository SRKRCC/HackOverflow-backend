import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendTeamCredentials = async (
  leadEmail: string,
  sccId: string,
  teamName: string,
  password: string
): Promise<void> => {
  const subject = `HackOverflow 2K25 - SCC Credentials for ${teamName}`;
  const html = `
  <!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <style>
        body { background:#f6f9fc; font-family: Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial; margin:0; color:#0f172a; }
        .container { max-width:600px; margin:32px auto; background:#ffffff; border-radius:8px; overflow:hidden; box-shadow:0 6px 18px rgba(12,14,20,0.08); }
        .header { background:linear-gradient(90deg,#0ea5a4,#7c3aed); color:#fff; padding:20px; text-align:center; }
        .logo { display:flex; align-items:center; justify-content:center; gap:12px; }
        .brand-img { width:40px; height:auto; display:block; }
        .brand-name { font-weight:700; font-size:18px; }
        .content { padding:24px; }
        .credentials { background:#f3f4f6; padding:12px; border-radius:6px; margin:16px 0; font-family:monospace; }
        .btn { display:inline-block; background:#7c3aed; color:#fff; padding:10px 16px; border-radius:6px; text-decoration:none; }
        .muted { color:#6b7280; font-size:13px; }
        .footer { padding:16px; font-size:12px; color:#9ca3af; text-align:center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">
            <img class="brand-img" src="https://srkrcodingclub.in/logonobg.png" alt="SRKR Coding Club" />
            <div class="brand-name">HackOverflow 2K25</div>
          </div>
        </div>
        <div class="content">
          <p>Hi ${teamName}, this is SRKR Coding Club team</p>
          <p>Your team's credentials are:</p>
          <div class="credentials">
            <div><strong>SCC ID:</strong> ${sccId}</div>
            <div style="margin-top:8px"><strong>Password:</strong> <code>${password}</code></div>
          </div>

          <p><a class="btn" href="https://hackoverflow.srkrcodingclub.in/login">Login to HackOverflow 2K25</a></p>

          <p class="muted"><strong>Note:</strong> After logging in, visit the <em>General</em> section and fill in the details for your certificates. These details will be used for certification and can only be submitted once, you will not be able to edit them after submission.</p>

          <p>Please keep this password secure.</p>
        </div>
      </div>
    </body>
  </html>
  `;

  await resend.emails.send({
    from: "HackOverflow Team <notifications@info.srkrcodingclub.in>",
    to: leadEmail,
    subject,
    html,
  });
};

export default sendTeamCredentials;
import { getBaseLayout } from "./auth";

interface InvitationEmailProps {
	inviterName: string;
	orgName: string;
	link: string;
}

export const getInvitationEmailTemplate = ({
	inviterName,
	orgName,
	link,
}: InvitationEmailProps) =>
	getBaseLayout(`
  <h1 style="margin-top: 0; font-size: 24px; font-weight: 600;">You've been invited!</h1>
  <p><strong>${inviterName}</strong> has invited you to join <strong>${orgName}</strong>.</p>
  <div style="text-align: center; margin: 32px 0;">
    <a href="${link}" class="button" style="background-color: #000; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500; display: inline-block;">Accept Invitation</a>
  </div>
  <p style="margin-top: 24px; font-size: 14px; color: #6b7280;">Or copy and paste this link into your browser:</p>
  <p style="font-size: 14px; color: #6b7280; word-break: break-all;">${link}</p>
`);

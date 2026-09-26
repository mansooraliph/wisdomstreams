import { baseEmailTemplate, emailButton } from "./base.template";

export function verifyEmailTemplate(link: string): { subject: string; html: string } {
  return {
    subject: "Verify your WisdomStream email",
    html: baseEmailTemplate({
      heading: "Verify your email",
      bodyHtml: `
        <p>Thanks for signing up. Confirm your email address to finish setting up your account.</p>
        ${emailButton(link, "Verify email")}
        <p style="margin-top:16px;color:#71717a;">This link expires in 24 hours. If you didn't create a WisdomStream account, you can ignore this email.</p>
      `,
    }),
  };
}

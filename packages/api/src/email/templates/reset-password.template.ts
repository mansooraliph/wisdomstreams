import { baseEmailTemplate, emailButton } from "./base.template";

export function resetPasswordTemplate(link: string): { subject: string; html: string } {
  return {
    subject: "Reset your WisdomStream password",
    html: baseEmailTemplate({
      heading: "Reset your password",
      bodyHtml: `
        <p>We received a request to reset your password. Click below to choose a new one.</p>
        ${emailButton(link, "Reset password")}
        <p style="margin-top:16px;color:#71717a;">This link expires in 1 hour. If you didn't request this, you can ignore this email — your password won't change.</p>
      `,
    }),
  };
}

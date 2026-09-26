import { Injectable, Logger } from "@nestjs/common";
import { Resend } from "resend";
import { verifyEmailTemplate } from "./templates/verify-email.template";
import { resetPasswordTemplate } from "./templates/reset-password.template";

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend | null;
  private readonly from: string;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    this.resend = apiKey ? new Resend(apiKey) : null;
    this.from = process.env.EMAIL_FROM ?? "WisdomStream <onboarding@resend.dev>";
  }

  async sendVerificationEmail(to: string, link: string): Promise<void> {
    const { subject, html } = verifyEmailTemplate(link);
    await this.send(to, subject, html, `[email] Verify ${to}: ${link}`);
  }

  async sendPasswordResetEmail(to: string, link: string): Promise<void> {
    const { subject, html } = resetPasswordTemplate(link);
    await this.send(to, subject, html, `[email] Reset password for ${to}: ${link}`);
  }

  private async send(to: string, subject: string, html: string, devFallbackLog: string): Promise<void> {
    if (!this.resend) {
      // No RESEND_API_KEY configured — log instead of sending so the auth
      // flows stay exercisable in local dev without a Resend account.
      this.logger.log(`${devFallbackLog} (RESEND_API_KEY not set — email not actually sent)`);
      return;
    }

    const { error } = await this.resend.emails.send({ from: this.from, to, subject, html });
    if (error) {
      this.logger.error(`Failed to send email to ${to}: ${error.message}`);
    }
  }
}

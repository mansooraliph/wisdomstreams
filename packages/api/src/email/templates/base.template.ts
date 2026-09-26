/**
 * Minimal, email-client-safe HTML shell. Hand-written instead of using the
 * @react-email/* packages: as of writing, every package in that npm scope
 * (components, render, html, body, button, text, ...) is flagged by npm as
 * "no longer supported" — an administrative deprecation, not a normal
 * maintainer notice — so we don't build on it.
 */
export function baseEmailTemplate(opts: { heading: string; bodyHtml: string }): string {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:32px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;padding:32px;">
            <tr>
              <td style="font-size:20px;font-weight:bold;color:#0f0f0f;padding-bottom:16px;">
                WisdomStream
              </td>
            </tr>
            <tr>
              <td style="font-size:16px;font-weight:600;color:#0f0f0f;padding-bottom:12px;">
                ${opts.heading}
              </td>
            </tr>
            <tr>
              <td style="font-size:14px;line-height:22px;color:#3f3f46;">
                ${opts.bodyHtml}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function emailButton(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;margin-top:16px;padding:10px 20px;background-color:#2563eb;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;border-radius:6px;">${label}</a>`;
}

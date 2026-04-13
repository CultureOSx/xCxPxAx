/**
 * Transactional email HTML — CulturePass look & feel.
 * Light, typography-first layout (Apple-style clarity + brand energy).
 * Uses inline styles + tables for client compatibility; system font stack (no webfonts).
 */

type EmailTemplate = {
  subject: string;
  html: string;
  text: string;
};

type BaseEmailOptions = {
  title: string;
  intro: string;
  body: string[];
  ctaLabel?: string;
  ctaUrl?: string;
  footerNote?: string;
};

/** Mirrors app CultureTokens / marketingSurfaces — keep in sync with client theme */
const CP = {
  indigo: '#0066CC',
  coral: '#FF5E5B',
  gold: '#FFC857',
  purple: '#AF52DE',
  pageBg: '#F5F5F7',
  card: '#FFFFFF',
  border: '#D2D2D7',
  borderLight: '#E8E8ED',
  text: '#111111',
  textMuted: '#6B6B6B',
  textFine: '#86868B',
  onPrimary: '#FFFFFF',
} as const;

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderBaseEmail(options: BaseEmailOptions): string {
  const bodyHtml = options.body
    .map(
      (line) =>
        `<p style="margin:0 0 16px 0;color:${CP.textMuted};font-size:16px;line-height:1.55;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">${escapeHtml(line)}</p>`,
    )
    .join('');

  const ctaHtml =
    options.ctaLabel && options.ctaUrl
      ? `
          <table role="presentation" cellspacing="0" cellpadding="0" style="margin:28px 0 0 0;">
            <tr>
              <td style="border-radius:999px;background-color:${CP.indigo};background-image:linear-gradient(135deg,${CP.indigo} 0%,${CP.coral} 100%);">
                <a href="${escapeHtml(options.ctaUrl)}" style="display:inline-block;padding:14px 28px;color:${CP.onPrimary};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:16px;font-weight:600;text-decoration:none;border-radius:999px;line-height:1.2;mso-padding-alt:0;">${escapeHtml(options.ctaLabel)}</a>
              </td>
            </tr>
          </table>`
      : '';

  const footerNote = options.footerNote
    ? `<p style="margin:32px 0 0 0;padding-top:24px;border-top:1px solid ${CP.borderLight};color:${CP.textFine};font-size:13px;line-height:1.5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">${escapeHtml(options.footerNote)}</p>`
    : '';

  const font =
    "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif";

  return `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <meta name="color-scheme" content="light">
    <meta name="supported-color-schemes" content="light">
  </head>
  <body style="margin:0;padding:0;background-color:${CP.pageBg};-webkit-text-size-adjust:100%;">
    <div style="display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:${CP.pageBg};opacity:0;">
      ${escapeHtml(options.intro)}
    </div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:${CP.pageBg};padding:40px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background-color:${CP.card};border-radius:20px;border:1px solid ${CP.borderLight};overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
            <tr>
              <td style="height:4px;line-height:4px;font-size:0;background-color:${CP.indigo};background-image:linear-gradient(90deg,${CP.coral} 0%,${CP.gold} 50%,${CP.purple} 100%);">&nbsp;</td>
            </tr>
            <tr>
              <td style="padding:36px 32px 8px 32px;font-family:${font};">
                <p style="margin:0 0 20px 0;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${CP.indigo};font-weight:700;">CulturePass</p>
                <h1 style="margin:0;color:${CP.text};font-size:30px;font-weight:700;line-height:1.12;letter-spacing:-0.03em;">${escapeHtml(options.title)}</h1>
                <p style="margin:14px 0 0 0;color:${CP.textMuted};font-size:17px;line-height:1.45;font-weight:400;">${escapeHtml(options.intro)}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 32px 40px 32px;font-family:${font};">
                ${bodyHtml}
                ${ctaHtml}
                ${footerNote}
              </td>
            </tr>
          </table>
          <p style="margin:24px 0 0 0;font-family:${font};font-size:12px;color:${CP.textFine};text-align:center;line-height:1.5;">
            Experiences · Communities · Events
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>
`.trim();
}

export function buildWelcomeEmail(params: {
  displayName: string;
  role: 'user' | 'organizer';
  appUrl: string;
}): EmailTemplate {
  const roleText = params.role === 'organizer' ? 'organizer' : 'member';
  const subject = `Welcome to CulturePass, ${params.displayName}`;
  const text = [
    `Hi ${params.displayName},`,
    '',
    `Your CulturePass ${roleText} account is ready.`,
    'You can now discover events, communities, local dining, shopping, and offers tailored to your city.',
    '',
    `Open CulturePass: ${params.appUrl}`,
  ].join('\n');

  return {
    subject,
    text,
    html: renderBaseEmail({
      title: `Welcome, ${params.displayName}`,
      intro: 'Your account is live — discover culture around you.',
      body: [
        `Your ${roleText} profile is ready.`,
        'Explore events, join communities, and find offers tailored to your city.',
      ],
      ctaLabel: 'Open CulturePass',
      ctaUrl: params.appUrl,
      footerNote: 'If you did not create this account, contact support immediately.',
    }),
  };
}

export function buildCommunityCreatedEmail(params: {
  creatorName: string;
  communityName: string;
  communityUrl: string;
}): EmailTemplate {
  const subject = `Community created: ${params.communityName}`;
  const text = [
    `Hi ${params.creatorName},`,
    '',
    `Your community "${params.communityName}" has been created successfully.`,
    `View community: ${params.communityUrl}`,
  ].join('\n');

  return {
    subject,
    text,
    html: renderBaseEmail({
      title: 'Your community is live',
      intro: `${params.communityName} is ready for members.`,
      body: [
        'Invite people, share updates, and host events — all from your community home.',
        'Open CulturePass to review settings and join options.',
      ],
      ctaLabel: 'Open community',
      ctaUrl: params.communityUrl,
    }),
  };
}

export function buildCommunityInvitationEmail(params: {
  inviteeEmail: string;
  inviterName: string;
  communityName: string;
  inviteMessage?: string;
  communityUrl: string;
}): EmailTemplate {
  const subject = `${params.inviterName} invited you to ${params.communityName}`;
  const text = [
    `Hi,`,
    '',
    `${params.inviterName} invited you to join "${params.communityName}" on CulturePass.`,
    ...(params.inviteMessage ? [`Message: ${params.inviteMessage}`, ''] : []),
    `Join community: ${params.communityUrl}`,
  ].join('\n');

  const body = [
    `${params.inviterName} invited you to join "${params.communityName}" on CulturePass.`,
    ...(params.inviteMessage
      ? [`“${params.inviteMessage}”`]
      : ['Connect with members and see what is happening next.']),
  ];

  return {
    subject,
    text,
    html: renderBaseEmail({
      title: "You're invited",
      intro: `Join ${params.communityName} on CulturePass.`,
      body,
      ctaLabel: 'View invitation',
      ctaUrl: params.communityUrl,
      footerNote: 'You can ignore this email if the invitation is not for you.',
    }),
  };
}

/**
 * GROWV — Contact form receiver
 *
 * Setup (one time):
 *  1. Open your Google Sheet (the one you want leads written to).
 *  2. Extensions → Apps Script. Replace the contents of Code.gs with this file.
 *  3. Save. Click "Deploy" → "New deployment" → type "Web app".
 *  4. Execute as: Me. Who has access: Anyone. Click Deploy.
 *  5. Authorize when prompted. Copy the deployment URL.
 *  6. Paste that URL into FORM_ENDPOINT in /assets/js/app.js on the website.
 *
 * What it does on every submission:
 *  - Appends a row to the active sheet (Date, Name, Email, Phone, Message, Source, Status, Notes)
 *  - Emails NOTIFY_EMAIL a styled HTML notification
 */

// Where new-lead notifications go. Comma-separated for multiple recipients.
const NOTIFY_EMAIL = 'jonathan@mygrowv.com';

// Subject of the notification email.
const NOTIFY_SUBJECT = 'New lead from mygrowv.com';

// Column order in the sheet. Don't rename here unless you also rename
// the header row in the sheet itself.
const COLUMNS = ['Date', 'Name', 'Email', 'Phone', 'Message', 'Source', 'Status', 'Notes'];

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getActiveSheet();

    // Add header row the first time the sheet is empty.
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(COLUMNS);
      sheet.getRange(1, 1, 1, COLUMNS.length).setFontWeight('bold');
    }

    sheet.appendRow([
      new Date(),
      payload.name || '',
      payload.email || '',
      payload.phone || '',
      payload.message || '',
      payload.source || '',
      'New',
      ''
    ]);

    const sheetUrl = ss.getUrl();
    const submittedAt = Utilities.formatDate(new Date(), ss.getSpreadsheetTimeZone(), "MMM d, yyyy 'at' h:mm a");

    MailApp.sendEmail({
      to: NOTIFY_EMAIL,
      subject: NOTIFY_SUBJECT + (payload.name ? ' — ' + payload.name : ''),
      body: buildPlainBody(payload, submittedAt, sheetUrl),
      htmlBody: buildHtmlBody(payload, submittedAt, sheetUrl),
      replyTo: payload.email || NOTIFY_EMAIL,
      name: 'GROWV Website'
    });

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Plain-text fallback for clients that block HTML.
function buildPlainBody(p, submittedAt, sheetUrl) {
  return [
    'A NEW LEAD just came in via mygrowv.com',
    '',
    'Name:    ' + (p.name || '—'),
    'Email:   ' + (p.email || '—'),
    'Phone:   ' + (p.phone || '—'),
    '',
    'Message:',
    (p.message || '—'),
    '',
    'Submitted: ' + submittedAt,
    'Source:    ' + (p.source || 'mygrowv.com'),
    '',
    'Open the lead pipeline: ' + sheetUrl,
    '',
    '— GROWV Website'
  ].join('\n');
}

// HTML email matching the GROWV brand (dark ink + gold + serif display).
function buildHtmlBody(p, submittedAt, sheetUrl) {
  const esc = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  const nl2br = (s) => esc(s).replace(/\n/g, '<br>');

  const name    = p.name ? esc(p.name) : '<span style="color:#8a8d8b">—</span>';
  const email   = p.email ? '<a href="mailto:' + esc(p.email) + '" style="color:#bfa164;text-decoration:none;">' + esc(p.email) + '</a>' : '<span style="color:#8a8d8b">—</span>';
  const phone   = p.phone ? '<a href="tel:' + esc(p.phone.replace(/[^0-9+]/g, '')) + '" style="color:#bfa164;text-decoration:none;">' + esc(p.phone) + '</a>' : '<span style="color:#8a8d8b">—</span>';
  const message = p.message ? nl2br(p.message) : '<em style="color:#8a8d8b">(no message)</em>';

  const replyHref = p.email ? 'mailto:' + esc(p.email) + '?subject=' + encodeURIComponent('Re: your inquiry with GROWV') : '#';

  return ''
    + '<!doctype html>'
    + '<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">'
    + '<title>New lead — GROWV</title></head>'
    + '<body style="margin:0;padding:0;background:#f4f1ea;font-family:Georgia,\'Times New Roman\',serif;color:#1a1a1a;">'
    + '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f1ea;padding:32px 16px;">'
      + '<tr><td align="center">'
        + '<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:#ffffff;border:1px solid #e6e0d3;">'

          // Header bar
          + '<tr><td style="background:#0e1a14;padding:28px 32px;">'
            + '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">'
              + '<tr>'
                + '<td style="font-family:Georgia,serif;font-size:18px;letter-spacing:0.32em;color:#bfa164;font-weight:600;">GROWV</td>'
                + '<td align="right" style="font-family:Helvetica,Arial,sans-serif;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:rgba(255,255,255,0.55);">New Inquiry</td>'
              + '</tr>'
            + '</table>'
          + '</td></tr>'

          // Lead summary
          + '<tr><td style="padding:36px 32px 8px 32px;">'
            + '<p style="margin:0 0 8px 0;font-family:Helvetica,Arial,sans-serif;font-size:11px;letter-spacing:0.24em;text-transform:uppercase;color:#8a8d8b;">A lead just landed</p>'
            + '<h1 style="margin:0 0 4px 0;font-family:Georgia,\'Times New Roman\',serif;font-size:30px;font-weight:400;line-height:1.2;color:#0e1a14;">' + name + '</h1>'
            + '<p style="margin:0;font-family:Helvetica,Arial,sans-serif;font-size:13px;color:#6b6e6c;">' + esc(submittedAt) + '</p>'
          + '</td></tr>'

          // Divider
          + '<tr><td style="padding:24px 32px 0 32px;"><div style="height:1px;background:#e6e0d3;line-height:1px;font-size:0;">&nbsp;</div></td></tr>'

          // Contact rows
          + '<tr><td style="padding:8px 32px;">'
            + '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">'
              + row('Email', email)
              + row('Phone', phone)
              + row('Source', esc(p.source || 'mygrowv.com'))
            + '</table>'
          + '</td></tr>'

          // Message
          + '<tr><td style="padding:8px 32px 24px 32px;">'
            + '<p style="margin:24px 0 8px 0;font-family:Helvetica,Arial,sans-serif;font-size:11px;letter-spacing:0.24em;text-transform:uppercase;color:#8a8d8b;">Message</p>'
            + '<div style="font-family:Georgia,\'Times New Roman\',serif;font-size:16px;line-height:1.65;color:#1a1a1a;border-left:2px solid #bfa164;padding:6px 0 6px 16px;">' + message + '</div>'
          + '</td></tr>'

          // CTAs
          + '<tr><td style="padding:0 32px 36px 32px;">'
            + '<table role="presentation" cellpadding="0" cellspacing="0" border="0">'
              + '<tr>'
                + '<td style="padding-right:10px;"><a href="' + replyHref + '" style="display:inline-block;background:#bfa164;color:#0e1a14;font-family:Helvetica,Arial,sans-serif;font-size:12px;letter-spacing:0.22em;text-transform:uppercase;font-weight:600;text-decoration:none;padding:14px 22px;">Reply to lead</a></td>'
                + '<td><a href="' + esc(sheetUrl) + '" style="display:inline-block;background:transparent;color:#0e1a14;font-family:Helvetica,Arial,sans-serif;font-size:12px;letter-spacing:0.22em;text-transform:uppercase;font-weight:600;text-decoration:none;padding:13px 21px;border:1px solid #0e1a14;">Open pipeline</a></td>'
              + '</tr>'
            + '</table>'
          + '</td></tr>'

          // Footer
          + '<tr><td style="background:#faf7f1;border-top:1px solid #e6e0d3;padding:18px 32px;font-family:Helvetica,Arial,sans-serif;font-size:11px;letter-spacing:0.16em;color:#8a8d8b;text-transform:uppercase;">'
            + 'GROWV LLC · Riverdale, UT · mygrowv.com'
          + '</td></tr>'
        + '</table>'

        + '<p style="margin:16px 0 0 0;font-family:Helvetica,Arial,sans-serif;font-size:11px;color:#8a8d8b;">You\'re receiving this because a lead submitted the contact form on mygrowv.com.</p>'
      + '</td></tr>'
    + '</table>'
    + '</body></html>';
}

function row(label, value) {
  return ''
    + '<tr>'
      + '<td valign="top" style="padding:12px 0;border-bottom:1px solid #f0ebde;font-family:Helvetica,Arial,sans-serif;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#8a8d8b;width:90px;">' + label + '</td>'
      + '<td valign="top" style="padding:12px 0;border-bottom:1px solid #f0ebde;font-family:Georgia,\'Times New Roman\',serif;font-size:16px;color:#1a1a1a;">' + value + '</td>'
    + '</tr>';
}

// Health check
function doGet() {
  return ContentService
    .createTextOutput('GROWV form endpoint is live.')
    .setMimeType(ContentService.MimeType.TEXT);
}

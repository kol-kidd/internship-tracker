import nodemailer from "nodemailer";
import { supabase } from "../config/supabase.js";

const FRONTEND_URL =
  process.env.FRONTEND_URL ||
  (process.env.FRONTEND_URLS || "").split(",")[0]?.trim() ||
  "https://internpal.vercel.app";

function createTransporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    console.warn(
      "GMAIL_USER or GMAIL_APP_PASSWORD not set — completion emails disabled.",
    );
    return null;
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
}

function completionHtml(profile) {
  const name = profile.full_name || "there";
  const hours = profile.required_hours ?? "your required";
  return `
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Inter',sans-serif;background:#f6f7f9;padding:32px;">
    <div style="max-width:520px;margin:0 auto;background:#fff;border:1px solid #e4e7ec;border-radius:16px;overflow:hidden;">
      <div style="background:#0b73d9;padding:28px 32px;color:#fff;">
        <div style="font-size:13px;letter-spacing:0.2em;text-transform:uppercase;opacity:0.85;">InternPal</div>
        <div style="font-size:22px;font-weight:700;margin-top:6px;">🎉 You did it!</div>
      </div>
      <div style="padding:28px 32px;color:#172033;">
        <p style="font-size:15px;line-height:1.6;">Hi ${name},</p>
        <p style="font-size:15px;line-height:1.6;">
          Congratulations — you've completed <strong>${hours} internship hours</strong>!
          Your certificate of completion is ready to download.
        </p>
        <a href="${FRONTEND_URL}/profile"
           style="display:inline-block;margin-top:12px;background:#0b73d9;color:#fff;text-decoration:none;
                  padding:12px 22px;border-radius:10px;font-weight:600;font-size:14px;">
          View your certificate
        </a>
        <p style="font-size:13px;color:#687083;margin-top:24px;line-height:1.6;">
          Keep up the great work!<br/>
          — The InternPal team
        </p>
      </div>
    </div>
  </div>`;
}

/**
 * Sends the completion email once via Gmail + Nodemailer.
 * Sets completion_emailed_at to prevent duplicate sends. No-op if Gmail
 * credentials are not configured.
 */
export async function sendCompletionEmail(profile) {
  if (!profile?.email) return;
  if (profile.completion_emailed_at) return; // guard: already sent

  const transporter = createTransporter();
  if (!transporter) return;

  try {
    await transporter.sendMail({
      from: `"InternPal" <${process.env.GMAIL_USER}>`,
      to: profile.email,
      subject: "🎉 You've completed your internship hours!",
      html: completionHtml(profile),
    });

    await supabase
      .from("profiles")
      .update({ completion_emailed_at: new Date().toISOString() })
      .eq("id", profile.id);
  } catch (err) {
    console.error("sendCompletionEmail error:", err?.message || err);
  }
}

import { jsPDF } from "jspdf";
import { calculateEntryHours, formatLogDate } from "@/lib/hours";
import type { Application } from "@/store/applicationStore";
import type { Profile } from "@/store/profileStore";

interface VerificationEntry {
  id: number;
  title: string;
  date: string;
  content: string;
  time_in: string | null;
  time_out: string | null;
  break_time: number | null;
}

function safeFilePart(value: string) {
  return value.replace(/[^a-z0-9]/gi, "_").toLowerCase();
}

function addWrappedText(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  const lines = doc.splitTextToSize(text, maxWidth) as string[];
  lines.forEach((line, index) => {
    doc.text(line, x, y + index * lineHeight);
  });
  return y + lines.length * lineHeight;
}

export function generateSupervisorVerificationPDF(params: {
  application: Application;
  entries: VerificationEntry[];
  profile: Profile | null;
  evidenceCount: number;
}) {
  const { application, entries, profile, evidenceCount } = params;
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 48;
  const width = doc.internal.pageSize.getWidth();
  const maxWidth = width - margin * 2;
  const totalHours = entries.reduce(
    (total, entry) =>
      total + calculateEntryHours(entry.time_in, entry.time_out, entry.break_time),
    0,
  );
  const sortedEntries = [...entries].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
  const firstDate = sortedEntries[0]?.date;
  const lastDate = sortedEntries[sortedEntries.length - 1]?.date;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Internship Verification Summary", margin, 56);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Generated ${formatLogDate(new Date().toISOString())}`, margin, 76);

  doc.setDrawColor(228, 231, 236);
  doc.line(margin, 92, width - margin, 92);

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Student", margin, 120);
  doc.setFont("helvetica", "normal");
  doc.text(profile?.full_name || "Not provided", margin, 140);
  doc.text(profile?.course || "Course not provided", margin, 158);
  doc.text(profile?.school || "School not provided", margin, 176);

  doc.setFont("helvetica", "bold");
  doc.text("Industry Partner", 320, 120);
  doc.setFont("helvetica", "normal");
  doc.text(application.company_name, 320, 140);
  doc.text(application.department || application.position || "Department not provided", 320, 158);
  doc.text(application.supervisor_name || "Supervisor not provided", 320, 176);
  if (application.supervisor_email) {
    doc.text(application.supervisor_email, 320, 194);
  }

  doc.setDrawColor(228, 231, 236);
  doc.roundedRect(margin, 220, maxWidth, 92, 8, 8);
  doc.setFont("helvetica", "bold");
  doc.text("Verification Snapshot", margin + 16, 244);
  doc.setFont("helvetica", "normal");
  doc.text(`${entries.length} journal entries`, margin + 16, 270);
  doc.text(`${totalHours.toFixed(1)} total hours`, margin + 190, 270);
  doc.text(`${evidenceCount} evidence image(s)`, margin + 350, 270);
  doc.text(
    `Coverage: ${formatLogDate(firstDate)} to ${formatLogDate(lastDate)}`,
    margin + 16,
    292,
  );

  let y = 348;
  doc.setFont("helvetica", "bold");
  doc.text("Entries for Review", margin, y);
  y += 20;
  doc.setFont("helvetica", "normal");

  for (const [index, entry] of sortedEntries.slice(0, 12).entries()) {
    if (y > 720) {
      doc.addPage();
      y = 56;
    }

    const hours = calculateEntryHours(
      entry.time_in,
      entry.time_out,
      entry.break_time,
    );
    doc.setFont("helvetica", "bold");
    doc.text(`${index + 1}. ${entry.title}`, margin, y);
    doc.setFont("helvetica", "normal");
    doc.text(`${formatLogDate(entry.date)} - ${hours.toFixed(1)}h`, margin, y + 16);
    y = addWrappedText(
      doc,
      entry.content.trim().slice(0, 260),
      margin,
      y + 34,
      maxWidth,
      14,
    );
    y += 18;
  }

  if (sortedEntries.length > 12) {
    doc.text(
      `+${sortedEntries.length - 12} more entries included in the app workspace.`,
      margin,
      y,
    );
  }

  doc.setFont("helvetica", "bold");
  doc.text("Supervisor Acknowledgement", margin, 760);
  doc.setFont("helvetica", "normal");
  doc.line(margin, 800, margin + 220, 800);
  doc.text("Signature over printed name", margin, 816);
  doc.line(350, 800, 500, 800);
  doc.text("Date", 350, 816);

  doc.save(
    `InternPal_Verification_${safeFilePart(application.company_name)}.pdf`,
  );
}

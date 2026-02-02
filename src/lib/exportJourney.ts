import jsPDF from "jspdf";
import type { Application } from "@/store/applicationStore";

function escapeCsvCell(value: string): string {
  const hasComma = value.includes(",");
  const hasQuote = value.includes('"');
  const hasNewline = value.includes("\n");
  if (hasComma || hasQuote || hasNewline) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function downloadJourneyCsv(
  applications: Application[],
  filename = "journey-history.csv"
) {
  const headers = [
    "Company",
    "Position",
    "Address",
    "Date Applied",
    "Status",
    "Notes",
  ];
  const rows = applications.map((app) => [
    escapeCsvCell(app.company_name),
    escapeCsvCell(app.position ?? ""),
    escapeCsvCell(app.company_address),
    escapeCsvCell(app.date_applied),
    escapeCsvCell(app.status),
    escapeCsvCell(app.notes ?? ""),
  ]);
  const headerLine = headers.join(",");
  const dataLines = rows.map((r) => r.join(","));
  const csv = [headerLine, ...dataLines].join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function formatPdfDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function downloadJourneyPdf(
  applications: Application[],
  narrative: string | null,
  filename = "journey-report.pdf"
) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = 210;
  const margin = 18;
  const maxW = pageW - margin * 2;
  let y = 20;

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Internship Journey Report", margin, y);
  y += 10;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Generated on ${new Date().toLocaleDateString("en-US", { dateStyle: "long" })}`,
    margin,
    y
  );
  y += 12;

  if (narrative && narrative.trim()) {
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Summary", margin, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(narrative.trim(), maxW);
    doc.text(lines, margin, y);
    y += lines.length * 5 + 10;
  }

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Applications", margin, y);
  y += 8;

  const colWidths = [45, 40, 30, 35];
  const headers = ["Company", "Position", "Date", "Status"];
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  let x = margin;
  headers.forEach((h, i) => {
    doc.text(h, x, y);
    x += colWidths[i];
  });
  y += 6;

  doc.setFont("helvetica", "normal");
  const sorted = [...applications].sort(
    (a, b) =>
      new Date(a.date_applied).getTime() - new Date(b.date_applied).getTime()
  );
  sorted.forEach((app) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    x = margin;
    const companyLines = doc.splitTextToSize(app.company_name || "—", colWidths[0]);
    const positionLines = doc.splitTextToSize(app.position || "—", colWidths[1]);
    const dateStr = formatPdfDate(app.date_applied);
    const statusStr = app.status || "—";
    const rowH = Math.max(companyLines.length, positionLines.length) * 5 + 2;
    doc.text(companyLines, x, y + 4);
    x += colWidths[0];
    doc.text(positionLines, x, y + 4);
    x += colWidths[1];
    doc.text(dateStr, x, y + 4);
    x += colWidths[2];
    doc.text(statusStr, x, y + 4);
    y += rowH;
  });

  doc.save(filename);
}

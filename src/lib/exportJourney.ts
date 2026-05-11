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
  filename = "application-timeline.csv"
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

// Status colors for visual indicators
const statusColors: Record<string, [number, number, number]> = {
  applied: [59, 130, 246],      // blue
  interviewing: [11, 115, 217], // blue
  offer_received: [34, 197, 94], // green
  accepted: [34, 197, 94],      // green
  rejected: [239, 68, 68],      // red
  withdrawn: [107, 114, 128],   // gray
};

export function downloadJourneyPdf(
  applications: Application[],
  narrative: string | null,
  filename = "internpal-application-timeline.pdf"
) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = 210;
  const pageH = 297;
  const margin = 20;
  const maxW = pageW - margin * 2;

  // Brand colors (matching web app theme)
  const primaryColor: [number, number, number] = [0, 113, 227]; // #0071e3
  const darkText: [number, number, number] = [29, 29, 31]; // #1d1d1f
  const mutedText: [number, number, number] = [134, 134, 139]; // #86868b
  const lightAccent: [number, number, number] = [225, 245, 254]; // #e1f5fe

  let y = margin;

  const addFooter = (pageNum: number, totalPages: number) => {
    doc.setFontSize(8);
    doc.setTextColor(...mutedText);
    doc.setFont("helvetica", "normal");
    doc.text(`InternPal  |  Page ${pageNum} of ${totalPages}`, pageW / 2, pageH - 10, {
      align: "center",
    });
  };

  // Header: InternPal branding
  doc.setFontSize(10);
  doc.setTextColor(...primaryColor);
  doc.setFont("helvetica", "bold");
  doc.text("InternPal", margin, y);
  y += 10;

  // Title
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...primaryColor);
  doc.text("Timeline", margin, y);
  doc.setTextColor(...darkText);
  doc.text(" Report", margin + doc.getTextWidth("Timeline"), y);
  y += 8;

  // Generation date
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...mutedText);
  doc.text(
    `Generated on ${new Date().toLocaleDateString("en-US", { dateStyle: "long" })}`,
    margin,
    y
  );
  y += 4;

  // Divider
  doc.setDrawColor(...lightAccent);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageW - margin, y);
  y += 12;

  // Summary section with styled box
  if (narrative && narrative.trim()) {
    doc.setFontSize(11);
    doc.setTextColor(...darkText);
    doc.setFont("helvetica", "bold");
    doc.text("SUMMARY", margin, y);
    const headerW = doc.getTextWidth("SUMMARY");
    doc.setDrawColor(...lightAccent);
    doc.setLineWidth(0.3);
    doc.line(margin + headerW + 4, y - 2, pageW - margin, y - 2);
    y += 6;

    // Summary box background
    const lines = doc.splitTextToSize(narrative.trim(), maxW - 8);
    const boxH = lines.length * 5 + 8;
    doc.setFillColor(...lightAccent);
    doc.roundedRect(margin, y - 2, maxW, boxH, 2, 2, "F");

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...darkText);
    doc.text(lines, margin + 4, y + 4);
    y += boxH + 10;
  }

  // Applications section
  doc.setFontSize(11);
  doc.setTextColor(...darkText);
  doc.setFont("helvetica", "bold");
  doc.text("APPLICATIONS", margin, y);
  const appsHeaderW = doc.getTextWidth("APPLICATIONS");
  doc.setDrawColor(...lightAccent);
  doc.setLineWidth(0.3);
  doc.line(margin + appsHeaderW + 4, y - 2, pageW - margin, y - 2);
  y += 8;

  // Table header
  const colWidths = [50, 45, 32, 40];
  const headers = ["Company", "Position", "Date", "Status"];

  doc.setFillColor(...primaryColor);
  doc.rect(margin, y - 5, maxW, 9, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  let x = margin;
  headers.forEach((h, i) => {
    doc.text(h, x + 3, y + 1);
    x += colWidths[i];
  });
  y += 7;

  // Table rows
  const sorted = [...applications].sort(
    (a, b) =>
      new Date(a.date_applied).getTime() - new Date(b.date_applied).getTime()
  );

  sorted.forEach((app, idx) => {
    if (y > pageH - 30) {
      doc.addPage();
      y = margin;
    }

    const rowH = 9;

    // Alternating row background
    doc.setDrawColor(...lightAccent);
    if (idx % 2 === 0) {
      doc.setFillColor(245, 245, 247); // #f5f5f7 surface color
    } else {
      doc.setFillColor(255, 255, 255);
    }
    doc.rect(margin, y - 5, maxW, rowH, "FD");

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...darkText);

    x = margin;
    const company = (app.company_name || "—").slice(0, 28);
    const position = (app.position || "—").slice(0, 25);
    const dateStr = formatPdfDate(app.date_applied);
    const statusStr = app.status?.replace(/_/g, " ") || "—";

    doc.text(company, x + 3, y + 1);
    x += colWidths[0];

    doc.text(position, x + 3, y + 1);
    x += colWidths[1];

    doc.text(dateStr, x + 3, y + 1);
    x += colWidths[2];

    // Status with color dot
    const statusColor = statusColors[app.status] || mutedText;
    doc.setFillColor(...statusColor);
    doc.circle(x + 4, y - 1, 1.5, "F");
    doc.setTextColor(...darkText);
    doc.text(statusStr.charAt(0).toUpperCase() + statusStr.slice(1), x + 8, y + 1);

    y += rowH;
  });

  if (applications.length === 0) {
    doc.setFillColor(250, 250, 255);
    doc.setDrawColor(...lightAccent);
    doc.rect(margin, y - 5, maxW, 9, "FD");
    doc.setFontSize(9);
    doc.setTextColor(...mutedText);
    doc.text("No applications yet.", margin + 4, y + 1);
    y += 9;
  }

  // Add footers to all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(i, totalPages);
  }

  doc.save(filename);
}

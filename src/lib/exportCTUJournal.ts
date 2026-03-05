import jsPDF from "jspdf";

export interface CTUJournalParams {
  traineeName: string;
  course: string;
  industryPartner: string;
  department: string;
  dateRange: { start: string; end: string };
  activities: string[];
  learnings: string[];
}

export function generateCTUJournalPDF(params: CTUJournalParams): void {
  const { traineeName, course, industryPartner, department, dateRange, activities, learnings } = params;

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const mx = 18;
  const contentW = W - mx * 2;
  const black: [number, number, number] = [0, 0, 0];
  const lw = 0.3;

  const fmtDate = (iso: string) =>
    iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";

  // ── TOP-RIGHT CORNER BOX ──────────────────────────────────────────────────
  const bw = 28;
  const bh = 13;
  const bx = W - mx - bw;
  const by = 12;
  doc.setDrawColor(...black);
  doc.setLineWidth(lw);
  doc.rect(bx, by, bw, bh, "S");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...black);
  doc.text("OJT Form 6", bx + bw / 2, by + 4.5, { align: "center" });
  doc.text("October 2012", bx + bw / 2, by + 8, { align: "center" });
  doc.text("Revision: 0", bx + bw / 2, by + 11.5, { align: "center" });

  // ── CENTERED HEADER ───────────────────────────────────────────────────────
  let y = 18;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("CEBU TECHNOLOGICAL UNIVERSITY", W / 2, y, { align: "center" });
  y += 5.5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("( Danao Campus", W / 2, y, { align: "center" });
  y += 5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("Daily/ Weekly/ Monthly Performance Report", W / 2, y, { align: "center" });
  y += 7;

  // ── SINGLE OUTER BORDER for entire form (info + table + signatures) ──────
  const formTopY = y;
  const formBottomY = H - 12;
  const formH = formBottomY - formTopY;
  doc.setLineWidth(lw);
  doc.setDrawColor(...black);
  doc.rect(mx, formTopY, contentW, formH, "S");

  // ── INFO ROWS (rows 0-3) inside the form ──────────────────────────────────
  const rowH = 7;
  const labelColW = 40;
  const dateColW = 38;
  const valueColW = contentW - labelColW - dateColW;
  const dateDivX = mx + labelColW + valueColW;

  // Vertical divider for date column (rows 0-3 only)
  doc.line(dateDivX, formTopY, dateDivX, formTopY + rowH * 4);

  // Horizontal dividers for rows 1-4
  for (let i = 1; i <= 4; i++) {
    doc.line(mx, formTopY + i * rowH, mx + contentW, formTopY + i * rowH);
  }

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const textY = (row: number) => formTopY + row * rowH + rowH * 0.7;

  // Row 0: Name of Student Trainee + Inclusive Date:
  doc.text("Name of Student Trainee:", mx + 2, textY(0));
  doc.text(traineeName || "", mx + labelColW + 2, textY(0));
  doc.text("Inclusive Date:", dateDivX + 2, textY(0));

  // Row 1: Course & Major + From:
  doc.text("Course & Major", mx + 2, textY(1));
  doc.text(":", mx + labelColW - 4, textY(1));
  doc.text(course || "", mx + labelColW + 2, textY(1));
  doc.text("From:", dateDivX + 2, textY(1));
  doc.text(fmtDate(dateRange.start), dateDivX + 14, textY(1));

  // Row 2: Industry Partner + To:
  doc.text("Industry Partner", mx + 2, textY(2));
  doc.text(":", mx + labelColW - 4, textY(2));
  doc.text(industryPartner || "", mx + labelColW + 2, textY(2));
  doc.text("To:", dateDivX + 2, textY(2));
  doc.text(fmtDate(dateRange.end), dateDivX + 14, textY(2));

  // Row 3: Department Assigned
  doc.text("Department Assigned", mx + 2, textY(3));
  doc.text(":", mx + labelColW - 4, textY(3));
  doc.text(department || "", mx + labelColW + 2, textY(3));

  // ── ROW 4: Activities / Learning/Insights HEADER ──────────────────────────
  const actHeaderY = formTopY + 4 * rowH;
  const colW = contentW / 2;

  // Vertical center divider from row 4 header down to signature section
  const sigSectionY = formBottomY - 52; // reserve 52mm for signatures at bottom
  doc.line(mx + colW, actHeaderY, mx + colW, sigSectionY);

  // Row 4 text: "Activities:" left, "Learning/Insights:" right
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("Activities:", mx + 2, textY(4));
  doc.text("Learning/Insights:", mx + colW + 2, textY(4));

  // ── CONTENT AREA (below row 4 header, above signature section) ────────────
  const contentTopY = actHeaderY + rowH;
  // Horizontal divider between content and signature section
  doc.line(mx, sigSectionY, mx + contentW, sigSectionY);

  const textPad = 3;
  const lineH = 3.8;
  const bulletW = colW - textPad * 2;
  const availableH = sigSectionY - contentTopY - 2;
  const maxLines = Math.floor(availableH / lineH);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);

  const buildLines = (items: string[], maxW: number): string[] => {
    const out: string[] = [];
    for (const item of items) {
      const wrapped = doc.splitTextToSize(`\u2022 ${item}`, maxW) as string[];
      for (const l of wrapped) out.push(l);
    }
    return out;
  };

  const actLines = buildLines(activities, bulletW);
  const leaLines = buildLines(learnings, bulletW);

  actLines.slice(0, maxLines).forEach((line, i) => {
    doc.text(line, mx + textPad, contentTopY + lineH * i + 2);
  });

  leaLines.slice(0, maxLines).forEach((line, i) => {
    doc.text(line, mx + colW + textPad, contentTopY + lineH * i + 2);
  });

  // ── SIGNATURE SECTION (inside the same outer border) ──────────────────────
  let sy = sigSectionY + 4;

  // "Prepared by:"
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Prepared by:", mx + 2, sy);
  sy += 8;

  // Trainee name (underlined)
  doc.setFont("helvetica", "bold");
  doc.text((traineeName || "").toUpperCase(), mx + 2, sy);
  doc.setDrawColor(...black);
  const nameW = doc.getTextWidth((traineeName || "").toUpperCase());
  doc.line(mx + 2, sy + 1, mx + 2 + nameW + 10, sy + 1);
  sy += 4;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("Student Trainee\u2019s Signature Over Printed Name", mx + 2, sy);

  // Horizontal divider before supervisor remarks
  sy += 4;
  doc.line(mx, sy, mx + contentW, sy);

  // "Industry Training Supervisor Remarks:" section
  sy += 4;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("Industry Training Supervisor Remarks:", mx + 2, sy);

  // Remarks empty area + sig line right-aligned
  const remarkEndY = sy + 18;
  doc.setDrawColor(...black);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.line(mx + contentW - 55, remarkEndY, mx + contentW - 2, remarkEndY);
  doc.text("Signature Over Printed Name", mx + contentW - 2, remarkEndY + 4, { align: "right" });

  // Horizontal divider before "Noted by"
  const notedDivY = remarkEndY + 7;
  doc.line(mx, notedDivY, mx + contentW, notedDivY);

  // "Noted by:" section
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("Noted by:", mx + 2, notedDivY + 4);

  // REYNILDA A. CASTRO centered
  const castroY = notedDivY + 12;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("REYNILDA A. CASTRO", mx + contentW / 2, castroY, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("Internship Coordinator", mx + contentW / 2, castroY + 4, { align: "center" });

  // ── SAVE ──────────────────────────────────────────────────────────────────
  const safeName = (traineeName || "trainee").replace(/[^a-z0-9]/gi, "_").toLowerCase();
  doc.save(`CTU_OJT_Form6_${safeName}.pdf`);
}

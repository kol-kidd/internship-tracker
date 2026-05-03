import { jsPDF } from "jspdf";

export interface CTUJournalParams {
  traineeName: string;
  course: string;
  industryPartner: string;
  department: string;
  dateRange: { start: string; end: string };
  activities: string[];
  learnings: string[];
}

type Rect = {
  x: number;
  y: number;
  w: number;
  h: number;
};

const TEMPLATE = {
  ojtBox: { x: 479.2, y: 41.5, w: 83.2, h: 52.5 },
  outer: { x: 63, y: 146.3, w: 469.4, h: 599 },
  gridX: 72.5,
  gridRight: 523,
  labelX: 77.7,
  valueX: 229.4,
  dateX: 417.2,
  dateValueX: 448.5,
  rowTop: 146.8,
  rowH: 14.5,
  labelW: 151.2,
  valueW: 187.4,
  dateW: 110.9,
  content: {
    left: { x: 72.5, y: 221.6, w: 258.8, h: 230.9 },
    right: { x: 331.8, y: 221.6, w: 191.2, h: 230.9 },
  },
  prepared: { x: 72.5, y: 453, w: 450.5, h: 72.5 },
  supervisorHeader: { x: 72.5, y: 526, w: 450.5, h: 14.5 },
  supervisorBody: { x: 72.5, y: 541.1, w: 450.5, h: 130.3 },
  notedHeader: { x: 72.5, y: 671.8, w: 450.5, h: 14.5 },
  notedBody: { x: 72.5, y: 686.8, w: 450.5, h: 58 },
};

function formatDate(iso: string): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function fitText(doc: jsPDF, text: string, maxWidth: number): string {
  const value = text.trim();
  if (doc.getTextWidth(value) <= maxWidth) return value;

  let next = value;
  while (next.length > 1 && doc.getTextWidth(`${next}...`) > maxWidth) {
    next = next.slice(0, -1);
  }

  return `${next.trimEnd()}...`;
}

function drawRect(doc: jsPDF, rect: Rect) {
  doc.rect(rect.x, rect.y, rect.w, rect.h);
}

function fillRect(doc: jsPDF, rect: Rect) {
  doc.rect(rect.x, rect.y, rect.w, rect.h, "F");
}

function drawTextInWidth(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  width: number,
) {
  doc.text(fitText(doc, text, width), x, y);
}

function drawBulletList(
  doc: jsPDF,
  items: string[],
  rect: Rect,
  options: { fontSize: number; lineHeight: number; maxWidth: number },
) {
  const x = rect.x + 5.2;
  let y = rect.y + 26.6;
  const maxY = rect.y + rect.h - 8;
  const maxWidth = options.maxWidth;
  const remaining: string[] = [];

  doc.setFont("helvetica", "normal");
  doc.setFontSize(options.fontSize);

  for (const item of items.filter((value) => value.trim())) {
    const lines = doc.splitTextToSize(`\u2022 ${item.trim()}`, maxWidth) as string[];

    if (y + lines.length * options.lineHeight > maxY) {
      remaining.push(item);
      continue;
    }

    for (const line of lines) {
      doc.text(line, x, y);
      y += options.lineHeight;
    }
    y += 1.5;
  }

  if (remaining.length > 0 && y + options.lineHeight <= maxY) {
    doc.text(`+${remaining.length} more item${remaining.length === 1 ? "" : "s"}`, x, y);
  }
}

function drawTemplate(doc: jsPDF) {
  doc.setTextColor(0, 0, 0);
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);

  drawRect(doc, TEMPLATE.ojtBox);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text("OJT Form 6", 486.9, 56.6);
  doc.text("October 2012", 486.9, 70.4);
  doc.text("Revision: 0", 486.9, 84.2);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("CEBU TECHNOLOGICAL UNIVERSITY", 297.6, 97.8, {
    align: "center",
  });
  doc.setFont("helvetica", "normal");
  doc.text("( Danao Campus", 297.6, 112.2, { align: "center" });
  doc.setFont("helvetica", "bold");
  doc.text("Daily/", 162.7, 126.7);
  doc.text("Weekly", 203.7, 126.7);
  doc.line(203.7, 128.8, 248, 128.8);
  doc.text("/ Monthly Performance Report", 248, 126.7);
  doc.setFont("helvetica", "normal");

  drawRect(doc, TEMPLATE.outer);

  const row0: Rect[] = [
    { x: 72.5, y: 146.8, w: 151.2, h: 14.5 },
    { x: 224.2, y: 146.8, w: 298.8, h: 14.5 },
  ];
  const row1: Rect[] = [
    { x: 72.5, y: 161.8, w: 151.2, h: 14.4 },
    { x: 224.2, y: 161.8, w: 187.4, h: 14.4 },
    { x: 412.1, y: 161.8, w: 110.9, h: 14.4 },
  ];
  const row2: Rect[] = [
    { x: 72.5, y: 176.6, w: 151.2, h: 14.4 },
    { x: 224.2, y: 176.6, w: 187.4, h: 14.4 },
    { x: 412.1, y: 176.6, w: 110.9, h: 29.4 },
  ];
  const row3: Rect[] = [
    { x: 72.5, y: 191.6, w: 151.2, h: 14.4 },
    { x: 224.2, y: 191.6, w: 187.4, h: 14.4 },
  ];
  const activityHeader: Rect[] = [
    { x: 72.5, y: 206.6, w: 258.8, h: 14.5 },
    { x: 331.8, y: 206.6, w: 191.2, h: 14.5 },
  ];

  const shaded = [
    row0[0],
    row1[0],
    row1[2],
    row2[0],
    row3[0],
    ...activityHeader,
    TEMPLATE.supervisorHeader,
    TEMPLATE.notedHeader,
  ];

  doc.setFillColor(238, 237, 231);
  shaded.forEach((rect) => fillRect(doc, rect));

  [...row0, ...row1, ...row2, ...row3, ...activityHeader].forEach((rect) =>
    drawRect(doc, rect),
  );
  drawRect(doc, TEMPLATE.content.left);
  drawRect(doc, TEMPLATE.content.right);
  drawRect(doc, TEMPLATE.prepared);
  drawRect(doc, TEMPLATE.supervisorHeader);
  drawRect(doc, TEMPLATE.supervisorBody);
  drawRect(doc, TEMPLATE.notedHeader);
  drawRect(doc, TEMPLATE.notedBody);
}

export function createCTUJournalPDF(params: CTUJournalParams): jsPDF {
  const {
    traineeName,
    course,
    industryPartner,
    department,
    dateRange,
    activities,
    learnings,
  } = params;

  const doc = new jsPDF({ unit: "pt", format: "a4" });

  drawTemplate(doc);

  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);

  drawTextInWidth(doc, "Name of Student Trainee:", TEMPLATE.labelX, 158.8, 145);
  drawTextInWidth(doc, traineeName || "", TEMPLATE.valueX, 158.8, 285);

  drawTextInWidth(doc, "Course & Major", TEMPLATE.labelX, 173.6, 104);
  doc.text(":", 185.7, 173.6);
  drawTextInWidth(doc, course || "", TEMPLATE.valueX, 173.6, 175);
  doc.text("Inclusive Date:", TEMPLATE.dateX, 173.6);

  drawTextInWidth(doc, "Industry Partner", TEMPLATE.labelX, 188.6, 104);
  doc.text(":", 185.7, 188.6);
  drawTextInWidth(doc, industryPartner || "", TEMPLATE.valueX, 188.6, 175);
  doc.text("From:", TEMPLATE.dateX, 188.6);
  doc.setFontSize(11);
  drawTextInWidth(doc, formatDate(dateRange.start), TEMPLATE.dateValueX, 188.6, 72);

  doc.setFontSize(12);
  drawTextInWidth(doc, "Department Assigned", TEMPLATE.labelX, 203.6, 132);
  doc.text(":", 185.7, 203.6);
  drawTextInWidth(doc, department || "", TEMPLATE.valueX, 203.6, 175);
  doc.text("To", TEMPLATE.dateX, 203.2);
  doc.text(":", 430.7, 203.2);
  doc.setFontSize(11);
  drawTextInWidth(doc, formatDate(dateRange.end), 434.9, 203.2, 86);

  doc.setFontSize(12);
  doc.text("Activities:", TEMPLATE.labelX, 218.6);
  doc.text("Learning/Insights:", 336.9, 218.6);

  drawBulletList(doc, activities, TEMPLATE.content.left, {
    fontSize: 12,
    lineHeight: 14.45,
    maxWidth: 230,
  });
  drawBulletList(doc, learnings, TEMPLATE.content.right, {
    fontSize: 12,
    lineHeight: 14.45,
    maxWidth: 170,
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text("Prepared by:", TEMPLATE.labelX, 465);

  const name = (traineeName || "").toUpperCase();
  doc.setFont("helvetica", "bold");
  doc.text(name, TEMPLATE.labelX, 494);
  const nameEnd = TEMPLATE.labelX + doc.getTextWidth(name);
  doc.setLineWidth(0.7);
  doc.line(TEMPLATE.labelX, 496.2, Math.min(nameEnd + 46, 270), 496.2);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text("Student Trainee\u2019s Signature Over Printed Name", TEMPLATE.labelX, 508.5);
  doc.setFont("helvetica", "bold");
  doc.text("Industry Training Supervisor Remarks:", TEMPLATE.labelX, 538);

  doc.line(353.9, 642, 506, 642);
  doc.setFont("helvetica", "normal");
  doc.text("Signature Over Printed Name", 362.9, 654.3);

  doc.setFont("helvetica", "bold");
  doc.text("Noted by:", TEMPLATE.labelX, 683.8);
  doc.setFont("helvetica", "bold");
  doc.text("REYNILDA A. CASTRO", 413, 713.4, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.text("Internship Coordinator", 413, 727.8, { align: "center" });

  return doc;
}

export function generateCTUJournalPDF(params: CTUJournalParams): void {
  const doc = createCTUJournalPDF(params);
  const safeName = (params.traineeName || "trainee")
    .replace(/[^a-z0-9]/gi, "_")
    .toLowerCase();
  doc.save(`CTU_OJT_Form6_${safeName}.pdf`);
}

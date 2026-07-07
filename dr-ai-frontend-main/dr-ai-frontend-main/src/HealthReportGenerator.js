import jsPDF from "jspdf";
import { font as notoDevanagariFont } from "./fonts/NotoSansDevanagari";

const COLORS = {
  primary:   [102, 126, 234],
  secondary: [118, 75, 162],
  dark:      [30, 41, 59],
  gray:      [100, 116, 139],
  lightGray: [241, 245, 249],
  white:     [255, 255, 255],
  green:     [34, 197, 94],
  border:    [226, 232, 240],
  warning:   [255, 243, 205],
  warnText:  [146, 99, 0],
};

// ── Detect if text contains Hindi/Devanagari ──────────────────────────────────
function containsHindi(str) {
  return /[\u0900-\u097F]/.test(str);
}

// ── Clean emojis but preserve Hindi unicode ───────────────────────────────────
function cleanText(str) {
  if (!str) return "";
  return str
    .replace(/💡\s*/g, "")
    .replace(/🎤\s*/g, "[Voice] ")
    .replace(/📷\s*/g, "[Image] ")
    .replace(/💊/g, "[Medicine]")
    // Remove emoji/symbols but KEEP Devanagari (\u0900-\u097F) and basic Latin
    .replace(/[^\x00-\x7E\u0900-\u097F\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function roundedRect(doc, x, y, w, h, r, fillColor) {
  doc.setFillColor(...fillColor);
  doc.roundedRect(x, y, w, h, r, r, "F");
}

// ── Register Devanagari font with jsPDF ───────────────────────────────────────
function registerFont(doc) {
  try {
    doc.addFileToVFS("NotoSansDevanagari.ttf", notoDevanagariFont);
    doc.addFont("NotoSansDevanagari.ttf", "NotoSansDevanagari", "normal");
    doc.addFont("NotoSansDevanagari.ttf", "NotoSansDevanagari", "bold");
    return true;
  } catch(e) {
    console.warn("Devanagari font registration failed:", e);
    return false;
  }
}

// ── Set font based on content ─────────────────────────────────────────────────
function setFont(doc, text, size, style = "normal", hindiAvailable = false) {
  doc.setFontSize(size);
  if (hindiAvailable && containsHindi(text)) {
    doc.setFont("NotoSansDevanagari", "normal"); // variable font only has normal
  } else {
    doc.setFont("helvetica", style);
  }
}

function addPageHeader(doc, pageW, margin) {
  doc.setFillColor(102, 126, 234);
  doc.rect(0, 0, pageW, 10, "F");
  doc.setFontSize(8); doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("Dr.AI Health Report (continued)", margin, 7);
}

export function generateHealthReport({ chat, currentUser, conversationTitle }) {
  const doc   = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 20;
  const cW     = pageW - margin * 2;
  let   y      = 0;

  // Register Hindi font
  const hindiAvailable = registerFont(doc);

  const now     = new Date();
  const dateStr = now.toLocaleDateString("en-IN", { day:"numeric", month:"long", year:"numeric" });
  const timeStr = now.toLocaleTimeString("en-IN", { hour:"2-digit", minute:"2-digit" });

  // ── HEADER ────────────────────────────────────────────────────────────────
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, pageW, 52, "F");
  doc.setFillColor(...COLORS.secondary);
  doc.rect(0, 48, pageW, 4, "F");

  // Logo circle
  doc.setFillColor(255, 255, 255);
  doc.circle(margin + 10, 26, 10, "F");
  doc.setFontSize(11); doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.primary);
  doc.text("AI", margin + 6.5, 29);

  // Title
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(22); doc.setFont("helvetica", "bold");
  doc.text("Dr.AI Health Report", margin + 26, 22);
  doc.setFontSize(10); doc.setFont("helvetica", "normal");
  doc.text("AI-Powered Healthcare Consultation Summary", margin + 26, 30);

  // Date
  doc.setFontSize(9);
  doc.text(`Generated: ${dateStr} at ${timeStr}`, pageW - margin, 22, { align: "right" });
  doc.text("CONFIDENTIAL - For personal use only", pageW - margin, 30, { align: "right" });

  y = 60;

  // ── PATIENT INFO ──────────────────────────────────────────────────────────
  roundedRect(doc, margin, y, cW, 28, 3, COLORS.lightGray);
  doc.setFontSize(9); doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.gray);
  doc.text("PATIENT INFORMATION", margin + 8, y + 8);
  doc.setFontSize(12); doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.dark);
  doc.text(cleanText(currentUser?.displayName || "Patient"), margin + 8, y + 17);
  doc.setFontSize(9); doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.gray);
  doc.text(`Email: ${currentUser?.email || "-"}`, margin + 8, y + 23);

  doc.setFontSize(9); doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.primary);
  doc.text(cleanText(conversationTitle || "Healthcare Consultation"), pageW - margin - 8, y + 17, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.gray);
  doc.text(`Session: ${dateStr}`, pageW - margin - 8, y + 23, { align: "right" });

  y += 36;

  // ── DISCLAIMER ────────────────────────────────────────────────────────────
  roundedRect(doc, margin, y, cW, 16, 2, COLORS.warning);
  doc.setFontSize(8); doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.warnText);
  doc.text("DISCLAIMER", margin + 6, y + 7);
  doc.setFont("helvetica", "normal");
  doc.text(
    "This report is generated by an AI assistant and is for informational purposes only. Always consult a licensed physician.",
    margin + 6, y + 12, { maxWidth: cW - 12 }
  );

  y += 24;

  // ── TRANSCRIPT HEADER ─────────────────────────────────────────────────────
  doc.setFillColor(...COLORS.primary);
  doc.rect(margin, y, 3, 7, "F");
  doc.setFontSize(13); doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.dark);
  doc.text("Consultation Transcript", margin + 7, y + 6);
  y += 14;

  // ── MESSAGES ─────────────────────────────────────────────────────────────
  const messages = chat.filter(m =>
    (m.role === "patient" || m.role === "doctor") && m.text?.trim()
  );

  if (messages.length === 0) {
    doc.setFontSize(10); doc.setFont("helvetica", "italic");
    doc.setTextColor(...COLORS.gray);
    doc.text("No consultation messages found.", margin, y);
    y += 10;
  }

  for (const msg of messages) {
    const text = cleanText(msg.text);
    if (!text) continue;

    const isPatient = msg.role === "patient";
    const isTip     = msg.text.startsWith("💡");

    const bgColor    = isPatient ? [235, 239, 255] : isTip ? [240, 255, 244] : COLORS.lightGray;
    const labelColor = isPatient ? COLORS.primary   : isTip ? [22, 163, 74]   : COLORS.gray;
    const label      = isPatient ? "You (Patient)"  : isTip ? "Health Tip"    : "Dr.AI";

    // Set correct font for text measurement
    const isHindi = hindiAvailable && containsHindi(text);
    doc.setFontSize(9);
    if (isHindi) {
      doc.setFont("NotoSansDevanagari", "normal");
    } else {
      doc.setFont("helvetica", "normal");
    }

    const lines = doc.splitTextToSize(text, cW - 16);
    const boxH  = Math.max(18, lines.length * 5.5 + 12);

    // Page break
    if (y + boxH > pageH - 24) {
      doc.addPage();
      addPageHeader(doc, pageW, margin);
      y = 24;
    }

    roundedRect(doc, margin, y, cW, boxH, 3, bgColor);

    // Label (always helvetica)
    doc.setFontSize(8); doc.setFont("helvetica", "bold");
    doc.setTextColor(...labelColor);
    doc.text(label, margin + 6, y + 7);

    // Message body
    doc.setFontSize(9);
    if (isHindi) {
      doc.setFont("NotoSansDevanagari", "normal");
    } else {
      doc.setFont("helvetica", "normal");
    }
    doc.setTextColor(...COLORS.dark);
    lines.forEach((line, i) => {
      doc.text(line, margin + 6, y + 13 + i * 5.5);
    });

    y += boxH + 4;
  }

  // ── SESSION SUMMARY ───────────────────────────────────────────────────────
  if (y + 50 > pageH - 24) {
    doc.addPage();
    addPageHeader(doc, pageW, margin);
    y = 24;
  }

  y += 8;
  doc.setFillColor(...COLORS.primary);
  doc.rect(margin, y, 3, 7, "F");
  doc.setFontSize(13); doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.dark);
  doc.text("Session Summary", margin + 7, y + 6);
  y += 14;

  const patientMsgs = chat.filter(m => m.role === "patient" && m.text?.trim()).length;
  const doctorMsgs  = chat.filter(m => m.role === "doctor"  && m.text?.trim() && !m.text.startsWith("💡")).length;
  const tips        = chat.filter(m => m.text?.startsWith("💡")).length;

  const colW = cW / 4;
  const stats = [
    { label: "Patient Messages",  value: String(patientMsgs) },
    { label: "Dr.AI Responses",   value: String(doctorMsgs)  },
    { label: "Health Tips Given", value: String(tips)        },
    { label: "Report Date",       value: dateStr             },
  ];

  stats.forEach((s, i) => {
    const x = margin + i * colW;
    roundedRect(doc, x + 1, y, colW - 2, 26, 3, COLORS.lightGray);

    const isDate = i === 3;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(isDate ? 7 : 20);
    doc.setTextColor(...COLORS.primary);

    if (isDate) {
      const dLines = doc.splitTextToSize(s.value, colW - 6);
      dLines.forEach((dl, di) => {
        doc.text(dl, x + colW / 2, y + 9 + di * 5, { align: "center" });
      });
    } else {
      doc.text(s.value, x + colW / 2, y + 14, { align: "center" });
    }

    doc.setFontSize(8); doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.gray);
    doc.text(s.label, x + colW / 2, y + 22, { align: "center" });
  });

  // ── FOOTER on all pages ───────────────────────────────────────────────────
  const totalPages = doc.internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFillColor(...COLORS.lightGray);
    doc.rect(0, pageH - 12, pageW, 12, "F");
    doc.setFontSize(8); doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.gray);
    doc.text("Dr.AI - AI Healthcare Companion | For informational purposes only", margin, pageH - 5);
    doc.text(`Page ${p} of ${totalPages}`, pageW - margin, pageH - 5, { align: "right" });
  }

  const fileName = `DrAI_Report_${now.toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
  return fileName;
}
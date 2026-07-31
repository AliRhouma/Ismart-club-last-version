import { jsPDF } from "jspdf"

import {
  campaignTotals,
  num,
  SLOT_BY_KEY,
  type Campaign,
} from "@/data/seed/sponsoring"

/**
 * "Exporter les KPIs (PDF)" — the bilan a club sends to a sponsor once a
 * campaign is archived: its totals, then vues / clics / CTR space by space.
 *
 * Drawn with jsPDF rather than printing the screen, because the report is a
 * LIGHT document (paper), not the dark app chrome. It keeps the brand signature
 * — near-black header band, neon-green monogram — and drops everything else.
 *
 * Type is Helvetica: jsPDF's built-in fonts avoid shipping a Rubik binary, and
 * the numbers are the point of this page, not the typeface. Text stays inside
 * WinAnsi (no arrows, no ellipsis glyphs) so accents render correctly.
 */

/* ── Palette (raw hex: PDF has no access to the CSS tokens) ─────────────── */
const INK = "#171717"
const INK_MUTED = "#737373"
const INK_SOFT = "#a3a3a3"
const BORDER = "#e5e5e5"
const BAND = "#131313"
const GREEN = "#00ff87"

const M = 12 // page margin, mm
const W = 210 // A4 width, mm

/** "campagne-saison-2025-2026" — a filename you can find again. */
function slug(text: string): string {
  return (
    text
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "campagne"
  )
}

/**
 * Every string drawn on the page goes through here.
 *
 * `Intl` groups French thousands with a NARROW no-break space (U+202F), which
 * is outside WinAnsi — jsPDF then re-encodes the whole string as 2-byte and the
 * standard fonts render it as garbage ("937 080" comes out as noise). Swapping
 * the exotic spaces for a plain one keeps every number readable.
 */
function clean(text: string): string {
  return text.replace(/[   ]/g, " ")
}

/** Draw sanitised text — use this instead of `doc.text`. */
function txt(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  opts?: { align?: "left" | "center" | "right" },
): void {
  doc.text(clean(text), x, y, opts)
}

/** Per-space CTR, formatted like the on-screen one. */
function ctrOf(views: number, clicks: number): string {
  if (!views) return "-"
  return `${((clicks / views) * 100).toLocaleString("fr-FR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })} %`
}

export function exportCampaignKpisPdf(
  campaign: Campaign,
  partnerName: string,
): string {
  const doc = new jsPDF({ unit: "mm", format: "a4" })
  const totals = campaignTotals(campaign)

  /* ── Header band ─────────────────────────────────────────────────────── */
  doc.setFillColor(BAND)
  doc.rect(0, 0, W, 30, "F")

  doc.setFillColor(GREEN)
  doc.roundedRect(M, 10, 10, 10, 2, 2, "F")
  doc.setTextColor(BAND)
  doc.setFont("helvetica", "bold").setFontSize(8)
  txt(doc, "iS", M + 5, 16.4, { align: "center" })

  doc.setTextColor("#fafafa")
  doc.setFont("helvetica", "bold").setFontSize(11)
  txt(doc, "iSmart Club", M + 14, 14.6)
  doc.setTextColor(INK_SOFT)
  doc.setFont("helvetica", "normal").setFontSize(7.5)
  txt(doc, "Plateforme club", M + 14, 19.2)

  doc.setFontSize(8.5)
  txt(doc, "Bilan de campagne", W - M, 16.4, { align: "right" })

  /* ── Title block ─────────────────────────────────────────────────────── */
  let y = 45
  doc.setTextColor(INK)
  doc.setFont("helvetica", "bold").setFontSize(19)
  txt(doc, campaign.name, M, y)

  y += 7
  doc.setTextColor(INK_MUTED)
  doc.setFont("helvetica", "normal").setFontSize(10)
  txt(doc, partnerName, M, y)

  y += 5.5
  doc.setTextColor(INK_SOFT)
  doc.setFontSize(9)
  txt(doc, 
    `Du ${campaign.startDate} au ${campaign.endDate}  ·  ${campaign.duration}`,
    M,
    y,
  )

  /* ── The four totals ─────────────────────────────────────────────────── */
  y += 8
  const cards: [string, string][] = [
    ["Vues totales", num(totals.views)],
    ["Clics totaux", num(totals.clicks)],
    ["CTR moyen", totals.ctr],
    ["Espaces", String(campaign.slots.length)],
  ]
  const cw = (W - 2 * M - 3 * 4) / 4
  cards.forEach(([label, value], i) => {
    const x = M + i * (cw + 4)
    doc.setDrawColor(BORDER)
    doc.setLineWidth(0.3)
    doc.roundedRect(x, y, cw, 24, 2, 2, "S")
    doc.setTextColor(INK)
    doc.setFont("helvetica", "bold").setFontSize(16)
    txt(doc, value, x + 5, y + 12)
    doc.setTextColor(INK_MUTED)
    doc.setFont("helvetica", "normal").setFontSize(7)
    txt(doc, label.toUpperCase(), x + 5, y + 18.5)
  })

  /* ── Space-by-space table ────────────────────────────────────────────── */
  y += 38
  doc.setTextColor(INK_MUTED)
  doc.setFont("helvetica", "bold").setFontSize(7.5)
  txt(doc, "DETAIL PAR ESPACE PUBLICITAIRE", M, y)

  y += 5
  const colViews = W - M - 62
  const colClicks = W - M - 31
  const colCtr = W - M

  doc.setTextColor(INK_SOFT)
  doc.setFont("helvetica", "normal").setFontSize(7.5)
  txt(doc, "ESPACE", M, y)
  txt(doc, "VUES", colViews, y, { align: "right" })
  txt(doc, "CLICS", colClicks, y, { align: "right" })
  txt(doc, "CTR", colCtr, y, { align: "right" })

  y += 2.5
  doc.setDrawColor(BORDER)
  doc.line(M, y, W - M, y)

  campaign.slots.forEach((slot) => {
    y += 12
    doc.setTextColor(INK)
    doc.setFont("helvetica", "bold").setFontSize(9.5)
    txt(doc, SLOT_BY_KEY[slot.key].label, M, y - 3.5)
    doc.setTextColor(INK_SOFT)
    doc.setFont("helvetica", "normal").setFontSize(7.5)
    txt(doc, slot.headline, M, y + 0.5)

    doc.setTextColor(INK)
    doc.setFont("helvetica", "normal").setFontSize(9.5)
    txt(doc, num(slot.views), colViews, y - 3.5, { align: "right" })
    txt(doc, num(slot.clicks), colClicks, y - 3.5, { align: "right" })
    txt(doc, ctrOf(slot.views, slot.clicks), colCtr, y - 3.5, {
      align: "right",
    })

    doc.setDrawColor(BORDER)
    doc.line(M, y + 3.5, W - M, y + 3.5)
  })

  /* ── Total row ───────────────────────────────────────────────────────── */
  y += 11
  doc.setTextColor(INK)
  doc.setFont("helvetica", "bold").setFontSize(9.5)
  txt(doc, "Total", M, y)
  txt(doc, num(totals.views), colViews, y, { align: "right" })
  txt(doc, num(totals.clicks), colClicks, y, { align: "right" })
  txt(doc, totals.ctr, colCtr, y, { align: "right" })

  /* ── Footer ──────────────────────────────────────────────────────────── */
  const today = new Date().toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
  doc.setDrawColor(BORDER)
  doc.line(M, 282, W - M, 282)
  doc.setTextColor(INK_SOFT)
  doc.setFont("helvetica", "normal").setFontSize(7.5)
  txt(doc, `Genere le ${today}`, M, 287)
  txt(doc, "iSmart Club  ·  Sponsoring", W - M, 287, { align: "right" })

  const filename = `kpis-${slug(campaign.name)}.pdf`
  doc.save(filename)
  return filename
}

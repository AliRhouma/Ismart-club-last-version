import { jsPDF } from "jspdf"

import {
  campaignTotals,
  creativeLabel,
  num,
  SLOT_BY_KEY,
  slotCreatives,
  type Campaign,
} from "@/data/seed/sponsoring"

/**
 * "Exporter le rapport (PDF)" — the bilan a club sends to a sponsor: the
 * période it covers stated up front (dates, durée, and how far along it is when
 * the campaign is still running), what it cost and what that bought (coût pour
 * 1 000 vues, coût par clic), then vues / clics / CTR space by space.
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

/** "12 000 DT" — a campaign's price, or the label when there is none. */
function price(campaign: Campaign): string {
  return campaign.price !== null
    ? `${campaign.price.toLocaleString("fr-FR")} DT`
    : "Echange"
}

/** "39,74 DT" — a computed amount, two decimals, French. */
function dt(amount: number): string {
  return `${amount.toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} DT`
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
  txt(
    doc,
    campaign.status === "en_cours"
      ? "Rapport de campagne  ·  en cours"
      : "Bilan de campagne  ·  terminee",
    W - M,
    16.4,
    { align: "right" },
  )

  /* ── Title block ─────────────────────────────────────────────────────── */
  let y = 45
  doc.setTextColor(INK)
  doc.setFont("helvetica", "bold").setFontSize(19)
  txt(doc, campaign.name, M, y)

  y += 7
  doc.setTextColor(INK_MUTED)
  doc.setFont("helvetica", "normal").setFontSize(10)
  txt(doc, partnerName, M, y)

  /* ── Période couverte ────────────────────────────────────────────────── */
  y += 8
  doc.setDrawColor(BORDER)
  doc.setLineWidth(0.3)
  doc.roundedRect(M, y, W - 2 * M, 20, 2, 2, "S")

  doc.setTextColor(INK_MUTED)
  doc.setFont("helvetica", "bold").setFontSize(7)
  txt(doc, "PERIODE COUVERTE PAR CE RAPPORT", M + 5, y + 6.5)

  doc.setTextColor(INK)
  doc.setFont("helvetica", "bold").setFontSize(10.5)
  txt(doc, `Du ${campaign.startDate} au ${campaign.endDate}`, M + 5, y + 13.5)

  doc.setTextColor(INK_MUTED)
  doc.setFont("helvetica", "normal").setFontSize(8.5)
  txt(
    doc,
    campaign.status === "en_cours"
      ? `${campaign.duration}  ·  ${campaign.progress} % ecoules${
          campaign.remaining ? `  ·  ${campaign.remaining}` : ""
        }`
      : `${campaign.duration}  ·  periode terminee`,
    W - M - 5,
    y + 13.5,
    { align: "right" },
  )

  /* ── The four totals ─────────────────────────────────────────────────── */
  y += 28
  const cards: [string, string][] = [
    ["Vues totales", num(totals.views)],
    ["Clics totaux", num(totals.clicks)],
    ["CTR moyen", totals.ctr],
    ["Cout de la campagne", price(campaign)],
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

  /* ── What the montant bought — display arithmetic, nothing stored ────── */
  y += 28
  if (campaign.price !== null && totals.views > 0) {
    doc.setFillColor("#fafafa")
    doc.setDrawColor(BORDER)
    doc.roundedRect(M, y, W - 2 * M, 12, 2, 2, "FD")

    doc.setTextColor(INK_MUTED)
    doc.setFont("helvetica", "bold").setFontSize(7)
    txt(doc, "RETOUR SUR LE MONTANT INVESTI", M + 5, y + 5)

    doc.setTextColor(INK)
    doc.setFont("helvetica", "normal").setFontSize(8.5)
    txt(
      doc,
      `Cout pour 1 000 vues : ${dt((campaign.price / totals.views) * 1000)}` +
        (totals.clicks > 0
          ? `      Cout par clic : ${dt(campaign.price / totals.clicks)}`
          : ""),
      M + 5,
      y + 9.5,
    )
    y += 18
  } else {
    y += 6
  }

  /* ── Space-by-space table ────────────────────────────────────────────── */
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

    // A space whose artwork was swapped reports each visual on its own line:
    // an average would hide the one that actually worked.
    const creatives = slotCreatives(slot, campaign)
    if (creatives.length > 1) {
      creatives.forEach((creative, i) => {
        y += 5
        doc.setTextColor(INK_MUTED)
        doc.setFont("helvetica", "normal").setFontSize(7.5)
        txt(
          doc,
          `${creativeLabel(i)}  ·  ${creative.from} - ${creative.to || "en cours"}`,
          M + 4,
          y,
        )
        txt(doc, num(creative.views), colViews, y, { align: "right" })
        txt(doc, num(creative.clicks), colClicks, y, { align: "right" })
        txt(doc, ctrOf(creative.views, creative.clicks), colCtr, y, {
          align: "right",
        })
      })
      y += 2
    }

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

  const filename = `rapport-${slug(campaign.name)}.pdf`
  doc.save(filename)
  return filename
}

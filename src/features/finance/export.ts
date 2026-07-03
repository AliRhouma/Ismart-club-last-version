/**
 * CSV export for the Transactions table. Reflects whatever set of rows it's
 * given — the screen passes either the current filtered view or the full season
 * (docs §4.8). Soft-deleted rows are never passed in. French-friendly output:
 * ';' separator + UTF-8 BOM so Excel opens accents correctly.
 */

import type {
  FinanceTeam,
  Group,
  StaffMember,
  SubCategory,
  Transaction,
} from "@/data/seed/finance"
import { categoryPath, scopeText } from "@/features/finance/helpers"

const HEADERS = [
  "Date",
  "Nature",
  "Groupe",
  "Sous-catégorie",
  "Portée",
  "Montant (TND)",
  "Paiement",
  "Libellé",
]

/** Quote a field and escape embedded quotes. */
const cell = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`

export function exportTransactionsCsv(
  rows: Transaction[],
  maps: {
    groups: Map<string, Group>
    subs: Map<string, SubCategory>
    teams: Map<string, FinanceTeam>
    staff: Map<string, StaffMember>
  },
  filename: string,
) {
  const lines = [HEADERS.map(cell).join(";")]
  for (const tx of rows) {
    const { group, sub } = categoryPath(tx, maps.groups, maps.subs)
    // Signed amount: revenus positive, dépenses negative — useful in a sheet.
    const signed = tx.nature === "Revenu" ? tx.amount : -tx.amount
    lines.push(
      [
        cell(tx.date),
        cell(tx.nature),
        cell(group),
        cell(sub),
        cell(scopeText(tx, maps.teams, maps.staff)),
        cell(signed),
        cell(tx.payment_method ?? ""),
        cell(tx.label ?? ""),
      ].join(";"),
    )
  }

  const blob = new Blob(["﻿" + lines.join("\r\n")], {
    type: "text/csv;charset=utf-8",
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

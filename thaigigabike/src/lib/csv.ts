// CSV helpers — shared by all admin export functions.
// escapeCsvCell prefixes dangerous formula starters with a single quote
// so spreadsheet applications treat the value as literal text.

export function escapeCsvCell(value: unknown): string {
  const raw = value == null ? '' : String(value)
  const dangerous = /^[=+\-@\t\r\n]/.test(raw)
  const safe = dangerous ? `'${raw}` : raw
  return `"${safe.replace(/"/g, '""')}"`
}

export function toCsvRow(cells: unknown[]): string {
  return cells.map(escapeCsvCell).join(',')
}

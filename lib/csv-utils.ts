/**
 * parseCSVLine — Mem-parsing satu baris CSV dengan menangani
 * quoted fields (koma di dalam tanda petik) dan escaped quotes ("").
 *
 * Fungsi ini digunakan di server (bulk-import.ts) dan client
 * (bulk-import-form.tsx) agar konsisten — fix di satu tempat
 * otomatis berlaku di kedua sisi.
 */
export function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  result.push(current.trim())
  return result
}

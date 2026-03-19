import * as XLSX from 'xlsx'

export function exportToExcel(
  rows: Record<string, string | number | boolean | null | undefined>[],
  fileName: string,
  sheetName = 'Sheet1',
) {
  const workbook = XLSX.utils.book_new()
  const worksheet = XLSX.utils.json_to_sheet(rows)
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
  XLSX.writeFile(workbook, fileName)
}

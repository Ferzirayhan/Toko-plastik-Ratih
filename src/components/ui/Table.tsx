import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { cn } from '../../utils/cn'
import { Button } from './Button'
import { Skeleton } from './Skeleton'

export interface TableColumn<T> {
  key: keyof T | string
  header: string
  sortable?: boolean
  className?: string
  render?: (row: T) => ReactNode
}

interface TableProps<T> {
  data: T[]
  columns: TableColumn<T>[]
  loading?: boolean
  emptyTitle?: string
  emptyDescription?: string
  pageSize?: number
}

export function Table<T extends Record<string, unknown>>({
  data,
  columns,
  loading = false,
  emptyTitle = 'Belum ada data',
  emptyDescription = 'Data akan muncul di sini setelah tersedia.',
  pageSize = 10,
}: TableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [page, setPage] = useState(1)

  const sortedData = useMemo(() => {
    if (!sortKey) {
      return data
    }

    return [...data].sort((left, right) => {
      const leftValue = left[sortKey as keyof T]
      const rightValue = right[sortKey as keyof T]

      if (leftValue === rightValue) {
        return 0
      }

      if (leftValue === undefined || leftValue === null) {
        return 1
      }

      if (rightValue === undefined || rightValue === null) {
        return -1
      }

      if (leftValue > rightValue) {
        return sortDirection === 'asc' ? 1 : -1
      }

      return sortDirection === 'asc' ? -1 : 1
    })
  }, [data, sortDirection, sortKey])

  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const paginatedData = sortedData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  )

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection((value) => (value === 'asc' ? 'desc' : 'asc'))
      return
    }

    setSortKey(key)
    setSortDirection('asc')
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-outline-variant/30 bg-surface-container-lowest">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="min-w-full border-collapse">
          <thead className="bg-surface-container-low">
            <tr>
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className={cn(
                    'px-4 py-4 text-left text-xs font-bold uppercase tracking-[0.16em] text-outline',
                    column.className,
                  )}
                >
                  {column.sortable ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(String(column.key))}
                      className="inline-flex items-center gap-2"
                    >
                      <span>{column.header}</span>
                      <span className="text-[10px] text-outline">
                        {sortKey === column.key
                          ? sortDirection === 'asc'
                            ? '▲'
                            : '▼'
                          : '↕'}
                      </span>
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index} className="border-t border-outline-variant/20">
                    {columns.map((_, columnIndex) => (
                      <td key={`${index}-${columnIndex}`} className="px-4 py-4">
                        <Skeleton className="h-5 w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              : null}
            {!loading && paginatedData.length > 0
              ? paginatedData.map((row, rowIndex) => (
                  <tr
                    key={rowIndex}
                    className="border-t border-outline-variant/20 transition hover:bg-surface"
                  >
                    {columns.map((column) => (
                      <td
                        key={String(column.key)}
                        className={cn(
                          'px-4 py-4 text-sm text-on-surface',
                          column.className,
                        )}
                      >
                        {column.render
                          ? column.render(row)
                          : String(row[column.key as keyof T] ?? '-')}
                      </td>
                    ))}
                  </tr>
                ))
              : null}
          </tbody>
        </table>
      </div>

      {!loading && paginatedData.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
          <div className="rounded-full bg-surface-container-high px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-outline">
            Empty state
          </div>
          <h3 className="mt-4 text-xl font-bold text-on-surface">{emptyTitle}</h3>
          <p className="mt-2 max-w-md text-sm leading-7 text-outline">
            {emptyDescription}
          </p>
        </div>
      ) : null}

      {!loading && sortedData.length > 0 ? (
        <div className="flex items-center justify-between border-t border-outline-variant/20 px-4 py-4">
          <p className="text-sm text-outline">
            Menampilkan {(currentPage - 1) * pageSize + 1}-
            {Math.min(currentPage * pageSize, sortedData.length)} dari {sortedData.length} data
          </p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
            >
              Sebelumnya
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
            >
              Berikutnya
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

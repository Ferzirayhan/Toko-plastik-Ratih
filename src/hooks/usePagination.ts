import { useMemo, useState } from 'react'

export function usePagination(totalItems: number, initialPage = 1, pageSize = 10) {
  const [page, setPage] = useState(initialPage)

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalItems / pageSize)),
    [pageSize, totalItems],
  )

  const safePage = Math.min(page, totalPages)

  return {
    page: safePage,
    pageSize,
    totalPages,
    setPage,
    nextPage: () => setPage((currentPage) => Math.min(currentPage + 1, totalPages)),
    previousPage: () => setPage((currentPage) => Math.max(currentPage - 1, 1)),
  }
}

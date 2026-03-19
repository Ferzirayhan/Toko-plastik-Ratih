import { useReactToPrint } from 'react-to-print'

interface UsePrintOptions {
  contentRef: React.RefObject<HTMLElement | null>
  documentTitle?: string
}

export function usePrint({ contentRef, documentTitle }: UsePrintOptions) {
  return useReactToPrint({
    contentRef,
    documentTitle,
  })
}

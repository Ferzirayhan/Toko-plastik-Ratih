import { useReactToPrint } from 'react-to-print'
import { receiptPrintPageStyle } from '../components/pos/ReceiptPrint'

interface UsePrintOptions {
  contentRef: React.RefObject<HTMLElement | null>
  documentTitle?: string
}

export function usePrint({ contentRef, documentTitle }: UsePrintOptions) {
  return useReactToPrint({
    contentRef,
    documentTitle,
    pageStyle: receiptPrintPageStyle,
  })
}

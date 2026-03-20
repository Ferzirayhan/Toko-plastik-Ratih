import { useReactToPrint } from 'react-to-print'
import { receiptPrintPageStyle } from '../components/pos/ReceiptPrint'
import { supabase } from '../lib/supabase'

interface UsePrintOptions {
  contentRef: React.RefObject<HTMLElement | null>
  documentTitle?: string
}

export function usePrint({ contentRef, documentTitle }: UsePrintOptions) {
  return useReactToPrint({
    contentRef,
    documentTitle,
    pageStyle: receiptPrintPageStyle,
    onAfterPrint: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user || !documentTitle) {
        return
      }

      await supabase.from('audit_logs').insert({
        user_id: user.id,
        entity_type: 'transaction',
        entity_id: documentTitle,
        action: 'receipt_reprint',
        description: `Struk ${documentTitle} dicetak ulang.`,
        metadata: {
          nomor_nota: documentTitle,
        },
      })
    },
  })
}

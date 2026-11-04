import { toast } from 'sonner'
import { undoTransactions } from '@/app/actions/transactions'
import { ActionState } from '@/app/lib/definitions'
import { notifyDataChanged } from '@/hooks/data'

export interface ActionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialUsername?: string
}

const euroFormat = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
  signDisplay: 'negative',
})

export const formatCents = (cents: number) => euroFormat.format(cents / 100)

// Backend balances count debt, so the displayed balance is inverted.
export const displayBalance = (balance: number) => formatCents(-balance)

export const toastWithUndo = (
  title: string,
  session: string,
  transactionIds: number[],
  description?: string,
) => {
  toast.success(title, {
    description,
    action: {
      label: 'Undo',
      onClick: () => {
        void (async () => {
          const errors = await undoTransactions(session, transactionIds)

          if (errors.length === 0) {
            toast.success('Booking has been undone')
          } else {
            toast.error('Error(s) while undoing booking', {
              description: errors.join(', '),
            })
          }

          notifyDataChanged()
        })()
      },
    },
  })
}

export const FormErrors = ({ state }: { state: ActionState }) => {
  const messages = [
    ...Object.values(state.errors ?? {}).flat(),
    state.message,
  ].filter((message): message is string => !!message)

  if (messages.length === 0) return null

  return <p className="text-xs text-red-400">{messages.join(', ')}</p>
}

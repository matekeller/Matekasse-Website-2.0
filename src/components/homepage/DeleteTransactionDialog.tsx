'use client'
import { useState } from 'react'
import { toast } from 'sonner'
import { undoTransactions } from '@/app/actions/transactions'
import { refreshSharedData } from '@/hooks/data'
import { useSession } from '@/hooks/session'
import {
  ListedTransaction,
  formatTransactionTime,
  getTransactionAmountCents,
  getTransactionTitle,
} from '@/lib/transactionDisplay'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { formatCents } from '@/components/admin/actions/shared'

interface DeleteTransactionDialogProps {
  transaction: ListedTransaction | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeleted: (transactionIds: number[]) => void
}

export const DeleteTransactionDialog = (
  props: DeleteTransactionDialogProps,
) => {
  const { transaction, open, onOpenChange, onDeleted } = props

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {transaction !== null && (
          <DeleteTransactionForm
            transaction={transaction}
            onClose={() => onOpenChange(false)}
            onDeleted={onDeleted}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

interface DeleteTransactionFormProps {
  transaction: ListedTransaction
  onClose: () => void
  onDeleted: (transactionIds: number[]) => void
}

const DeleteTransactionForm = (props: DeleteTransactionFormProps) => {
  const { transaction, onClose, onDeleted } = props
  const { session } = useSession()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const payout = transaction.transferPayout
  const transactionIds =
    payout === undefined ? [transaction.id] : [transaction.id, payout.id]

  const deleteTransaction = async () => {
    if (session === undefined) return

    setPending(true)
    setError(null)

    const deletedIds: number[] = []
    const errors: string[] = []

    for (const transactionId of transactionIds) {
      const undoErrors = await undoTransactions(session, [transactionId])
      if (undoErrors.length === 0) deletedIds.push(transactionId)
      errors.push(...undoErrors)
    }

    setPending(false)

    if (deletedIds.length > 0) {
      onDeleted(deletedIds)
      refreshSharedData()
    }

    if (errors.length === 0) {
      toast.success(
        payout === undefined ? 'Transaction deleted' : 'Transfer deleted',
      )
      onClose()
    } else if (deletedIds.length > 0) {
      // The list now shows the remaining booking on its own.
      toast.error('Only part of the transfer has been deleted', {
        description: errors.join(', '),
      })
      onClose()
    } else {
      setError(errors.join(', '))
    }
  }

  return (
    <div className="grid gap-4">
      <DialogHeader>
        <DialogTitle>
          {payout === undefined ? 'Delete transaction?' : 'Delete transfer?'}
        </DialogTitle>
        <DialogDescription>
          {payout === undefined ?
            `It no longer counts towards @${transaction.payerUsername}'s balance.`
          : `It no longer counts towards the balances of @${payout.payerUsername} and @${transaction.payerUsername}.`
          }{' '}
          This cannot be undone.
        </DialogDescription>
      </DialogHeader>

      <div className="flex items-center justify-between gap-3 rounded-md border p-3">
        <div className="grid min-w-0">
          <span className="truncate font-medium">
            {getTransactionTitle(transaction)}
          </span>
          <span className="text-xs text-muted-foreground">
            {payout === undefined ?
              `@${transaction.payerUsername}`
            : `@${payout.payerUsername} → @${transaction.payerUsername}`}{' '}
            · {formatTransactionTime(transaction.timestamp)}
          </span>
        </div>
        <span className="shrink-0 text-lg font-semibold">
          {formatCents(getTransactionAmountCents(transaction))}
        </span>
      </div>

      {error !== null && <p className="text-xs text-red-400">{error}</p>}

      <DialogFooter>
        <Button
          type="button"
          variant="secondary"
          onClick={onClose}
          disabled={pending}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="destructive"
          onClick={() => void deleteTransaction()}
          disabled={pending || session === undefined}
        >
          {pending ? 'Deleting…' : 'Delete'}
        </Button>
      </DialogFooter>
    </div>
  )
}

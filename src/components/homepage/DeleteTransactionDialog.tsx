'use client'
import { useState } from 'react'
import { toast } from 'sonner'
import { undoTransactions } from '@/app/actions/transactions'
import { Transaction } from '@/app/page'
import { refreshSharedData } from '@/hooks/data'
import { useSession } from '@/hooks/session'
import {
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
  transaction: Transaction | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeleted: (transactionId: number) => void
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
  transaction: Transaction
  onClose: () => void
  onDeleted: (transactionId: number) => void
}

const DeleteTransactionForm = (props: DeleteTransactionFormProps) => {
  const { transaction, onClose, onDeleted } = props
  const { session } = useSession()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const deleteTransaction = async () => {
    if (session === undefined) return

    setPending(true)
    setError(null)
    const errors = await undoTransactions(session, [transaction.id])
    setPending(false)

    if (errors.length > 0) {
      setError(errors.join(', '))
      return
    }

    toast.success('Transaction deleted')
    onDeleted(transaction.id)
    refreshSharedData()
    onClose()
  }

  return (
    <div className="grid gap-4">
      <DialogHeader>
        <DialogTitle>Delete transaction?</DialogTitle>
        <DialogDescription>
          It no longer counts towards @{transaction.payerUsername}&apos;s
          balance. This cannot be undone.
        </DialogDescription>
      </DialogHeader>

      <div className="flex items-center justify-between gap-3 rounded-md border p-3">
        <div className="grid min-w-0">
          <span className="truncate font-medium">
            {getTransactionTitle(transaction)}
          </span>
          <span className="text-xs text-muted-foreground">
            @{transaction.payerUsername} ·{' '}
            {formatTransactionTime(transaction.timestamp)}
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

'use client'
import { ArrowDownUp } from 'lucide-react'
import { useActionState, useEffect, useState } from 'react'
import {
  ACTION_DIALOG_CLASS,
  ActionDialogProps,
  FormErrors,
  displayBalance,
  formatCents,
  toastWithUndo,
} from './shared'
import { UserPicker } from './UserPicker'
import { topup, transfer } from '@/app/actions/transactions'
import { BookingState } from '@/app/lib/definitions'
import { notifyDataChanged, useUsers } from '@/hooks/data'
import { useSession } from '@/hooks/session'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

const QUICK_AMOUNTS_EUROS = [5, 10, 20, 50]

type Mode = 'credit' | 'debit' | 'transfer'

const MODES: Record<Mode, { label: string; description: string }> = {
  credit: {
    label: 'Top up',
    description: 'Credit money a user has handed over.',
  },
  debit: {
    label: 'Pay out',
    description: 'Debit money that is paid out to a user.',
  },
  transfer: {
    label: 'Transfer',
    description: 'Move credit from one user to another.',
  },
}

const book = (state: BookingState, formData: FormData) =>
  formData.get('direction') === 'transfer' ?
    transfer(state, formData)
  : topup(state, formData)

export const TopupDialog = (props: ActionDialogProps) => {
  const { open, onOpenChange } = props

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={ACTION_DIALOG_CLASS}>
        <TopupForm {...props} />
      </DialogContent>
    </Dialog>
  )
}

const TopupForm = (props: ActionDialogProps) => {
  const { initialUsername, onOpenChange } = props
  const { session } = useSession()
  const { users } = useUsers()

  const [mode, setMode] = useState<Mode>('credit')
  // Pays in a transfer.
  const [username, setUsername] = useState(initialUsername ?? null)
  const [recipient, setRecipient] = useState<string | null>(null)
  const [amount, setAmount] = useState('')
  const [state, formAction, pending] = useActionState<BookingState, FormData>(
    book,
    {},
  )

  const isTransfer = mode === 'transfer'
  const user = users?.find((candidate) => candidate.username === username)
  const recipientUser = users?.find(
    (candidate) => candidate.username === recipient,
  )
  const amountCents = Math.round(Number(amount) * 100)
  const isValidAmount = Number.isFinite(amountCents) && amountCents > 0
  const bookedCents = isValidAmount ? amountCents : 0
  // Backend balances count debt, so credit lowers them.
  const userCreditCents = mode === 'credit' ? bookedCents : -bookedCents
  const isComplete =
    user !== undefined &&
    (!isTransfer || (recipientUser !== undefined && recipient !== username))

  useEffect(() => {
    if (!state.transactionIds?.length || session === undefined) return

    const amountText = formatCents(amountCents)

    if (!state.success) {
      // Only the payout of the transfer is booked. Topping up the recipient
      // completes it, transferring again would debit twice.
      toastWithUndo(
        `Debited ${amountText} from @${username ?? ''}`,
        session,
        state.transactionIds,
        `Top up @${recipient ?? ''} to complete the transfer.`,
      )
      notifyDataChanged()
      setMode('credit')
      setUsername(recipient)
      setRecipient(null)
      return
    }

    toastWithUndo(
      isTransfer ?
        `Transferred ${amountText} from @${username ?? ''} to @${recipient ?? ''}`
      : `${mode === 'credit' ? 'Topped up' : 'Paid out'} ${amountText} for @${username ?? ''}`,
      session,
      state.transactionIds,
    )
    notifyDataChanged()
    onOpenChange(false)
  }, [state])

  return (
    <form action={formAction} className="grid gap-4">
      <input type="hidden" name="session" value={session ?? ''} />
      <input type="hidden" name="payer" value={username ?? ''} />
      <input type="hidden" name="recipient" value={recipient ?? ''} />
      <input type="hidden" name="direction" value={mode} />

      <DialogHeader>
        <DialogTitle>{MODES[mode].label}</DialogTitle>
        <DialogDescription>{MODES[mode].description}</DialogDescription>
      </DialogHeader>

      <Tabs value={mode} onValueChange={setMode}>
        <TabsList className="w-full">
          {Object.entries(MODES).map(([value, { label }]) => (
            <TabsTrigger key={value} value={value} disabled={pending}>
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {isTransfer ?
        <div className="grid gap-1">
          <UserPicker
            label="From"
            users={users}
            value={username}
            onChange={setUsername}
            disabled={pending}
          />
          <div className="flex justify-center">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => {
                setUsername(recipient)
                setRecipient(username)
              }}
              disabled={pending}
              aria-label="Swap users"
            >
              <ArrowDownUp />
            </Button>
          </div>
          <UserPicker
            label="To"
            users={users?.filter(
              (candidate) => candidate.username !== username,
            )}
            value={recipient}
            onChange={setRecipient}
            disabled={pending}
          />
        </div>
      : <UserPicker
          users={users}
          value={username}
          onChange={setUsername}
          disabled={pending}
        />
      }

      <div className="grid gap-2">
        <Label htmlFor="topup-amount">Amount in €</Label>
        <Input
          id="topup-amount"
          name="amount"
          type="number"
          inputMode="decimal"
          min="0.01"
          step="0.01"
          placeholder="0,00"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          disabled={pending}
        />
        <div className="grid grid-cols-4 gap-2">
          {QUICK_AMOUNTS_EUROS.map((quickAmount) => (
            <Button
              key={quickAmount}
              type="button"
              variant="secondary"
              size="sm"
              className="pointer-coarse:h-10"
              onClick={() => setAmount(String(quickAmount))}
              disabled={pending}
            >
              {formatCents(quickAmount * 100)}
            </Button>
          ))}
        </div>
      </div>

      {isTransfer ?
        (user ?? recipientUser) && (
          <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-1 text-sm">
            {user && (
              <BalanceRow
                label={`New balance of @${user.username}`}
                balance={user.balance - userCreditCents}
              />
            )}
            {recipientUser && (
              <BalanceRow
                label={`New balance of @${recipientUser.username}`}
                balance={recipientUser.balance - bookedCents}
              />
            )}
          </div>
        )
      : user && (
          <div className="grid grid-cols-2 gap-1 text-sm">
            <span className="text-muted-foreground">Current balance</span>
            <span className="text-right">{displayBalance(user.balance)}</span>
            <BalanceRow
              label="New balance"
              balance={user.balance - userCreditCents}
            />
          </div>
        )
      }

      <FormErrors state={state} />

      <DialogFooter>
        <Button
          type="button"
          variant="secondary"
          onClick={() => onOpenChange(false)}
          disabled={pending}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={
            pending || !isValidAmount || !isComplete || session === undefined
          }
        >
          {pending ?
            'Booking…'
          : `${MODES[mode].label}${isValidAmount ? ' ' + formatCents(amountCents) : ''}`
          }
        </Button>
      </DialogFooter>
    </form>
  )
}

const BalanceRow = ({ label, balance }: { label: string; balance: number }) => (
  <>
    <span className="truncate text-muted-foreground">{label}</span>
    <span className="text-right font-semibold">{displayBalance(balance)}</span>
  </>
)

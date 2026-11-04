'use client'
import { useActionState, useEffect, useState } from 'react'
import { OfferingGrid, OfferingQuantities, countItems } from './OfferingGrid'
import {
  ACTION_DIALOG_CLASS,
  ActionDialogProps,
  FormErrors,
  displayBalance,
  formatCents,
  toastWithUndo,
} from './shared'
import { UserPicker } from './UserPicker'
import { purchase } from '@/app/actions/transactions'
import { BookingState, MAX_PURCHASE_ITEMS } from '@/app/lib/definitions'
import { notifyDataChanged, useOfferings, useUsers } from '@/hooks/data'
import { useSession } from '@/hooks/session'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'

export const PurchaseDialog = (props: ActionDialogProps) => {
  const { open, onOpenChange } = props

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn('sm:max-w-2xl', ACTION_DIALOG_CLASS)}>
        <PurchaseForm {...props} />
      </DialogContent>
    </Dialog>
  )
}

const PurchaseForm = (props: ActionDialogProps) => {
  const { initialUsername, onOpenChange } = props
  const { session } = useSession()
  const { users } = useUsers()
  const { offerings, errors: offeringErrors } = useOfferings()

  const [username, setUsername] = useState(initialUsername ?? null)
  const [quantities, setQuantities] = useState<OfferingQuantities>({})
  const [state, formAction, pending] = useActionState<BookingState, FormData>(
    purchase,
    {},
  )

  const user = users?.find((candidate) => candidate.username === username)
  const itemCount = countItems(quantities)
  const items = Object.entries(quantities).map(([product, quantity]) => ({
    product,
    quantity: quantity ?? 0,
  }))
  const totalCents = items.reduce(
    (sum, item) =>
      sum +
      (offerings?.find((offering) => offering.name === item.product)
        ?.priceCents ?? 0) *
        item.quantity,
    0,
  )

  const describe = (bookedItems: { product: string; quantity: number }[]) =>
    bookedItems
      .map(
        (item) =>
          `${item.quantity} × ${offerings?.find((offering) => offering.name === item.product)?.readableName ?? item.product}`,
      )
      .join(', ')

  useEffect(() => {
    if (!state.transactionIds?.length || session === undefined) return

    const bookedItems = state.bookedItems ?? []
    toastWithUndo(
      `Booked ${state.transactionIds.length} ${state.transactionIds.length === 1 ? 'item' : 'items'} for @${username ?? ''}`,
      session,
      state.transactionIds,
      describe(bookedItems),
    )
    notifyDataChanged()

    if (state.success) {
      onOpenChange(false)
      return
    }

    // Keep only what still needs booking so a retry does not double-book.
    const booked = new Map(
      bookedItems.map((item) => [item.product, item.quantity]),
    )
    setQuantities((cur) =>
      Object.fromEntries(
        Object.entries(cur)
          .map(
            ([product, quantity]) =>
              [product, (quantity ?? 0) - (booked.get(product) ?? 0)] as const,
          )
          .filter(([, remaining]) => remaining > 0),
      ),
    )
  }, [state])

  return (
    <form action={formAction} className="grid gap-4">
      <input type="hidden" name="session" value={session ?? ''} />
      <input type="hidden" name="payer" value={username ?? ''} />
      <input type="hidden" name="items" value={JSON.stringify(items)} />

      <DialogHeader>
        <DialogTitle>Offering purchase</DialogTitle>
        <DialogDescription>
          The selected offerings are charged to the user&apos;s balance.
        </DialogDescription>
      </DialogHeader>

      <UserPicker
        users={users}
        value={username}
        onChange={setUsername}
        disabled={pending}
      />

      <div className="grid gap-2">
        <Label>Offerings</Label>
        {offeringErrors && (
          <p className="text-xs text-red-400">{offeringErrors.join(', ')}</p>
        )}
        <OfferingGrid
          offerings={offerings}
          quantities={quantities}
          onChange={setQuantities}
          maxItems={MAX_PURCHASE_ITEMS}
          disabled={pending}
        />
      </div>

      <div className="flex items-end justify-between gap-4">
        <div className="grid text-sm text-muted-foreground">
          <span>
            {itemCount === 0 ?
              'No offerings selected'
            : `${itemCount} ${itemCount === 1 ? 'item' : 'items'} selected`}
          </span>
          {user && (
            <span>
              New balance:{' '}
              <span className="font-semibold text-foreground">
                {displayBalance(user.balance + totalCents)}
              </span>
            </span>
          )}
        </div>
        <div className="text-right">
          <div className="text-sm text-muted-foreground">Total</div>
          <div className="text-2xl font-extrabold">
            {formatCents(totalCents)}
          </div>
        </div>
      </div>

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
            pending || itemCount === 0 || !user || session === undefined
          }
        >
          {pending ?
            'Booking…'
          : `Book ${itemCount === 0 ? '' : `${itemCount} `}${itemCount === 1 ? 'item' : 'items'}`
          }
        </Button>
      </DialogFooter>
    </form>
  )
}

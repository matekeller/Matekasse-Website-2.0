import {
  BookingState,
  PurchaseFormSchema,
  TopupFormSchema,
} from '../lib/definitions'
import {
  purchase as purchaseMatekasse,
  topup as topupMatekasse,
  undoPurchase as undoMatekassePurchase,
} from '../db/db'

export const topup = async (
  state: BookingState,
  formData: FormData,
): Promise<BookingState> => {
  const validatedFields = TopupFormSchema.safeParse({
    payer: formData.get('payer'),
    amount: formData.get('amount'),
    direction: formData.get('direction'),
    session: formData.get('session'),
  })

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors }
  }

  const {
    payer,
    amount: amountCents,
    direction,
    session,
  } = validatedFields.data

  const topupResponse = await topupMatekasse(
    session,
    payer,
    direction === 'credit' ? -amountCents : amountCents,
  )

  if (topupResponse.data == null) {
    return {
      message:
        'An error occurred while booking the top-up: ' +
        (topupResponse.errors?.join(', ') ?? 'unknown error'),
    }
  }

  return { success: true, transactionIds: [topupResponse.data.id] }
}

export const purchase = async (
  state: BookingState,
  formData: FormData,
): Promise<BookingState> => {
  const validatedFields = PurchaseFormSchema.safeParse({
    payer: formData.get('payer'),
    items: formData.get('items'),
    session: formData.get('session'),
  })

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors }
  }

  const { payer, items, session } = validatedFields.data
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

  // The backend books one item per call.
  const transactionIds: number[] = []
  const bookedItems: { product: string; quantity: number }[] = []

  for (const item of items) {
    for (let i = 0; i < item.quantity; i++) {
      const purchaseResponse = await purchaseMatekasse(
        session,
        payer,
        item.product,
      )

      if (purchaseResponse.data == null) {
        return {
          message:
            `Booked ${transactionIds.length} of ${itemCount} items. ` +
            'An error occurred while booking the transaction: ' +
            (purchaseResponse.errors?.join(', ') ?? 'unknown error'),
          transactionIds,
          bookedItems:
            i === 0 ? bookedItems : (
              [...bookedItems, { product: item.product, quantity: i }]
            ),
        }
      }

      transactionIds.push(purchaseResponse.data.id)
    }

    bookedItems.push(item)
  }

  return { success: true, transactionIds, bookedItems }
}

export const undoTransactions = async (
  session: string,
  transactionIds: number[],
): Promise<string[]> => {
  const errors: string[] = []

  for (const transactionId of transactionIds) {
    const undoResponse = await undoMatekassePurchase(session, transactionId)

    if (undoResponse.data == null) {
      errors.push(
        ...(undoResponse.errors ?? [
          `Error while undoing transaction ${transactionId}`,
        ]),
      )
    }
  }

  return errors
}

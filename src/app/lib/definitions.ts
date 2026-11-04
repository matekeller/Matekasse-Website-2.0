import { z } from 'zod'

// Parses a form field that carries JSON.
const jsonString = () =>
  z.string().transform((value, ctx): unknown => {
    try {
      return JSON.parse(value)
    } catch {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Invalid JSON' })
      return z.NEVER
    }
  })

export const LoginFormSchema = z.object({
  username: z.string().trim(),
  password: z.string().trim(),
})

export type FormState =
  | {
      message?: string
    }
  | undefined

export const UpdateBluecardIDFormSchema = z.object({
  oldBluecardID: z.string().trim(),
  newBluecardID: z.string().trim().min(1, 'Enter a bluecard ID'),
  session: z.string().trim(),
})

export const UpdateInventoryFormSchema = z.object({
  movements: jsonString(),
  session: z.string().trim(),
})

export const UpdateOfferingFormSchema = z.object({
  offeringName: z.string().trim(),
  newReadableName: z.string().trim().optional(),
  newPriceCents: z.coerce.number().optional(),
  newImageUrl: z.string().trim().optional(),
  newColor: z.string().trim().optional(),
  newDiscontinued: z
    .string()
    .trim()
    .toLowerCase()
    .transform((x) => x === 'true')
    .pipe(z.boolean())
    .optional(),
  newDiscount: z
    .string()
    .trim()
    .toLowerCase()
    .transform((x) => x === 'true')
    .pipe(z.boolean())
    .optional(),
  newIsFood: z
    .string()
    .trim()
    .toLowerCase()
    .transform((x) => x === 'true')
    .pipe(z.boolean())
    .optional(),
  session: z.string().trim(),
})

export const TopupFormSchema = z.object({
  payer: z.string().trim().min(1, 'Select a user'),
  amount: z.coerce
    .number({ invalid_type_error: 'Enter a valid amount' })
    .transform((euros) => Math.round(euros * 100))
    .refine((cents) => cents > 0, 'Amount must be at least 0,01 €'),
  direction: z.enum(['credit', 'debit']),
  session: z.string().trim(),
})

export const MAX_PURCHASE_ITEMS = 50

export const PurchaseFormSchema = z.object({
  payer: z.string().trim().min(1, 'Select a user'),
  items: jsonString().pipe(
    z
      .array(
        z.object({
          product: z.string().min(1),
          quantity: z.number().int().min(1),
        }),
      )
      .min(1, 'Select at least one offering')
      .refine(
        (items) =>
          items.reduce((sum, item) => sum + item.quantity, 0) <=
          MAX_PURCHASE_ITEMS,
        `At most ${MAX_PURCHASE_ITEMS} items per booking`,
      ),
  ),
  session: z.string().trim(),
})

export const RegisterFormSchema = z.object({
  fullName: z.string().trim().min(1, 'Enter a full name'),
  username: z
    .string()
    .trim()
    .min(1, 'Enter a username')
    .regex(/^\S+$/, 'Username must not contain spaces'),
  bluecardId: z.string().trim().min(1, 'Enter a bluecard ID'),
  password: z.string().min(1, 'Enter a password'),
  session: z.string().trim(),
})

export interface ActionState {
  success?: boolean
  message?: string
  errors?: Record<string, string[] | undefined>
}

export interface BookingState extends ActionState {
  transactionIds?: number[]
  bookedItems?: { product: string; quantity: number }[]
}

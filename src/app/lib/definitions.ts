import { z } from 'zod'
import { zu } from 'zod_utilz'

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
  newBluecardID: z.string().trim(),
  session: z.string().trim(),
})

export const UpdateInventoryFormSchema = z.object({
  movements: zu.stringToJSON(),
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

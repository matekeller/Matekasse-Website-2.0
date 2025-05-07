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

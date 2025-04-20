import { z } from 'zod'

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

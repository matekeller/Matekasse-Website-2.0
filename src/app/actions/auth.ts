import { mutate } from 'swr'
import { z } from 'zod'
import { FormState, LoginFormSchema } from '../lib/definitions'
import { createMatekasseSession } from '../db/db'
import { deleteSession, saveSession } from '../lib/session'

export const login = async (state: FormState, formData: FormData) => {
  const validatedFields = LoginFormSchema.safeParse({
    username: formData.get('username'),
    password: formData.get('password'),
  })

  if (!validatedFields.success) {
    return {
      errors: z.flattenError(validatedFields.error).fieldErrors,
    }
  }

  const { username, password } = validatedFields.data

  const loginResponse = await createMatekasseSession(username, password)

  if (loginResponse?.tokens != null) {
    await saveSession(loginResponse.tokens)
    await mutate('/api/session', loginResponse.tokens.accessToken)
  } else {
    return {
      message:
        'An error occurred while logging in: ' + loginResponse?.errors?.join(),
    }
  }
}

export const logout = async () => {
  await deleteSession()
  await mutate('/api/session', undefined)
}

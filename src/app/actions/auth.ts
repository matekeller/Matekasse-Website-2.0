import { FormState, LoginFormSchema } from '../lib/definitions'
import { logIntoMatekasse } from '../db/db'
import { deleteSession, getSession, saveSession } from '../lib/session'
import { mutate } from 'swr'

export async function login(state: FormState, formData: FormData) {
  const validatedFields = LoginFormSchema.safeParse({
    username: formData.get('username'),
    password: formData.get('password'),
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  const { username, password } = validatedFields.data

  const loginResponse = await logIntoMatekasse(username, password)

  if (loginResponse?.jwt !== null && loginResponse?.jwt !== undefined) {
    await saveSession(loginResponse.jwt)
    await getSession()
    await mutate('/api/session', loginResponse.jwt)
  } else {
    return {
      message:
        'An error occurred while logging in: ' + loginResponse?.errors?.join(),
    }
  }
}

export async function logout() {
  await deleteSession()
  await mutate('/api/session', undefined)
}

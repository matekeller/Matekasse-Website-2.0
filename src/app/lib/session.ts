'use server'

import { cookies } from 'next/headers'
import { jwtDecode } from 'jwt-decode'
import { DateTime } from 'luxon'

export const saveSession = async (jwt: string): Promise<void> => {
  const cookieStore = await cookies()

  cookieStore.set('matekasseJWT', jwt)
}

export const getSession = async (): Promise<string | undefined> => {
  const cookieStore = await cookies()
  const mateCookie = cookieStore.get('matekasseJWT')
  if (mateCookie !== undefined) {
    try {
      const jwtPayload = jwtDecode(mateCookie.value)

      if (DateTime.fromSeconds(Number(jwtPayload.exp)) <= DateTime.now()) {
        cookieStore.delete('matekasseJWT')
        return undefined
      }

      return mateCookie.value
    } catch (error) {
      console.error('Error while verifying session.', error)
    }
  }
  return undefined
}

export const deleteSession = async (): Promise<void> => {
  const cookieStore = await cookies()
  const mateCookie = cookieStore.get('matekasseJWT')

  if (mateCookie !== undefined) {
    cookieStore.delete('matekasseJWT')
  }
}

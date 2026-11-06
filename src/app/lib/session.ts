'use server'

import { cookies } from 'next/headers'
import { jwtDecode } from 'jwt-decode'
import { DateTime } from 'luxon'
import {
  AuthTokens,
  refreshMatekasseSession,
  revokeMatekasseSession,
} from '../db/db'

export const saveSession = async (tokens: AuthTokens): Promise<void> => {
  const cookieStore = await cookies()

  const options = {
    expires: DateTime.now().plus({ hours: 24 }).toJSDate(),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
  }
  cookieStore.set('matekasseJWT', tokens.accessToken, options)
  cookieStore.set('matekasseRefreshToken', tokens.refreshToken, options)
}

export const getSession = async (): Promise<string | undefined> => {
  const cookieStore = await cookies()
  const mateCookie = cookieStore.get('matekasseJWT')
  let accessTokenValid = false
  if (mateCookie !== undefined) {
    try {
      const jwtPayload = jwtDecode(mateCookie.value)
      accessTokenValid =
        jwtPayload.exp !== undefined &&
        DateTime.fromSeconds(jwtPayload.exp) > DateTime.now()

      if (
        accessTokenValid &&
        jwtPayload.exp !== undefined &&
        DateTime.fromSeconds(jwtPayload.exp) >
          DateTime.now().plus({ seconds: 60 })
      ) {
        return mateCookie.value
      }
    } catch (error) {
      console.error('Error while verifying session.', error)
    }
  }

  const refreshToken = cookieStore.get('matekasseRefreshToken')?.value
  if (refreshToken !== undefined) {
    const tokens = await refreshMatekasseSession(refreshToken)
    if (tokens !== null) {
      await saveSession(tokens)
      return tokens.accessToken
    }
    return accessTokenValid ? mateCookie?.value : undefined
  }
  cookieStore.delete('matekasseJWT')
  return undefined
}

export const deleteSession = async (): Promise<void> => {
  const cookieStore = await cookies()
  const refreshToken = cookieStore.get('matekasseRefreshToken')?.value
  if (refreshToken !== undefined) {
    await revokeMatekasseSession(refreshToken)
  }
  cookieStore.delete('matekasseJWT')
  cookieStore.delete('matekasseRefreshToken')
}

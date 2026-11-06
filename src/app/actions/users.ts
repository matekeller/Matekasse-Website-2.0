import { z } from 'zod'
import {
  ActionState,
  RegisterFormSchema,
  UpdateBluecardIDFormSchema,
} from '../lib/definitions'
import {
  registerUser,
  updateBluecardID as updateMatekasseBluecardID,
} from '../db/db'

export const updateBluecardID = async (
  state: ActionState,
  formData: FormData,
): Promise<ActionState> => {
  const validatedFields = UpdateBluecardIDFormSchema.safeParse({
    oldBluecardID: formData.get('oldBluecardID'),
    newBluecardID: formData.get('newBluecardID'),
    session: formData.get('session'),
  })

  if (!validatedFields.success) {
    return {
      errors: z.flattenError(validatedFields.error).fieldErrors,
    }
  }

  const { oldBluecardID, newBluecardID, session } = validatedFields.data

  const updateBluecardIDResponse = await updateMatekasseBluecardID(
    session,
    oldBluecardID,
    newBluecardID,
  )

  if (updateBluecardIDResponse.data?.updateBluecardId !== 'updated') {
    return {
      message:
        'An error occurred while updating bluecard ID: ' +
        (updateBluecardIDResponse.errors?.join(', ') ?? 'unknown error'),
    }
  }
  return { success: true }
}

export const register = async (
  state: ActionState,
  formData: FormData,
): Promise<ActionState> => {
  const validatedFields = RegisterFormSchema.safeParse({
    fullName: formData.get('fullName'),
    username: formData.get('username'),
    bluecardId: formData.get('bluecardId'),
    password: formData.get('password'),
    session: formData.get('session'),
  })

  if (!validatedFields.success) {
    return { errors: z.flattenError(validatedFields.error).fieldErrors }
  }

  const { fullName, username, bluecardId, password, session } =
    validatedFields.data

  const registerResponse = await registerUser(
    session,
    username,
    fullName,
    bluecardId,
    password,
  )

  if (registerResponse.data == null) {
    return {
      message:
        'An error occurred while creating the account: ' +
        (registerResponse.errors?.join(', ') ?? 'unknown error'),
    }
  }

  return { success: true }
}

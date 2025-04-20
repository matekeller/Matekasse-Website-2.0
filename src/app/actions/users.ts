import { FormState, UpdateBluecardIDFormSchema } from '../lib/definitions'
import { updateBluecardID as updateMatekasseBluecardID } from '../db/db'

export const updateBluecardID = async (
  state: FormState,
  formData: FormData,
) => {
  const validatedFields = UpdateBluecardIDFormSchema.safeParse({
    oldBluecardID: formData.get('oldBluecardID'),
    newBluecardID: formData.get('newBluecardID'),
    session: formData.get('session'),
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
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
        updateBluecardIDResponse.errors?.join(),
    }
  }
  return { message: 'success' }
}

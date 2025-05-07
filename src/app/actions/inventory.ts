import { FormState, UpdateInventoryFormSchema } from '../lib/definitions'
import { updateInventory as updateMatekasseInventory } from '../db/db'

export const updateInventory = async (state: FormState, formData: FormData) => {
  const validatedFields = UpdateInventoryFormSchema.safeParse({
    movements: formData.get('movements'),
    session: formData.get('session'),
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  const { movements, session } = validatedFields.data

  const updateBluecardIDResponse = await updateMatekasseInventory(
    session,
    movements as { offeringId: string; amount: number }[],
  )

  if (updateBluecardIDResponse.data?.updateInventory !== 'updated') {
    return {
      message:
        'An error occurred while updating bluecard ID: ' +
        updateBluecardIDResponse.errors?.join(),
    }
  }
  return { message: 'success' }
}

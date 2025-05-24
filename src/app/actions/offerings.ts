import { FormState, UpdateOfferingFormSchema } from '../lib/definitions'
import { updateOffering as updateMatekasseOffering } from '../db/db'

export const updateOffering = async (state: FormState, formData: FormData) => {
  const validatedFields = UpdateOfferingFormSchema.safeParse({
    offeringName: formData.get('offeringName'),
    newReadableName: formData.get('newReadableName'),
    newPriceCents: formData.get('newPriceCents'),
    newImageUrl: formData.get('newImageUrl'),
    newColor: formData.get('newColor'),
    newDiscontinued: formData.get('newDiscontinued'),
    newDiscount: formData.get('newDiscount'),
    newIsFood: formData.get('newIsFood'),
    session: formData.get('session'),
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  const {
    offeringName,
    newReadableName,
    newPriceCents,
    newImageUrl,
    newColor,
    newDiscontinued,
    newDiscount,
    newIsFood,
    session,
  } = validatedFields.data

  console.log(validatedFields.data)

  const updateOfferingResponse = await updateMatekasseOffering(
    session,
    offeringName,
    newReadableName,
    newPriceCents,
    newImageUrl,
    newColor,
    newDiscontinued,
    newDiscount,
    newIsFood,
  )

  if (updateOfferingResponse.data?.updateOffering !== 'changed') {
    return {
      message:
        'An error occurred while updating an offering: ' +
        updateOfferingResponse.errors?.join(),
    }
  }
  return { message: 'success' }
}

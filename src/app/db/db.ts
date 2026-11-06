import * as gql from 'gql-query-builder'
import { assert } from '@/lib/utils'

export interface DBOffering {
  name: string
  readableName: string
  priceCents: number
  imageUrl: string | null
  inInventory: number
  discounted: boolean
  discontinued: boolean
  isFood: boolean
  color: string
}

export interface DBUser {
  username: string
  fullName: string
  bluecardId: string
  isAdmin: boolean
  smartcards: { smartcardId: string }[]
  balance: number
}

export interface DBTransactionsPage {
  edges: {
    node: DBTransaction
  }[]
  pageInfo: { endCursor: number; hasNextPage: boolean }
}

export interface DBTransaction {
  id: number
  payer: { username: string }
  admin: { username: string }
  offeringId: string
  pricePaidCents: number
  timestamp: string
  deleted: boolean
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

interface CreateSessionResponse {
  data: { createSession: AuthTokens } | null
  errors?: { message: string }[]
}

export const createMatekasseSession = async (
  username: string,
  password: string,
): Promise<{
  tokens: AuthTokens | null
  errors?: string[]
} | null> => {
  try {
    const response = await fetchBackend(
      { Accept: 'application/json' },
      JSON.stringify(
        gql.mutation({
          operation: 'createSession',
          variables: { username, password: password },
          fields: ['accessToken', 'refreshToken', 'expiresIn'],
        }),
      ),
    )

    if (response.ok && response.status === 200) {
      const rsp = (await response.json()) as CreateSessionResponse

      if (rsp.errors !== undefined && rsp.data == null) {
        return {
          tokens: null,
          errors: rsp.errors.map((error: { message: string }) => error.message),
        }
      }

      assert(rsp.data != null)

      return { tokens: rsp.data.createSession }
    } else {
      const rsp = (await response.json()) as CreateSessionResponse

      assert(rsp.errors != null)

      return {
        tokens: null,
        errors: rsp.errors.map((error: { message: string }) => error.message),
      }
    }
  } catch (e) {
    console.error(e)
    return {
      tokens: null,
      errors: ['Error while executing createSession request'],
    }
  }
}

export const refreshMatekasseSession = async (
  refreshToken: string,
): Promise<AuthTokens | null> => {
  try {
    const response = await fetch('https://api.matekasse.de/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(
        gql.mutation({
          operation: 'refreshSession',
          variables: { refreshToken },
          fields: ['accessToken', 'refreshToken', 'expiresIn'],
        }),
      ),
    })
    const result = (await response.json()) as {
      data?: { refreshSession: AuthTokens }
      errors?: { message: string }[]
    }
    return response.ok && !result.errors ?
        (result.data?.refreshSession ?? null)
      : null
  } catch (error) {
    console.error('Error while refreshing session.', error)
    return null
  }
}

export const revokeMatekasseSession = async (
  refreshToken: string,
): Promise<void> => {
  try {
    await fetch('https://api.matekasse.de/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(
        gql.mutation({
          operation: 'signOut',
          variables: { refreshToken },
          fields: [],
        }),
      ),
    })
  } catch (error) {
    console.error('Error while signing out.', error)
  }
}

interface AllTransactionsResponse {
  data: {
    transactionsPaginated: {
      edges: {
        node: {
          id: number
          payer: {
            username: string
          }
          admin: {
            username: string
          }
          timestamp: string
          offeringId: string
          pricePaidCents: number
          deleted: boolean
        }
      }[]
      pageInfo: {
        endCursor: number
        hasNextPage: boolean
      }
    }
  } | null
  errors?: { message: string }[]
}

export const fetchAllTransactions = async (
  jwt: string,
  cursor?: number,
): Promise<{
  data: DBTransactionsPage | null
  errors?: string[]
}> => {
  try {
    const response = await fetchBackend(
      { Accept: 'application/json', Authorization: jwt },
      JSON.stringify(
        gql.query({
          operation: 'transactionsPaginated',
          variables: { after: cursor ?? 1000000, first: 10 },
          fields: [
            {
              operation: 'edges',
              fields: [
                {
                  operation: 'node',
                  fields: [
                    'id',
                    {
                      operation: 'payer',
                      fields: ['username'],
                      variables: {},
                    },
                    {
                      operation: 'admin',
                      fields: ['username'],
                      variables: {},
                    },
                    'offeringId',
                    'pricePaidCents',
                    'timestamp',
                    'deleted',
                  ],
                  variables: {},
                },
              ],
              variables: {},
            },
            {
              operation: 'pageInfo',
              fields: ['endCursor', 'hasNextPage'],
              variables: {},
            },
          ],
        }),
      ),
    )

    if (response.ok && response.status === 200) {
      const rsp = (await response.json()) as AllTransactionsResponse

      if (rsp.errors !== undefined) {
        return {
          data: null,
          errors: rsp.errors.map((error: { message: string }) => error.message),
        }
      }

      assert(rsp.data != null)

      return { data: rsp.data.transactionsPaginated }
    } else {
      const rsp = (await response.json()) as AllTransactionsResponse

      return {
        data: null,
        errors: rsp.errors?.map((error: { message: string }) => error.message),
      }
    }
  } catch (e) {
    console.error(e)
    return { data: null, errors: ['Error while fetching all transactions'] }
  }
}

interface OwnTransactionsResponse {
  data: {
    me: {
      transactionsPaginated: {
        edges: {
          node: {
            id: number
            payer: {
              username: string
            }
            admin: {
              username: string
            }
            timestamp: string
            offeringId: string
            pricePaidCents: number
            deleted: boolean
          }
        }[]
        pageInfo: {
          endCursor: number
          hasNextPage: boolean
        }
      }
    }
  } | null
  errors?: { message: string }[]
}

export const fetchOwnTransactions = async (
  jwt: string,
  cursor?: number,
): Promise<{
  data: DBTransactionsPage | null
  errors?: string[]
}> => {
  try {
    const response = await fetchBackend(
      { Accept: 'application/json', Authorization: jwt },
      JSON.stringify(
        gql.query({
          operation: 'me',
          fields: [
            {
              operation: 'transactionsPaginated',
              variables: { after: cursor ?? 1000000, first: 10 },
              fields: [
                {
                  operation: 'edges',
                  fields: [
                    {
                      operation: 'node',
                      fields: [
                        'id',
                        {
                          operation: 'payer',
                          fields: ['username'],
                          variables: {},
                        },
                        {
                          operation: 'admin',
                          fields: ['username'],
                          variables: {},
                        },
                        'offeringId',
                        'pricePaidCents',
                        'timestamp',
                        'deleted',
                      ],
                      variables: {},
                    },
                  ],
                  variables: {},
                },
                {
                  operation: 'pageInfo',
                  fields: ['endCursor', 'hasNextPage'],
                  variables: {},
                },
              ],
            },
          ],
        }),
      ),
    )

    if (response.ok && response.status === 200) {
      const rsp = (await response.json()) as OwnTransactionsResponse

      if (rsp.errors !== undefined) {
        return {
          data: null,
          errors: rsp.errors.map((error: { message: string }) => error.message),
        }
      }

      assert(rsp.data != null)

      return { data: rsp.data.me.transactionsPaginated }
    } else {
      const rsp = (await response.json()) as OwnTransactionsResponse

      return {
        data: null,
        errors: rsp.errors?.map((error: { message: string }) => error.message),
      }
    }
  } catch (e) {
    console.error(e)
    return { data: null, errors: ['Error while fetching own transactions'] }
  }
}

interface UserTransactionsResponse {
  data: {
    transactionsByUser: {
      id: number
      payer: {
        username: string
      }
      admin: {
        username: string
      }
      timestamp: string
      offeringId: string
      pricePaidCents: number
      deleted: boolean
    }[]
  } | null
  errors?: { message: string }[]
}

export const fetchUserTransactions = async (
  jwt: string,
  username: string,
): Promise<{
  data: DBTransaction[] | null
  errors?: string[]
}> => {
  try {
    const response = await fetchBackend(
      { Accept: 'application/json', Authorization: jwt },
      JSON.stringify(
        gql.query({
          operation: 'transactionsByUser',
          variables: { username },
          fields: [
            'id',
            {
              operation: 'payer',
              fields: ['username'],
              variables: {},
            },
            {
              operation: 'admin',
              fields: ['username'],
              variables: {},
            },
            'offeringId',
            'pricePaidCents',
            'timestamp',
            'deleted',
          ],
        }),
      ),
    )

    if (response.ok && response.status === 200) {
      const rsp = (await response.json()) as UserTransactionsResponse

      if (rsp.errors !== undefined) {
        return {
          data: null,
          errors: rsp.errors.map((error: { message: string }) => error.message),
        }
      }

      assert(rsp.data != null)

      return { data: rsp.data.transactionsByUser }
    } else {
      const rsp = (await response.json()) as UserTransactionsResponse

      return {
        data: null,
        errors: rsp.errors?.map((error: { message: string }) => error.message),
      }
    }
  } catch (e) {
    console.error(e)
    return { data: null, errors: ['Error while fetching own transactions'] }
  }
}

interface OfferingsResponse {
  data: {
    offerings: {
      name: string
      readableName: string
      priceCents: number
      imageUrl: string | null
      inInventory: number
      discontinued: boolean
      discounted: boolean
      isFood: boolean
      color: string
    }[]
  } | null
  errors?: { message: string }[]
}

export const fetchOfferings = async (): Promise<{
  data: DBOffering[] | null
  errors?: string[]
}> => {
  try {
    const response = await fetchBackend(
      { Accept: 'application/json' },
      JSON.stringify(
        gql.query({
          operation: 'offerings',
          fields: [
            'name',
            'readableName',
            'priceCents',
            'imageUrl',
            'inInventory',
            'discontinued',
            'discounted',
            'isFood',
            'color',
          ],
          variables: {},
        }),
      ),
    )

    if (response.ok && response.status === 200) {
      const rsp = (await response.json()) as OfferingsResponse

      if (rsp.errors !== undefined) {
        return {
          data: null,
          errors: rsp.errors.map((error: { message: string }) => error.message),
        }
      }

      assert(rsp.data != null)

      return { data: rsp.data.offerings }
    } else {
      const rsp = (await response.json()) as OfferingsResponse

      return {
        data: null,
        errors: rsp.errors?.map((error: { message: string }) => error.message),
      }
    }
  } catch (e) {
    console.error(e)
    return { data: null, errors: ['Error while fetching offerings'] }
  }
}

interface OwnUserInfoResponse {
  data: {
    me: {
      username: string
      fullName: string
      balance: number
      isAdmin: boolean
    }
  } | null
  errors?: { message: string }[]
}

export const fetchOwnUserInfo = async (
  jwt: string,
): Promise<{
  data: {
    username: string
    fullName: string
    balance: number
    isAdmin: boolean
  } | null
  errors?: string[]
}> => {
  try {
    const response = await fetchBackend(
      { Accept: 'application/json', Authorization: jwt },
      JSON.stringify(
        gql.query({
          operation: 'me',
          fields: ['username', 'fullName', 'balance', 'isAdmin'],
          variables: {},
        }),
      ),
    )

    if (response.ok && response.status === 200) {
      const rsp = (await response.json()) as OwnUserInfoResponse

      if (rsp.errors !== undefined) {
        return {
          data: null,
          errors: rsp.errors.map((error: { message: string }) => error.message),
        }
      }

      assert(rsp.data != null)

      return { data: rsp.data.me }
    } else {
      const rsp = (await response.json()) as OwnUserInfoResponse

      return {
        data: null,
        errors: rsp.errors?.map((error: { message: string }) => error.message),
      }
    }
  } catch (e) {
    console.error(e)
    return { data: null, errors: ['Error while fetching own user info'] }
  }
}

interface UsersResponse {
  data: {
    users: DBUser[]
  } | null
  errors?: { message: string }[]
}

export const fetchUsers = async (
  jwt: string,
): Promise<{
  data: DBUser[] | null
  errors?: string[]
}> => {
  try {
    const response = await fetchBackend(
      { Accept: 'application/json', Authorization: jwt },
      JSON.stringify(
        gql.query({
          operation: 'users',
          fields: [
            'username',
            'fullName',
            'bluecardId',
            'isAdmin',
            { operation: 'smartcards', fields: ['smartcardId'], variables: {} },
            'balance',
          ],
          variables: {},
        }),
      ),
    )

    if (response.ok && response.status === 200) {
      const rsp = (await response.json()) as UsersResponse

      if (rsp.errors !== undefined) {
        return {
          data: null,
          errors: rsp.errors.map((error: { message: string }) => error.message),
        }
      }

      assert(rsp.data != null)

      return { data: rsp.data.users }
    } else {
      const rsp = (await response.json()) as UsersResponse

      return {
        data: null,
        errors: rsp.errors?.map((error: { message: string }) => error.message),
      }
    }
  } catch (e) {
    console.error(e)
    return { data: null, errors: ['Error while fetching users'] }
  }
}

interface UpdateBluecardIDResponse {
  data: {
    updateBluecardId: 'updated'
  } | null
  errors?: { message: string }[]
}

export const updateBluecardID = async (
  jwt: string,
  oldBluecardID: string,
  newBluecardID: string,
): Promise<{
  data: { updateBluecardId: 'updated' } | null
  errors?: string[]
}> => {
  try {
    const response = await fetchBackend(
      { Accept: 'application/json', Authorization: jwt },
      JSON.stringify(
        gql.mutation({
          operation: 'updateBluecardId',
          variables: {
            bluecardIdOld: oldBluecardID,
            bluecardIdNew: newBluecardID,
          },
          fields: [],
        }),
      ),
    )

    if (response.ok && response.status === 200) {
      const rsp = (await response.json()) as UpdateBluecardIDResponse

      if (rsp.errors !== undefined) {
        return {
          data: null,
          errors: rsp.errors.map((error: { message: string }) => error.message),
        }
      }

      assert(rsp.data != null)

      return { data: rsp.data }
    } else {
      const rsp = (await response.json()) as UpdateBluecardIDResponse

      return {
        data: null,
        errors: rsp.errors?.map((error: { message: string }) => error.message),
      }
    }
  } catch (e) {
    console.error(e)
    return { data: null, errors: ['Error while updating Bluecard ID'] }
  }
}

interface UpdateInventoryResponse {
  data: {
    updateInventory: 'updated'
  } | null
  errors?: { message: string }[]
}

export const updateInventory = async (
  jwt: string,
  updates: { offeringId: string; amount: number }[],
): Promise<{
  data: { updateInventory: 'updated' } | null
  errors?: string[]
}> => {
  try {
    const response = await fetchBackend(
      { Accept: 'application/json', Authorization: jwt },
      JSON.stringify(
        gql.mutation({
          operation: 'updateInventory',
          variables: {
            updates: {
              value: updates,
              required: true,
              list: true,
              type: 'InventoryUpdate',
            },
          },
          fields: [],
        }),
      ),
    )

    if (response.ok && response.status === 200) {
      const rsp = (await response.json()) as UpdateInventoryResponse

      if (rsp.errors !== undefined) {
        return {
          data: null,
          errors: rsp.errors.map((error: { message: string }) => error.message),
        }
      }

      assert(rsp.data != null)

      return { data: rsp.data }
    } else {
      const rsp = (await response.json()) as UpdateInventoryResponse

      return {
        data: null,
        errors: rsp.errors?.map((error: { message: string }) => error.message),
      }
    }
  } catch (e) {
    console.error(e)
    return { data: null, errors: ['Error while updating inventory'] }
  }
}

interface UpdateOfferingResponse {
  data: {
    updateOffering: 'changed'
  } | null
  errors?: { message: string }[]
}

export const updateOffering = async (
  jwt: string,
  offeringName: string,
  newReadableName?: string,
  newPriceCents?: number,
  newImageUrl?: string,
  newColor?: string,
  newDiscontinued?: boolean,
  newDiscount?: boolean,
  newIsFood?: boolean,
): Promise<{
  data: { updateOffering: 'changed' } | null
  errors?: string[]
}> => {
  const fields: Map<string, string | number | boolean> = new Map<
    string,
    string | number | boolean
  >().set('offeringName', offeringName)

  if (newReadableName !== undefined) {
    fields.set('newReadableName', newReadableName)
  }
  if (newPriceCents !== undefined) {
    fields.set('newPriceCents', newPriceCents)
  }
  if (newImageUrl !== undefined) {
    fields.set('newImageUrl', newImageUrl)
  }
  if (newColor !== undefined) {
    fields.set('newColor', newColor)
  }
  if (newDiscontinued !== undefined) {
    fields.set('newDiscontinued', newDiscontinued)
  }
  if (newDiscount !== undefined) {
    fields.set('newDiscount', newDiscount)
  }
  if (newIsFood !== undefined) {
    fields.set('newIsFood', newIsFood)
  }

  try {
    const response = await fetchBackend(
      { Accept: 'application/json', Authorization: jwt },
      JSON.stringify(
        gql.mutation({
          operation: 'updateOffering',
          variables: Object.fromEntries(fields),
          fields: [],
        }),
      ),
    )

    if (response.ok && response.status === 200) {
      const rsp = (await response.json()) as UpdateOfferingResponse

      if (rsp.errors !== undefined) {
        return {
          data: null,
          errors: rsp.errors.map((error: { message: string }) => error.message),
        }
      }

      assert(rsp.data != null)

      return { data: rsp.data }
    } else {
      const rsp = (await response.json()) as UpdateOfferingResponse

      return {
        data: null,
        errors: rsp.errors?.map((error: { message: string }) => error.message),
      }
    }
  } catch (e) {
    console.error(e)
    return { data: null, errors: ['Error while updating offering'] }
  }
}

interface PurchaseResponse {
  data: {
    purchase: { id: number }
  } | null
  errors?: { message: string }[]
}

export const purchase = async (
  jwt: string,
  payer: string,
  product: string,
): Promise<{
  data: { id: number } | null
  errors?: string[]
}> => {
  try {
    const response = await fetchBackend(
      { Accept: 'application/json', Authorization: jwt },
      JSON.stringify(
        gql.mutation({
          operation: 'purchase',
          variables: {
            payer: { value: payer, required: true },
            product: { value: product, required: true },
          },
          fields: ['id'],
        }),
      ),
    )

    if (response.ok && response.status === 200) {
      const rsp = (await response.json()) as PurchaseResponse

      if (rsp.errors !== undefined) {
        return {
          data: null,
          errors: rsp.errors.map((error: { message: string }) => error.message),
        }
      }

      assert(rsp.data != null)

      return { data: rsp.data.purchase }
    } else {
      const rsp = (await response.json()) as PurchaseResponse

      return {
        data: null,
        errors: rsp.errors?.map((error: { message: string }) => error.message),
      }
    }
  } catch (e) {
    console.error(e)
    return { data: null, errors: ['Error while booking purchase'] }
  }
}

interface TopupResponse {
  data: {
    topup: { id: number }
  } | null
  errors?: { message: string }[]
}

// Positive amountCents credit the balance, negative ones debit it.
export const topup = async (
  jwt: string,
  payer: string,
  amountCents: number,
): Promise<{
  data: { id: number } | null
  errors?: string[]
}> => {
  try {
    const response = await fetchBackend(
      { Accept: 'application/json', Authorization: jwt },
      JSON.stringify(
        gql.mutation({
          operation: 'topup',
          variables: {
            payer: { value: payer, required: true },
            amountCents: { value: amountCents, required: true, type: 'Int' },
          },
          fields: ['id'],
        }),
      ),
    )

    if (response.ok && response.status === 200) {
      const rsp = (await response.json()) as TopupResponse

      if (rsp.errors !== undefined) {
        return {
          data: null,
          errors: rsp.errors.map((error: { message: string }) => error.message),
        }
      }

      assert(rsp.data != null)

      return { data: rsp.data.topup }
    } else {
      const rsp = (await response.json()) as TopupResponse

      return {
        data: null,
        errors: rsp.errors?.map((error: { message: string }) => error.message),
      }
    }
  } catch (e) {
    console.error(e)
    return { data: null, errors: ['Error while booking top-up'] }
  }
}

interface UndoPurchaseResponse {
  data: {
    undoPurchase: string
  } | null
  errors?: { message: string }[]
}

export const undoPurchase = async (
  jwt: string,
  transactionId: number,
): Promise<{
  data: { undoPurchase: string } | null
  errors?: string[]
}> => {
  try {
    const response = await fetchBackend(
      { Accept: 'application/json', Authorization: jwt },
      JSON.stringify(
        gql.mutation({
          operation: 'undoPurchase',
          variables: {
            transactionId: {
              value: transactionId,
              required: true,
              type: 'Int',
            },
          },
          fields: [],
        }),
      ),
    )

    if (response.ok && response.status === 200) {
      const rsp = (await response.json()) as UndoPurchaseResponse

      if (rsp.errors !== undefined) {
        return {
          data: null,
          errors: rsp.errors.map((error: { message: string }) => error.message),
        }
      }

      assert(rsp.data != null)

      return { data: rsp.data }
    } else {
      const rsp = (await response.json()) as UndoPurchaseResponse

      return {
        data: null,
        errors: rsp.errors?.map((error: { message: string }) => error.message),
      }
    }
  } catch (e) {
    console.error(e)
    return { data: null, errors: ['Error while undoing transaction'] }
  }
}

interface RegisterResponse {
  data: {
    register: string
  } | null
  errors?: { message: string }[]
}

export const registerUser = async (
  jwt: string,
  username: string,
  fullName: string,
  bluecardId: string,
  password: string,
): Promise<{
  data: { register: string } | null
  errors?: string[]
}> => {
  try {
    const response = await fetchBackend(
      { Accept: 'application/json', Authorization: jwt },
      JSON.stringify(
        gql.mutation({
          operation: 'register',
          variables: {
            username: { value: username, required: true },
            fullName: { value: fullName, required: true },
            bluecardId: { value: bluecardId, required: true },
            password: { value: password, required: true },
          },
          fields: [],
        }),
      ),
    )

    if (response.ok && response.status === 200) {
      const rsp = (await response.json()) as RegisterResponse

      if (rsp.errors !== undefined) {
        return {
          data: null,
          errors: rsp.errors.map((error: { message: string }) => error.message),
        }
      }

      assert(rsp.data != null)

      return { data: rsp.data }
    } else {
      const rsp = (await response.json()) as RegisterResponse

      return {
        data: null,
        errors: rsp.errors?.map((error: { message: string }) => error.message),
      }
    }
  } catch (e) {
    console.error(e)
    return { data: null, errors: ['Error while registering user'] }
  }
}

const fetchBackend = async (
  headers: Record<string, string>,
  body: string,
): Promise<Response> => {
  const url =
    process.env.NODE_ENV === 'development' ?
      '/api/proxy/graphql'
    : 'https://api.matekasse.de/graphql'

  return fetch(url, { method: 'POST', headers, body })
}

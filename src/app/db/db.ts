import * as gql from 'gql-query-builder'
import { assert } from '@/lib/utils'

export interface DBOffering {
  name: string
  readableName: string
  priceCents: number
  imageUrl: string
  inInventory: number
  discounted: boolean
  discontinued: boolean
  isFood: boolean
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

interface SignInResponse {
  data: { signIn: string } | null
  errors?: { message: string }[]
}

export const logIntoMatekasse = async (
  username: string,
  password: string,
): Promise<{
  jwt: string | null
  errors?: string[]
} | null> => {
  try {
    const response = await fetchBackend(
      { Accept: 'application/json' },
      JSON.stringify(
        gql.mutation({
          operation: 'signIn',
          variables: { username, password: password },
          fields: [],
        }),
      ),
    )

    if (response.ok && response.status === 200) {
      const rsp = (await response.json()) as SignInResponse

      if (rsp.errors !== undefined && rsp.data == null) {
        return {
          jwt: null,
          errors: rsp.errors.map((error: { message: string }) => error.message),
        }
      }

      assert(rsp.data != null)

      return { jwt: rsp.data.signIn }
    } else {
      const rsp = (await response.json()) as SignInResponse

      assert(rsp.errors != null)

      return {
        jwt: null,
        errors: rsp.errors.map((error: { message: string }) => error.message),
      }
    }
  } catch (e) {
    console.error(e)
    return { jwt: null, errors: ['Error while executing signIn request'] }
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
      imageUrl: string
      inInventory: number
      discontinued: boolean
      discounted: boolean
      isFood: boolean
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
    users: {
      username: string
      fullName: string
      bluecardId: string
      isAdmin: boolean
      smartcards: { smartcardId: string }[]
      balance: number
    }[]
  } | null
  errors?: { message: string }[]
}

export const fetchUsers = async (
  jwt: string,
): Promise<{
  data:
    | {
        username: string
        fullName: string
        bluecardId: string
        isAdmin: boolean
        smartcards: { smartcardId: string }[]
        balance: number
      }[]
    | null
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
      console.log(response)
      const rsp = (await response.json()) as UpdateInventoryResponse

      if (rsp.errors !== undefined) {
        console.log(rsp.errors)
        return {
          data: null,
          errors: rsp.errors.map((error: { message: string }) => error.message),
        }
      }

      assert(rsp.data != null)

      return { data: rsp.data }
    } else {
      const rsp = (await response.json()) as UpdateInventoryResponse

      console.log(rsp.errors)

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

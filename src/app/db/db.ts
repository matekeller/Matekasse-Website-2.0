import * as gql from "gql-query-builder";

export type DBOffering = {
  name: string;
  readableName: string;
  priceCents: number;
  imageUrl: string;
  inInventory: number;
  discounted: boolean;
  discontinued: boolean;
  isFood: boolean;
};

export type DBTransactionsPage = {
  edges: {
    node: DBTransaction;
  }[];
  pageInfo: { endCursor: number; hasNextPage: boolean };
};

export type DBTransaction = {
  id: number;
  admin: { username: string };
  offeringId: string;
  pricePaidCents: number;
  timestamp: string;
  deleted: boolean;
};

export const logIntoMatekasse = async (
  username: string,
  password: string
): Promise<{
  jwt: string | null;
  errors?: string[];
} | null> => {
  try {
    const response = await fetchBackend( 
      { Accept: "application/json" },
      JSON.stringify(
        gql.mutation({
          operation: "signIn",
          variables: { username, password: password },
          fields: [],
        })
      ),
    );

    if (response.ok && response.status === 200) {
      const rsp = await response.json();

      if (rsp.errors != undefined) {
        return {
          jwt: null,
          errors: rsp.errors.map((error: { message: string }) => error.message),
        };
      }

      return { jwt: rsp.data.signIn };
    } else {
      const rsp = await response.json();

      return {
        jwt: null,
        errors: rsp.errors.map((error: { message: string }) => error.message),
      };
    }
  } catch (e) {
    console.error(e);
    return { jwt: null, errors: ["Error while executing signIn request"] };
  }
};

export const fetchOwnTransactions = async (
  jwt: string,
  cursor?: number,
): Promise<{
  data: DBTransactionsPage | null;
  errors?: string[];
}> => {
  try {
    const response = await fetchBackend(
      { Accept: "application/json", Authorization: jwt },
      JSON.stringify(
        gql.query({
          operation: "me",
          fields: [
            {
              operation: "transactionsPaginated",
              variables: { after: cursor ?? 1000000, first: 10 },
              fields: [
                {
                  operation: "edges",
                  fields: [
                    {
                      operation: "node",
                      fields: [
                        "id",
                        {
                          operation: "admin",
                          fields: ["username"],
                          variables: {},
                        },
                        "offeringId",
                        "pricePaidCents",
                        "timestamp",
                        "deleted",
                      ],
                      variables: {},
                    },
                  ],
                  variables: {},
                },
                {
                  operation: "pageInfo",
                  fields: ["endCursor"],
                  variables: {},
                },
              ],
            },
          ],
        })
      ),
    );

    if (response.ok && response.status === 200) {
      const rsp = await response.json();

      console.log(rsp);

      if (rsp.errors != undefined) {
        return {
          data: null,
          errors: rsp.errors.map((error: { message: string }) => error.message),
        };
      }

      return { data: rsp.data.me?.transactionsPaginated ?? null };
    } else {
      const rsp = await response.json();

      return {
        data: null,
        errors: rsp.errors.map((error: { message: string }) => error.message),
      };
    }
  } catch (e) {
    console.error(e);
    return { data: null, errors: ["Error while fetching own transactions"] };
  }
};

export const fetchOfferings = async (): Promise<{
  data: DBOffering[] | null;
  errors?: string[];
}> => {
  try {
    const response = await fetchBackend(
     { Accept: "application/json" },
      JSON.stringify(
        gql.query({
          operation: "offerings",
          fields: [
            "name",
            "readableName",
            "priceCents",
            "imageUrl",
            "inInventory",
            "discontinued",
            "discounted",
            "isFood",
          ],
          variables: {},
        })
      ),
    );

    if (response.ok && response.status === 200) {
      const rsp = await response.json();

      if (rsp.errors != undefined) {
        return {
          data: null,
          errors: rsp.errors.map((error: { message: string }) => error.message),
        };
      }

      return { data: rsp.data.offerings };
    } else {
      const rsp = await response.json();

      return {
        data: null,
        errors: rsp.errors.map((error: { message: string }) => error.message),
      };
    }
  } catch (e) {
    console.error(e);
    return { data: null, errors: ["Error while fetching offerings"] };
  }
};

export const fetchOwnUserInfo = async (
  jwt: string
): Promise<{
  data: { username: string; fullName: string; balance: number } | null;
  errors?: string[];
}> => {
  try {
    const response = await fetchBackend(
       { Accept: "application/json", Authorization: jwt },
       JSON.stringify(
        gql.query({
          operation: "me",
          fields: ["username", "fullName", "balance"],
          variables: {},
        })
      ),
    );

    if (response.ok && response.status === 200) {
      const rsp = await response.json();

      if (rsp.errors != undefined) {
        return {
          data: null,
          errors: rsp.errors.map((error: { message: string }) => error.message),
        };
      }

      return { data: rsp.data.me };
    } else {
      const rsp = await response.json();

      return {
        data: null,
        errors: rsp.errors.map((error: { message: string }) => error.message),
      };
    }
  } catch (e) {
    console.error(e);
    return { data: null, errors: ["Error while own user info"] };
  }
};

const fetchBackend = async (headers: Record<string, string>, body: string): Promise<Response> => {
  const url = process.env.NODE_ENV === "development" ? "/api/proxy/graphql" : "https://api.matekasse.de/graphql"

  return fetch(url, { method: "POST", headers, body })
}
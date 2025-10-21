'use client'
import { redirect } from 'next/navigation'
import { Fragment, useActionState, useEffect, useState } from 'react'
import Image from 'next/image'
import { Minus, Plus } from 'lucide-react'
import { toast } from 'sonner'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { useSession } from '@/hooks/session'
import { DBOffering, fetchOfferings, fetchOwnUserInfo } from '@/app/db/db'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useIsMobile } from '@/hooks/use-mobile'
import { assert } from '@/lib/utils'
import { updateInventory } from '@/app/actions/inventory'
import { Toaster } from '@/components/ui/sonner'

export default function Page() {
  const { session } = useSession()
  const [inventory, setInventory] = useState<DBOffering[]>([])
  const [update, setUpdate] = useState(0)

  useEffect(() => {
    if (!session) return

    const fetchData = async () => {
      const userInfoData = await fetchOwnUserInfo(session)

      if (!userInfoData.data?.isAdmin) {
        redirect('/')
      }

      const offeringData = await fetchOfferings()

      if (offeringData.data === null) {
        return
      }

      setInventory(
        offeringData.data.toSorted((a, b) =>
          b.inInventory - a.inInventory === 0 ?
            a.readableName.localeCompare(b.readableName)
          : b.inInventory - a.inInventory,
        ),
      )
    }

    void fetchData()
  }, [session, update])

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 w-full">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink>Admin</BreadcrumbLink>
            </BreadcrumbItem>

            <BreadcrumbSeparator />

            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink>Inventory</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4">
        <ScrollArea>
          <InventoryArea
            inventory={inventory}
            session={session ?? ''}
            onUpdate={() => setUpdate((cur) => cur + 1)}
          />
        </ScrollArea>
      </div>
    </>
  )
}

interface InventoryAreaProps {
  inventory: DBOffering[]
  session: string
  onUpdate: () => void
}

const InventoryArea = (props: InventoryAreaProps) => {
  const { inventory, session, onUpdate } = props
  const [changes, setChanges] = useState<
    { offeringId: string; amount: string }[]
  >([])

  const initialState = { errors: {}, message: undefined }
  const [state, formAction, pending] = useActionState(
    updateInventory,
    initialState,
  )

  useEffect(() => {
    if (inventory.length !== 0 && changes.length === 0) {
      setChanges(
        inventory.map((item) => ({
          offeringId: item.name,
          amount: '0',
        })),
      )
    }
  }, [inventory, changes])

  useEffect(() => {
    if (
      !pending &&
      (state.message !== undefined ||
        state.errors.movements !== undefined ||
        state.errors.session !== undefined)
    ) {
      if (state.errors === undefined && state.message === 'success') {
        toast('Inventory has been successfully updated')
      } else {
        toast('Error(s) while updating inventory', {
          description:
            (state.errors?.movements?.join('\n') ?? '') +
            (state.errors?.session?.join('\n') ?? '') +
            state.message,
        })
      }
    }
  }, [state])

  return (
    <>
      {inventory
        .filter((inventoryItem) => !inventoryItem.discontinued)
        .map((inventoryItem, idx) => (
          <InventoryItemCard
            item={inventoryItem}
            idx={idx}
            key={idx}
            changes={changes}
            onUpdateChanges={(change) => setChanges(change)}
          />
        ))}

      {inventory.filter((inventoryItem) => inventoryItem.discontinued)
        .length !== 0 && (
        <div className="flex w-full justify-evenly">
          <Separator className="flex-1 self-center" />
          <span className="m-5">Discontinued offerings</span>
          <Separator className="flex-1 self-center" />
        </div>
      )}

      {inventory
        .filter((inventoryItem) => inventoryItem.discontinued)
        .map((inventoryItem, idx) => (
          <InventoryItemCard
            item={inventoryItem}
            idx={idx}
            key={idx}
            changes={changes}
            onUpdateChanges={(change) => setChanges(change)}
          />
        ))}

      {!hasNoChanges(changes) && (
        <form
          action={formAction}
          onSubmit={() => {
            onUpdate()
            setChanges([])
          }}
        >
          <input type="hidden" name="session" value={session} />
          <input
            type="hidden"
            name="movements"
            value={JSON.stringify(
              createInventoryMovements(sanitizeChanges(changes), inventory),
            )}
          />

          <Button
            className="fixed right-10 bottom-10"
            type="submit"
            disabled={pending}
          >
            {pending ? 'Saving…' : 'Save'}
          </Button>
        </form>
      )}

      <Toaster />
    </>
  )
}

interface InventoryItemCardProps {
  item: DBOffering
  idx: number
  changes: {
    offeringId: string
    amount: string
  }[]
  onUpdateChanges: (
    changes: {
      offeringId: string
      amount: string
    }[],
  ) => void
}

const InventoryItemCard = (props: InventoryItemCardProps) => {
  const { item, idx, changes, onUpdateChanges } = props
  const isMobile = useIsMobile()

  return (
    <Fragment>
      {idx !== 0 && <Separator />}
      <div
        className={`w-full flex p-4 ${isMobile ? 'flex-col gap-4' : 'flex-row justify-between'}`}
      >
        <div className="flex flex-row gap-2">
          <Image
            src={{
              src: item.imageUrl,
              height: 100,
              width: 100,
            }}
            alt={item.readableName}
          />
          <div className="flex flex-col">
            <span className="text-foreground font-semibold text-lg">
              {item.readableName}
            </span>
            <span>Amount: {item.inInventory}</span>
          </div>
        </div>

        <div className="flex flex-row gap-1">
          {isMobile && (
            <Button
              variant="outline"
              size="icon"
              onClick={() =>
                onUpdateChanges(applyChanges(changes, 'minus', item))
              }
            >
              <Minus />
            </Button>
          )}
          <Input
            className="self-center"
            type="number"
            value={
              changes.find((change) => change.offeringId === item.name)
                ?.amount ?? ''
            }
            onKeyDown={(event) => {
              const foundChange = changes.find(
                (change) => change.offeringId === item.name,
              )

              assert(foundChange !== undefined)
              if (
                event.code === 'Backspace' &&
                foundChange.amount.length ===
                  (Number.parseInt(foundChange.amount) < 0 ? 2 : 1)
              ) {
                onUpdateChanges(applyChanges(changes, 'set', item, ''))
              }
            }}
            onChange={(event) =>
              onUpdateChanges(
                applyChanges(changes, 'set', item, event.target.value),
              )
            }
          />
          {isMobile && (
            <Button
              variant="outline"
              size="icon"
              onClick={() =>
                onUpdateChanges(applyChanges(changes, 'plus', item))
              }
            >
              <Plus />
            </Button>
          )}
        </div>
      </div>
    </Fragment>
  )
}

const applyChanges = (
  cur: { offeringId: string; amount: string }[],
  mode: 'plus' | 'minus' | 'set',
  item: { name: string; inInventory: number },
  setValue?: string,
) => {
  const foundChange = cur.find((change) => change.offeringId === item.name)
  assert(foundChange !== undefined)

  return [
    ...cur.filter((change) => change.offeringId !== item.name),
    {
      offeringId: item.name,
      amount:
        mode === 'plus' ?
          Number.isNaN(foundChange.amount) || foundChange.amount === '' ?
            '1'
          : (Number.parseInt(foundChange.amount) + 1).toString()
        : mode === 'minus' ?
          Number.isNaN(foundChange.amount) || foundChange.amount === '' ?
            '-1'
          : (Number.parseInt(foundChange.amount) - 1).toString()
        : (setValue ?? ''),
    },
  ]
}

const hasNoChanges = (changes: { offeringId: string; amount: string }[]) => {
  return changes.every(
    (change) =>
      change.amount === '0' ||
      change.amount === '' ||
      Number.isNaN(change.amount),
  )
}

const sanitizeChanges = (
  changes: { offeringId: string; amount: string }[],
): { offeringId: string; amount: number }[] => {
  return changes
    .filter(
      (change) =>
        change.amount !== '0' &&
        change.amount !== '' &&
        !Number.isNaN(change.amount),
    )
    .map((change) => ({
      offeringId: change.offeringId,
      amount: Number.parseInt(change.amount),
    }))
}

const createInventoryMovements = (
  changes: { offeringId: string; amount: number }[],
  inventory: DBOffering[],
) => {
  const movement: { offeringId: string; amount: number }[] = []

  for (const change of changes) {
    const foundInventoryItem = inventory.find(
      (item) => item.name === change.offeringId,
    )
    assert(foundInventoryItem !== undefined)

    movement.push({
      offeringId: change.offeringId,
      amount: foundInventoryItem.inInventory + change.amount,
    })
  }

  return movement
}

'use client'
import Image from 'next/image'
import { Pencil } from 'lucide-react'
import { Fragment, useActionState, useEffect, useState } from 'react'
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../ui/card'
import { Separator } from '../ui/separator'
import { Button } from '../ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'
import { Label } from '../ui/label'
import { Input } from '../ui/input'
import { Checkbox } from '../ui/checkbox'
import { DBOffering } from '@/app/db/db'
import { updateOffering } from '@/app/actions/offerings'

export interface OfferingsAreaProps {
  isAdmin: boolean
  session: string | undefined
  offerings: DBOffering[]
  onUpdateOffering: () => void
}

export const OfferingsArea = (props: OfferingsAreaProps) => {
  const { isAdmin, session, onUpdateOffering } = props
  let { offerings } = props

  const offeringsDiscontinued = offerings.filter(
    (offering) => offering.discontinued,
  )

  offerings = offerings.filter((offering) => !offering.discontinued)

  return (
    <>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(auto-fill, minmax(clamp(0px, 350px, 100%), 1fr))',
          gap: '1em',
        }}
      >
        {getCards(offerings, isAdmin, onUpdateOffering, session)}
      </div>
      {isAdmin && (
        <>
          {offeringsDiscontinued.length !== 0 && (
            <div className="flex w-full justify-evenly">
              <Separator className="flex-1 self-center" />
              <span className="m-5">Discontinued offerings</span>
              <Separator className="flex-1 self-center" />
            </div>
          )}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fill, minmax(clamp(0px, 350px, 100%), 1fr))',
              gap: '1em',
            }}
          >
            {getCards(
              offeringsDiscontinued,
              isAdmin,
              onUpdateOffering,
              session,
            )}
          </div>
        </>
      )}
    </>
  )
}

const getCards = (
  offerings: DBOffering[],
  isAdmin: boolean,
  onUpdateOffering: () => void,
  session?: string,
) => {
  return offerings.map((offering) => {
    const [updateOfferingDialogOpen, setUpdateOfferingDialogOpen] =
      useState(false)

    return (
      <Fragment key={offering.name}>
        <UpdateOfferingDialog
          session={session}
          open={updateOfferingDialogOpen}
          offering={offering}
          onOpenChange={() => setUpdateOfferingDialogOpen(false)}
          onUpdate={onUpdateOffering}
        />
        <Card
          key={offering.name}
          className="relative grid flex-row"
          style={{ gridTemplateColumns: 'auto auto' }}
        >
          {isAdmin && (
            <Button
              variant="ghost"
              className="flex size-8 text-muted-foreground absolute right-2 top-2 z-10 "
              size="icon"
              onClick={() => setUpdateOfferingDialogOpen(true)}
            >
              <Pencil />
            </Button>
          )}
          <div className="flex flex-col justify-between">
            <CardHeader>
              <CardTitle>{offering.readableName}</CardTitle>
              <CardDescription>
                Currently in stock:{' '}
                <span style={{ fontWeight: 'bold' }}>
                  {offering.inInventory}
                </span>
              </CardDescription>
            </CardHeader>

            <CardFooter>
              <span
                className={`text-3xl font-extrabold ${
                  offering.discounted && !offering.discontinued ?
                    'text-red-700'
                  : 'text-foreground'
                }`}
              >
                {new Intl.NumberFormat('de-DE', {
                  style: 'currency',
                  currency: 'EUR',
                }).format(offering.priceCents / 100)}
              </span>
            </CardFooter>
          </div>

          <div className="flex items-center justify-right group justify-end">
            <div className="flex relative items-center justify-center right-3">
              <Image
                className="relative group-hover:animate-spin-slow-pulsate-cw max-w-none"
                src={{ src: '/star.svg', height: 150, width: 150 }}
                alt="decorative star"
              />
              <Image
                className="absolute group-hover:animate-spin-slow-ccw max-w-none"
                src={{ src: '/star2.svg', height: 135, width: 135 }}
                alt="decorative star2"
              />

              <Image
                className="rotate-25 group-hover:animate-wiggle absolute max-w-none"
                src={{
                  src: offering.imageUrl,
                  height: 120,
                  width: 120,
                }}
                alt={offering.name}
              />
            </div>
          </div>
        </Card>
      </Fragment>
    )
  })
}

interface UpdateOfferingDialogProps {
  open: boolean
  offering: DBOffering
  session?: string
  onOpenChange: () => void
  onUpdate: () => void
}

const UpdateOfferingDialog = (props: UpdateOfferingDialogProps) => {
  const { open, offering, session, onOpenChange, onUpdate } = props

  const initialState = { errors: {}, message: undefined }
  const [state, formAction, pending] = useActionState(
    updateOffering,
    initialState,
  )

  const [newDiscontinued, setNewDiscontinued] = useState(offering.discontinued)
  const [newDiscount, setNewDiscount] = useState(offering.discounted)
  const [newIsFood, setNewIsFood] = useState(offering.isFood)

  useEffect(() => {
    if (state.errors == null && state.message && !pending) {
      onOpenChange()
      onUpdate()
    }
  }, [state])

  return (
    <>
      {session !== undefined && (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent>
            <form action={formAction}>
              <input type="hidden" name="session" value={session} />
              <input type="hidden" name="offeringName" value={offering.name} />
              <input
                type="hidden"
                name="newDiscontinued"
                value={String(newDiscontinued)}
              />
              <input
                type="hidden"
                name="newDiscount"
                value={String(newDiscount)}
              />
              <input type="hidden" name="newIsFood" value={String(newIsFood)} />

              <div className="justify-start p-6">
                <DialogHeader>
                  <DialogTitle>Update Offering</DialogTitle>
                </DialogHeader>
              </div>
              <div className="flex flex-col gap-6 p-6">
                <div className="grid gap-4">
                  <Label htmlFor="newReadableName">Readable name</Label>
                  <Input
                    id="newReadableName"
                    name="newReadableName"
                    defaultValue={offering.readableName}
                    disabled={pending}
                  />

                  <Label htmlFor="newPriceCents">Price in cents</Label>
                  <Input
                    id="newPriceCents"
                    name="newPriceCents"
                    type="number"
                    defaultValue={offering.priceCents}
                    disabled={pending}
                  />

                  <Label htmlFor="newImageUrl">Image URL</Label>
                  <Input
                    id="newImageUrl"
                    name="newImageUrl"
                    defaultValue={offering.imageUrl}
                    disabled={pending}
                  />

                  <Label htmlFor="newColor">Color code</Label>
                  <Input
                    id="newColor"
                    name="newColor"
                    defaultValue={offering.color}
                    disabled={pending}
                  />
                </div>

                <div
                  className="grid gap-2"
                  style={{ gridTemplateColumns: 'auto auto' }}
                >
                  <Label htmlFor="newDiscontinued">Discontinued</Label>
                  <Checkbox
                    id="newDiscontinued"
                    checked={newDiscontinued}
                    onClick={() => setNewDiscontinued(!newDiscontinued)}
                    disabled={pending}
                  />

                  <Label htmlFor="newDiscount">Discount</Label>
                  <Checkbox
                    id="newDiscount"
                    checked={newDiscount}
                    onClick={() => setNewDiscount(!newDiscount)}
                    disabled={pending}
                  />

                  <Label htmlFor="newIsFood">Is food</Label>
                  <Checkbox
                    id="newIsFood"
                    checked={newIsFood}
                    onClick={() => setNewIsFood(!newIsFood)}
                    disabled={pending}
                  />
                </div>

                {state.errors && (
                  <p className="text-xs text-red-400">
                    {Object.values(state.errors).flat().join(', ')}
                  </p>
                )}
              </div>

              <DialogFooter>
                <Button
                  variant="secondary"
                  onClick={() => {
                    onOpenChange()
                    setNewDiscontinued(offering.discontinued)
                    setNewDiscount(offering.discounted)
                    setNewIsFood(offering.isFood)
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={pending}>
                  {pending ? 'Updating…' : 'Update'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}

'use client'
import { Check, ChevronDown, Minus, Plus } from 'lucide-react'
import { formatCents } from './shared'
import { DBOffering } from '@/app/db/db'
import { cn } from '@/lib/utils'
import { OfferingImage } from '@/components/OfferingImage'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { ScrollArea } from '@/components/ui/scroll-area'

export type OfferingQuantities = Partial<Record<string, number>>

interface OfferingGridProps {
  offerings: DBOffering[] | undefined
  quantities: OfferingQuantities
  onChange: (quantities: OfferingQuantities) => void
  maxItems: number
  disabled?: boolean
}

export const OfferingGrid = (props: OfferingGridProps) => {
  const { offerings, quantities, onChange, maxItems, disabled } = props

  const sorted = (offerings ?? []).toSorted((a, b) =>
    a.readableName.localeCompare(b.readableName),
  )
  const available = sorted.filter((offering) => !offering.discontinued)
  const discontinued = sorted.filter((offering) => offering.discontinued)
  const canAdd = countItems(quantities) < maxItems

  const setQuantity = (name: string, quantity: number) => {
    onChange(
      Object.fromEntries(
        Object.entries({ ...quantities, [name]: quantity }).filter(
          ([, current]) => (current ?? 0) > 0,
        ),
      ),
    )
  }

  const renderTiles = (tileOfferings: DBOffering[]) => (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(7.5rem,1fr))] gap-2">
      {tileOfferings.map((offering) => (
        <OfferingTile
          key={offering.name}
          offering={offering}
          quantity={quantities[offering.name] ?? 0}
          onSetQuantity={(quantity) => setQuantity(offering.name, quantity)}
          canAdd={canAdd}
          disabled={disabled}
        />
      ))}
    </div>
  )

  return (
    <ScrollArea className="h-[min(22rem,40dvh)] rounded-md border">
      <div className="grid gap-3 p-2">
        {offerings === undefined ?
          <span className="p-2 text-sm text-muted-foreground">
            Loading offerings…
          </span>
        : renderTiles(available)}

        {discontinued.length !== 0 && (
          <Collapsible>
            <CollapsibleTrigger className="group flex w-full items-center gap-3 rounded-sm text-sm text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none pointer-coarse:py-2">
              <span className="h-px flex-1 bg-border" />
              Discontinued offerings ({discontinued.length})
              <ChevronDown className="size-4 transition-transform group-data-panel-open:rotate-180" />
              <span className="h-px flex-1 bg-border" />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-3">
              {renderTiles(discontinued)}
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>
    </ScrollArea>
  )
}

export const countItems = (quantities: OfferingQuantities) =>
  Object.values(quantities).reduce<number>(
    (sum, quantity) => sum + (quantity ?? 0),
    0,
  )

interface OfferingTileProps {
  offering: DBOffering
  quantity: number
  onSetQuantity: (quantity: number) => void
  canAdd: boolean
  disabled?: boolean
}

const OfferingTile = (props: OfferingTileProps) => {
  const { offering, quantity, onSetQuantity, canAdd, disabled } = props
  const selected = quantity > 0

  return (
    <div
      className={cn(
        'relative flex flex-col overflow-hidden rounded-lg border bg-card transition-colors',
        selected && 'border-primary ring-1 ring-primary',
      )}
    >
      <button
        type="button"
        aria-pressed={selected}
        onClick={() => onSetQuantity(selected ? 0 : 1)}
        disabled={disabled === true || (!selected && !canAdd)}
        className="flex flex-1 touch-manipulation flex-col items-center gap-1 p-2 text-center transition-colors hover:bg-accent/50 focus-visible:bg-accent/50 focus-visible:outline-none disabled:opacity-50"
      >
        <OfferingImage
          className="size-16 object-contain"
          src={offering.imageUrl}
          size={64}
          alt=""
        />
        <span className="line-clamp-2 text-sm leading-tight font-medium">
          {offering.readableName}
        </span>
        <span
          className={cn(
            'text-sm font-semibold',
            offering.discounted && !offering.discontinued && 'text-red-700',
          )}
        >
          {formatCents(offering.priceCents)}
        </span>
        <span className="text-xs text-muted-foreground">
          In stock: {offering.inInventory}
        </span>
      </button>

      {selected && (
        <>
          <Check className="absolute top-1.5 right-1.5 size-4 text-primary" />
          <div className="flex items-center justify-between border-t p-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 touch-manipulation pointer-coarse:size-10"
              onClick={() => onSetQuantity(quantity - 1)}
              disabled={disabled}
              aria-label={`One ${offering.readableName} less`}
            >
              <Minus />
            </Button>
            <span className="text-sm font-semibold tabular-nums">
              {quantity}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 touch-manipulation pointer-coarse:size-10"
              onClick={() => onSetQuantity(quantity + 1)}
              disabled={disabled === true || !canAdd}
              aria-label={`One ${offering.readableName} more`}
            >
              <Plus />
            </Button>
          </div>
        </>
      )}
    </div>
  )
}

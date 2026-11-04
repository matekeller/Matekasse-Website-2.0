'use client'
import { Euro, IdCard, Plus, ShoppingCart, UserPlus } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useParams } from 'next/navigation'
import { createContext, useCallback, useContext, useRef, useState } from 'react'
import { AddAccountDialog } from './AddAccountDialog'
import { ChangeBluecardDialog } from './ChangeBluecardDialog'
import { PurchaseDialog } from './PurchaseDialog'
import { TopupDialog } from './TopupDialog'
import { useOwnUserInfo } from '@/hooks/data'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export type AdminAction = 'topup' | 'purchase' | 'addAccount' | 'changeBluecard'

type OpenAdminAction = (action: AdminAction, username?: string) => void

const AdminActionsContext = createContext<OpenAdminAction>(() => undefined)

export const useAdminActions = () => useContext(AdminActionsContext)

// Keeps a closing menu from pulling focus out of the dialog it opened.
export const useDialogMenuFocus = () => {
  const openedDialog = useRef(false)

  return {
    markDialogOpened: () => {
      openedDialog.current = true
    },
    finalFocus: () => {
      const restoreFocus = !openedDialog.current
      openedDialog.current = false
      return restoreFocus
    },
  }
}

// Top to bottom, so the most frequent action sits next to the button.
const FAB_ACTIONS: { action: AdminAction; label: string; icon: LucideIcon }[] =
  [
    { action: 'changeBluecard', label: 'Change bluecard', icon: IdCard },
    { action: 'addAccount', label: 'Add account', icon: UserPlus },
    { action: 'purchase', label: 'Offering purchase', icon: ShoppingCart },
    { action: 'topup', label: 'Top up', icon: Euro },
  ]

export const AdminActionsProvider = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const ownUserInfo = useOwnUserInfo()
  const params = useParams<{ username?: string }>()
  const [active, setActive] = useState<{
    action: AdminAction
    username?: string
  } | null>(null)

  const openAdminAction = useCallback<OpenAdminAction>(
    (action, username) => setActive({ action, username }),
    [],
  )

  const dialogProps = (action: AdminAction) => ({
    open: active?.action === action,
    onOpenChange: (open: boolean) => {
      if (!open) setActive(null)
    },
    initialUsername: active?.username,
  })

  return (
    <AdminActionsContext.Provider value={openAdminAction}>
      {children}

      {ownUserInfo?.isAdmin === true && (
        <>
          {/* Keeps the floating button from covering the end of the page. */}
          <div aria-hidden className="h-20 shrink-0" />
          <AdminActionsFab
            onSelect={(action) => openAdminAction(action, params.username)}
          />
          <TopupDialog {...dialogProps('topup')} />
          <PurchaseDialog {...dialogProps('purchase')} />
          <AddAccountDialog {...dialogProps('addAccount')} />
          <ChangeBluecardDialog {...dialogProps('changeBluecard')} />
        </>
      )}
    </AdminActionsContext.Provider>
  )
}

const AdminActionsFab = ({
  onSelect,
}: {
  onSelect: (action: AdminAction) => void
}) => {
  const { markDialogOpened, finalFocus } = useDialogMenuFocus()
  const [open, setOpen] = useState(false)

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      {open && (
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-30 bg-background/70 backdrop-blur-[2px] animate-in fade-in-0"
        />
      )}
      <DropdownMenuTrigger
        render={
          <Button
            size="icon"
            className="group fixed right-[calc(1.5rem+env(safe-area-inset-right))] bottom-[calc(1.5rem+env(safe-area-inset-bottom))] z-40 size-14 touch-manipulation rounded-full shadow-lg pointer-coarse:size-14"
            aria-label="Admin actions"
          />
        }
      >
        <Plus className="size-6 transition-transform duration-200 group-data-popup-open:rotate-45" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        finalFocus={finalFocus}
        side="top"
        align="end"
        sideOffset={12}
        className="flex w-auto min-w-0 flex-col items-end gap-3 overflow-visible bg-transparent p-0 pr-1.5 shadow-none ring-0 pointer-coarse:gap-2 pointer-coarse:pr-1"
      >
        {FAB_ACTIONS.map(({ action, label, icon: Icon }) => (
          <DropdownMenuItem
            key={action}
            onClick={() => {
              markDialogOpened()
              onSelect(action)
            }}
            className="group/item touch-manipulation gap-3 rounded-full p-0 focus:bg-transparent pointer-coarse:py-0"
          >
            <span className="rounded-md border bg-popover px-3 py-1.5 text-sm font-medium text-popover-foreground shadow-md transition-colors group-focus/item:bg-accent group-focus/item:text-accent-foreground group-data-highlighted/item:bg-accent pointer-coarse:py-2.5">
              {label}
            </span>
            <span className="flex size-11 items-center justify-center rounded-full border bg-secondary shadow-md transition-colors group-focus/item:bg-accent group-data-highlighted/item:bg-accent pointer-coarse:size-12">
              <Icon className="size-5 text-secondary-foreground" />
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

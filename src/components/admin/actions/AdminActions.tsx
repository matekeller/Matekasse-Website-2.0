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
    onCloseAutoFocus: (event: Event) => {
      if (openedDialog.current) {
        event.preventDefault()
        openedDialog.current = false
      }
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
  const { markDialogOpened, onCloseAutoFocus } = useDialogMenuFocus()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="icon"
          className="group fixed right-6 bottom-6 z-40 size-14 rounded-full shadow-lg"
          aria-label="Admin actions"
        >
          <Plus className="size-6 transition-transform duration-200 group-data-[state=open]:rotate-45" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        onCloseAutoFocus={onCloseAutoFocus}
        side="top"
        align="end"
        sideOffset={12}
        className="flex min-w-0 flex-col items-end gap-3 overflow-visible border-none bg-transparent p-0 pr-2 shadow-none"
      >
        {FAB_ACTIONS.map(({ action, label, icon: Icon }) => (
          <DropdownMenuItem
            key={action}
            onSelect={() => {
              markDialogOpened()
              onSelect(action)
            }}
            className="group/item cursor-pointer gap-3 rounded-full p-0 focus:bg-transparent"
          >
            <span className="rounded-md border bg-popover px-3 py-1.5 text-sm font-medium text-popover-foreground shadow-md transition-colors group-focus/item:bg-accent group-focus/item:text-accent-foreground">
              {label}
            </span>
            <span className="flex size-10 items-center justify-center rounded-full border bg-secondary shadow-md transition-colors group-focus/item:bg-accent">
              <Icon className="size-5 text-secondary-foreground" />
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

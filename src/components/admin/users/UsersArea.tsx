import { EllipsisVertical } from 'lucide-react'
import Link from 'next/link'
import { User } from '@/app/admin/users/page'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import {
  AdminAction,
  useAdminActions,
  useDialogMenuFocus,
} from '@/components/admin/actions/AdminActions'

export interface UsersAreaProps {
  users: User[]
}

export const UsersArea = (props: UsersAreaProps) => {
  const { users } = props

  return (
    <>
      <div className="grid grid-cols-[repeat(auto-fill,_minmax(clamp(0px,_350px,_100%),_1fr))] gap-4">
        {users.map((user) => (
          <UserCard key={user.username} user={user} />
        ))}
      </div>
    </>
  )
}

interface UserCardProps {
  user: User
}

const UserCard = (props: UserCardProps) => {
  const { user } = props
  const openAdminAction = useAdminActions()
  const { markDialogOpened, onCloseAutoFocus } = useDialogMenuFocus()

  const openForUser = (action: AdminAction) => {
    markDialogOpened()
    openAdminAction(action, user.username)
  }

  return (
    <Card className="relative grid flex-row">
      <div className="absolute right-2 top-2 z-10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className={`flex size-8 text-muted-foreground data-[state=open]:bg-muted`}
            >
              <EllipsisVertical />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-50"
            onCloseAutoFocus={onCloseAutoFocus}
          >
            <DropdownMenuItem onSelect={() => openForUser('topup')}>
              Top up
            </DropdownMenuItem>

            <DropdownMenuItem onSelect={() => openForUser('purchase')}>
              Offering purchase
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem onSelect={() => openForUser('changeBluecard')}>
              Change bluecard
            </DropdownMenuItem>

            <DropdownMenuItem>Update password</DropdownMenuItem>

            <DropdownMenuItem>
              <Link href={`/admin/transactions/${user.username}`}>
                Transaction history
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="flex flex-col justify-start">
        <CardHeader className="w-full flex flex-row justify-between">
          <CardTitle>
            {user.username}{' '}
            {user.isAdmin && <Badge variant="secondary">Admin</Badge>}
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-2">
            <span>Full name:</span>
            <span>{user.fullName}</span>
            <span>Bluecard ID:</span>
            <span>{user.bluecardId}</span>
            <span>Smartcard count:</span>
            <span>{user.smartcards.length}</span>
            <span>Balance</span>
            <span>
              {new Intl.NumberFormat('de-DE', {
                style: 'currency',
                currency: 'EUR',
                signDisplay: 'negative',
              }).format((-1 * user.balance) / 100)}
            </span>
          </div>
        </CardContent>
      </div>
    </Card>
  )
}

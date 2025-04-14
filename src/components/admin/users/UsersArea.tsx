import { EllipsisVertical } from 'lucide-react'
import { User } from '@/app/admin/users/page'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'

export interface UsersAreaProps {
  users: User[]
}

export const UsersArea = (props: UsersAreaProps) => {
  const { users } = props

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
        {getCards(users)}
      </div>
    </>
  )
}

const getCards = (users: User[]) => {
  return users.map((user, idx) => (
    <Card key={idx} className="grid flex-row">
      <div className="flex flex-col justify-start">
        <CardHeader className="w-full flex flex-row justify-between">
          <CardTitle>
            {user.username}{' '}
            {user.isAdmin && <Badge variant="secondary">Admin</Badge>}
          </CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="flex size-8 text-muted-foreground data-[state=open]:bg-muted"
              >
                <EllipsisVertical />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-50">
              <DropdownMenuItem>Update bluecard ID</DropdownMenuItem>
              <DropdownMenuItem>Update password</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
  ))
}

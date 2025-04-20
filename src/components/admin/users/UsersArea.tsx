import { EllipsisVertical } from 'lucide-react'
import { useActionState, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { BarQRCodeScanner } from './Scanner'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { updateBluecardID } from '@/app/actions/users'
import { useSession } from '@/hooks/session'

export interface UsersAreaProps {
  users: User[]
}

export const UsersArea = (props: UsersAreaProps) => {
  const { users } = props

  const [bluecardIDs, setBluecardIDs] = useState<Map<string, string>>(new Map())

  useEffect(() => {
    if (users.length !== 0) {
      const usersMap = new Map(
        users.map((user) => [user.username, user.bluecardId]),
      )
      setBluecardIDs(usersMap)
    }
  }, [users])

  return (
    <>
      <div className="grid grid-cols-[repeat(auto-fill,_minmax(clamp(0px,_350px,_100%),_1fr))] gap-4">
        {users.map((user, idx) => (
          <UserCard
            key={idx}
            user={user}
            onUpdatedBluecardID={(username, newID) =>
              setBluecardIDs((cur) => new Map(cur).set(username, newID))
            }
            bluecardID={bluecardIDs.get(user.username) ?? ''}
          />
        ))}
      </div>
    </>
  )
}

interface UserCardProps {
  user: User
  bluecardID: string
  onUpdatedBluecardID: (username: string, newID: string) => void
}

const UserCard = (props: UserCardProps) => {
  const { user, bluecardID, onUpdatedBluecardID } = props
  const { session } = useSession()

  const [updateBluecardDialogOpen, setUpdateBluecardDialogOpen] =
    useState(false)

  return (
    <>
      <UpdateBluecardDialog
        open={updateBluecardDialogOpen}
        user={user}
        session={session}
        onScanned={(result) => {
          setUpdateBluecardDialogOpen(false)
          if (result !== null) {
            onUpdatedBluecardID(user.username, result)
          }
        }}
        onOpenChange={() => setUpdateBluecardDialogOpen}
      />

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
            <DropdownMenuContent align="end" className="w-50">
              <DropdownMenuItem
                onClick={() => setUpdateBluecardDialogOpen(true)}
              >
                Update bluecard ID
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
              <span>{bluecardID}</span>
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
    </>
  )
}

interface UpdateBluecardDialogProps {
  open: boolean
  user: User
  session?: string
  onScanned: (result: string | null) => void
  onOpenChange: () => void
}

const UpdateBluecardDialog = (props: UpdateBluecardDialogProps) => {
  const { open, user, session, onScanned, onOpenChange } = props

  const [scannedCode, setScannedCode] = useState('')

  const initialState = { errors: {}, message: undefined }
  const [state, formAction, pending] = useActionState(
    updateBluecardID,
    initialState,
  )
  const updated = useRef(false)

  useEffect(() => {
    if (state.errors == null && state.message && !pending && !updated.current) {
      updated.current = true
      onScanned(scannedCode)
    }
  }, [state, scannedCode, onScanned])

  return (
    <>
      {session !== undefined && (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent>
            <form action={formAction}>
              <input type="hidden" name="session" value={session} />
              <input
                type="hidden"
                name="oldBluecardID"
                value={user.bluecardId}
              />
              <div className="items-center justify-start p-6">
                <DialogHeader>
                  <DialogTitle>
                    Update bluecard ID of {user.username}
                  </DialogTitle>
                  <DialogDescription>
                    Insert the new bluecard ID below or scan the barcode with a
                    camera.
                  </DialogDescription>
                </DialogHeader>

                <div className="gap-4 py-4">
                  <div className="p-4">
                    <BarQRCodeScanner
                      onScan={(codes) => setScannedCode(codes[0].rawValue)}
                    />
                  </div>
                  <div className="grid w-full max-w-sm items-center gap-1.5">
                    <Label htmlFor="newBluecardID">Bluecard ID</Label>
                    <Input
                      id="newBluecardID"
                      name="newBluecardID"
                      value={scannedCode}
                      onChange={(event) => setScannedCode(event.target.value)}
                    />
                  </div>
                </div>
              </div>
              {state.errors?.newBluecardID && (
                <p className="text-xs text-red-400">
                  {state.errors.newBluecardID.join(', ')}
                </p>
              )}

              {state.errors?.session && (
                <p className="text-xs text-red-400">
                  {state.errors.session.join(', ')}
                </p>
              )}

              <DialogFooter>
                <Button variant="secondary" onClick={() => onScanned(null)}>
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

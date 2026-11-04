'use client'
import { useActionState, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { BluecardInput } from './BluecardInput'
import { ACTION_DIALOG_CLASS, ActionDialogProps, FormErrors } from './shared'
import { UserPicker } from './UserPicker'
import { updateBluecardID } from '@/app/actions/users'
import { ActionState } from '@/app/lib/definitions'
import { notifyDataChanged, useUsers } from '@/hooks/data'
import { useSession } from '@/hooks/session'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export const ChangeBluecardDialog = (props: ActionDialogProps) => {
  const { open, onOpenChange } = props

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={ACTION_DIALOG_CLASS}>
        <ChangeBluecardForm {...props} />
      </DialogContent>
    </Dialog>
  )
}

const ChangeBluecardForm = (props: ActionDialogProps) => {
  const { initialUsername, onOpenChange } = props
  const { session } = useSession()
  const { users } = useUsers()

  const [username, setUsername] = useState(initialUsername ?? null)
  const [newBluecardId, setNewBluecardId] = useState('')
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    updateBluecardID,
    {},
  )

  const user = users?.find((candidate) => candidate.username === username)
  const trimmedId = newBluecardId.trim()
  const bluecardOwner = users?.find(
    (candidate) => trimmedId !== '' && candidate.bluecardId === trimmedId,
  )
  const warning =
    bluecardOwner === undefined ? undefined
    : bluecardOwner.username === username ?
      'This is already the current bluecard ID'
    : `Already assigned to @${bluecardOwner.username}`

  useEffect(() => {
    if (!state.success) return

    toast.success(`Bluecard ID of @${username ?? ''} has been updated`)
    notifyDataChanged()
    onOpenChange(false)
  }, [state])

  return (
    <form action={formAction} className="grid gap-4">
      <input type="hidden" name="session" value={session ?? ''} />
      <input
        type="hidden"
        name="oldBluecardID"
        value={user?.bluecardId ?? ''}
      />

      <DialogHeader>
        <DialogTitle>Change bluecard</DialogTitle>
        <DialogDescription>
          Assign a new bluecard to an existing user.
        </DialogDescription>
      </DialogHeader>

      <UserPicker
        users={users}
        value={username}
        onChange={setUsername}
        disabled={pending}
      />

      {user && (
        <div className="grid grid-cols-2 gap-1 text-sm">
          <span className="text-muted-foreground">Current bluecard ID</span>
          <span className="text-right font-mono">
            {user.bluecardId === '' ? 'none' : user.bluecardId}
          </span>
        </div>
      )}

      <BluecardInput
        id="change-bluecard"
        name="newBluecardID"
        label="New bluecard ID"
        value={newBluecardId}
        onChange={setNewBluecardId}
        disabled={pending}
        warning={warning}
      />

      <FormErrors state={state} />

      <DialogFooter>
        <Button
          type="button"
          variant="secondary"
          onClick={() => onOpenChange(false)}
          disabled={pending}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={
            pending ||
            !user ||
            trimmedId === '' ||
            warning !== undefined ||
            session === undefined
          }
        >
          {pending ? 'Updating…' : 'Update bluecard'}
        </Button>
      </DialogFooter>
    </form>
  )
}

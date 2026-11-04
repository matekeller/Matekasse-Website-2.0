'use client'
import { Eye, EyeOff } from 'lucide-react'
import { useActionState, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { BluecardInput } from './BluecardInput'
import { ActionDialogProps, FormErrors } from './shared'
import { register } from '@/app/actions/users'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export const AddAccountDialog = (props: ActionDialogProps) => {
  const { open, onOpenChange } = props

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <AddAccountForm {...props} />
      </DialogContent>
    </Dialog>
  )
}

const AddAccountForm = (props: ActionDialogProps) => {
  const { onOpenChange } = props
  const { session } = useSession()
  const { users } = useUsers()

  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [bluecardId, setBluecardId] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    register,
    {},
  )

  const trimmedUsername = username.trim()
  const usernameTaken = users?.some(
    (user) => user.username.toLowerCase() === trimmedUsername.toLowerCase(),
  )
  const usernameHasSpaces = /\s/.test(trimmedUsername)
  const bluecardOwner = users?.find(
    (user) => bluecardId.trim() !== '' && user.bluecardId === bluecardId.trim(),
  )
  const isComplete =
    fullName.trim() !== '' &&
    trimmedUsername !== '' &&
    bluecardId.trim() !== '' &&
    password !== ''

  useEffect(() => {
    if (!state.success) return

    toast.success(`Account @${trimmedUsername} has been created`)
    notifyDataChanged()
    onOpenChange(false)
  }, [state])

  return (
    <form action={formAction} className="grid gap-4">
      <input type="hidden" name="session" value={session ?? ''} />

      <DialogHeader>
        <DialogTitle>Add account</DialogTitle>
        <DialogDescription>Register a new Matekasse user.</DialogDescription>
      </DialogHeader>

      <div className="grid gap-2">
        <Label htmlFor="register-full-name">Full name</Label>
        <Input
          id="register-full-name"
          name="fullName"
          autoComplete="off"
          autoFocus
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          disabled={pending}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="register-username">Username</Label>
        <Input
          id="register-username"
          name="username"
          autoComplete="off"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          aria-invalid={usernameTaken === true || usernameHasSpaces}
          disabled={pending}
        />
        {trimmedUsername !== '' && (
          <span
            className={`text-xs ${usernameTaken === true || usernameHasSpaces ? 'text-red-400' : 'text-muted-foreground'}`}
          >
            {usernameHasSpaces ?
              'Username must not contain spaces'
            : usernameTaken === true ?
              `@${trimmedUsername} is already taken`
            : usernameTaken === false ?
              `@${trimmedUsername} is available`
            : 'Checking availability…'}
          </span>
        )}
      </div>

      <BluecardInput
        id="register-bluecard"
        name="bluecardId"
        value={bluecardId}
        onChange={setBluecardId}
        disabled={pending}
        warning={
          bluecardOwner ?
            `Already assigned to @${bluecardOwner.username}`
          : undefined
        }
      />

      <div className="grid gap-2">
        <Label htmlFor="register-password">Password</Label>
        <div className="flex gap-1">
          <Input
            id="register-password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={pending}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ?
              <EyeOff />
            : <Eye />}
          </Button>
        </div>
      </div>

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
            !isComplete ||
            usernameTaken !== false ||
            usernameHasSpaces ||
            bluecardOwner !== undefined ||
            session === undefined
          }
        >
          {pending ? 'Creating…' : 'Create account'}
        </Button>
      </DialogFooter>
    </form>
  )
}

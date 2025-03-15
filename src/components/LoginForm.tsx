'use client'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { login } from '@/app/actions/auth'
import { useActionState, useEffect, useState } from 'react'
import { Dialog } from './ui/dialog'
import { useSession } from '@/hooks/session'
export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  const [state, loginAction, pending] = useActionState(login, undefined)
  const { session } = useSession()

  const [open, setOpen] = useState(true)

  useEffect(() => {
    if (session) {
      setOpen(false)
    }
  }, [session])

  return (
    <>
      <Dialog open={open}>
        <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
          <div className="w-full max-w-sm">
            <div className={cn('flex flex-col gap-6', className)} {...props}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">Login</CardTitle>
                  <CardDescription>
                    Please enter your user name and password below to log into
                    your account.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form action={(formData) => loginAction(formData)}>
                    <div className="flex flex-col gap-6">
                      <div className="grid gap-2">
                        <Label htmlFor="username">User name</Label>
                        <Input
                          id="username"
                          name="username"
                          placeholder="Your user name…"
                          required
                          disabled={pending}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                          id="password"
                          placeholder="Your password…"
                          type="password"
                          name="password"
                          required
                          disabled={pending}
                        />
                      </div>

                      <p className="text-red-400 text-xs self-center">
                        {state?.message}
                      </p>
                      <Button type="submit" className="w-full cursor-pointer">
                        Login
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </Dialog>

      {session !== undefined && <>{props.children}</>}
    </>
  )
}

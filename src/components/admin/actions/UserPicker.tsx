'use client'
import { X } from 'lucide-react'
import { useEffect, useId, useState } from 'react'
import { displayBalance } from './shared'
import { DBUser } from '@/app/db/db'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const MAX_SUGGESTIONS = 6

interface UserPickerProps {
  label?: string
  users: DBUser[] | undefined
  value: string | null
  onChange: (username: string | null) => void
  disabled?: boolean
}

export const UserPicker = (props: UserPickerProps) => {
  const { label = 'User', users, value, onChange, disabled } = props
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const id = useId()

  const selectedUser = users?.find((user) => user.username === value)
  const suggestions = rankUsers(users ?? [], query).slice(0, MAX_SUGGESTIONS)
  const activeSuggestion = suggestions.at(activeIndex)

  useEffect(() => {
    if (value !== null && users !== undefined && selectedUser === undefined) {
      onChange(null)
    }
  }, [value, users, selectedUser])

  const select = (username: string) => {
    onChange(username)
    setQuery('')
    setOpen(false)
  }

  if (value !== null) {
    return (
      <div className="grid gap-2">
        <Label>{label}</Label>
        <div className="flex items-center gap-3 rounded-md border py-2 pr-2 pl-3">
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="font-medium">@{value}</span>
            <span className="truncate text-xs text-muted-foreground">
              {selectedUser?.fullName ?? 'Loading…'}
            </span>
          </div>
          {selectedUser && (
            <span className="text-sm">
              {displayBalance(selectedUser.balance)}
            </span>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 pointer-coarse:size-10"
            onClick={() => onChange(null)}
            disabled={disabled}
            aria-label="Choose another user"
          >
            <X />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative grid gap-2">
      <Label htmlFor={`${id}-input`}>{label}</Label>
      <Input
        id={`${id}-input`}
        role="combobox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-autocomplete="list"
        aria-activedescendant={
          open && activeSuggestion ? `${id}-${activeIndex}` : undefined
        }
        placeholder="Username, name or bluecard ID…"
        autoComplete="off"
        enterKeyHint="search"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        value={query}
        disabled={disabled}
        onChange={(event) => {
          setQuery(event.target.value)
          setActiveIndex(0)
          setOpen(true)
        }}
        onBlur={() => setOpen(false)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown') {
            event.preventDefault()
            setActiveIndex((cur) =>
              open ? Math.min(cur + 1, suggestions.length - 1) : 0,
            )
            setOpen(true)
          } else if (event.key === 'ArrowUp') {
            event.preventDefault()
            setActiveIndex((cur) => Math.max(cur - 1, 0))
          } else if (event.key === 'Enter') {
            event.preventDefault()
            if (open && activeSuggestion) {
              select(activeSuggestion.username)
            }
          }
        }}
      />
      {open && (
        <ul
          id={`${id}-list`}
          role="listbox"
          className="absolute top-full z-50 mt-1 w-full overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md max-sm:static max-sm:mt-0"
        >
          {users === undefined ?
            <li className="px-2 py-1.5 text-sm text-muted-foreground">
              Loading users…
            </li>
          : suggestions.length === 0 ?
            <li className="px-2 py-1.5 text-sm text-muted-foreground">
              No matching users
            </li>
          : suggestions.map((user, idx) => (
              <li
                key={user.username}
                id={`${id}-${idx}`}
                role="option"
                aria-selected={idx === activeIndex}
                className={cn(
                  'flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm pointer-coarse:py-3',
                  idx === activeIndex && 'bg-accent text-accent-foreground',
                )}
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => setActiveIndex(idx)}
                onClick={() => select(user.username)}
              >
                <span className="font-medium">@{user.username}</span>
                <span className="truncate text-muted-foreground">
                  {user.fullName}
                </span>
                <span className="ml-auto shrink-0 text-xs">
                  {displayBalance(user.balance)}
                </span>
              </li>
            ))
          }
        </ul>
      )}
    </div>
  )
}

const rankUsers = (users: DBUser[], query: string): DBUser[] => {
  const normalizedQuery = query.trim().toLowerCase()

  return users
    .map((user) => ({ user, rank: getMatchRank(user, normalizedQuery) }))
    .filter(({ rank }) => rank !== null)
    .toSorted((a, b) =>
      a.rank !== b.rank ?
        (a.rank ?? 0) - (b.rank ?? 0)
      : a.user.username.localeCompare(b.user.username),
    )
    .map(({ user }) => user)
}

// Lower is better, null means no match.
const getMatchRank = (user: DBUser, query: string): number | null => {
  if (query === '') return 0

  const username = user.username.toLowerCase()
  const fullName = user.fullName.toLowerCase()

  if (username === query || user.bluecardId.toLowerCase() === query) return 0
  if (username.startsWith(query)) return 1
  if (fullName.split(/\s+/).some((part) => part.startsWith(query))) return 2
  if (username.includes(query) || fullName.includes(query)) return 3

  return null
}

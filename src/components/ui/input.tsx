import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"
import { cn } from "cn"

// Bitwarden only honors data-bwignore if the user opted in, but it never
// autofills type="search". Text and password fields outside the login form
// therefore become search fields; the other attributes cover other managers.
const PASSWORD_MANAGER_OPT_OUT = {
  autoComplete: "off",
  enterKeyHint: "done",
  "data-bwignore": "",
  "data-1p-ignore": "",
  "data-lpignore": "true",
  "data-form-type": "other",
} as const

function Input({
  className,
  type,
  allowPasswordManager = false,
  ...props
}: React.ComponentProps<"input"> & {
  /** Only the login form should let password managers fill its fields. */
  allowPasswordManager?: boolean
}) {
  const isMaskedPassword = !allowPasswordManager && type === "password"
  const resolvedType =
    !allowPasswordManager && (type === undefined || type === "text" || isMaskedPassword)
      ? "search"
      : type

  return (
    <InputPrimitive
      type={resolvedType}
      data-slot="input"
      {...(allowPasswordManager ? {} : PASSWORD_MANAGER_OPT_OUT)}
      className={cn(
        "h-9 w-full min-w-0 rounded-md pointer-coarse:h-10 border border-input bg-transparent px-2.5 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        isMaskedPassword && "[-webkit-text-security:disc]",
        className
      )}
      {...props}
    />
  )
}

export { Input }

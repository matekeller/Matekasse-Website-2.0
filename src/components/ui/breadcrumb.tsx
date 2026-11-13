import * as React from "react"
import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cn } from "cn"
import { ChevronRightIcon, MoreHorizontalIcon } from "lucide-react"

function Breadcrumb({ className, ...props }: React.ComponentProps<"nav">) {
  return (
    <nav
      aria-label="breadcrumb"
      data-slot="breadcrumb"
      className={cn("min-w-0 flex-1 overflow-hidden", className)}
      {...props}
    />
  )
}

function BreadcrumbList({ className, ...props }: React.ComponentProps<"ol">) {
  const listRef = React.useRef<HTMLOListElement>(null)

  React.useLayoutEffect(() => {
    const list = listRef.current
    const breadcrumb = list?.closest<HTMLElement>("[data-slot='breadcrumb']")
    if (list === null || breadcrumb === null || breadcrumb === undefined) return

    const updateCollapsedItems = () => {
      const items = Array.from(list.children).filter(
        (item): item is HTMLElement =>
          item instanceof HTMLElement &&
          item.dataset.slot === "breadcrumb-item" &&
          item.getBoundingClientRect().width > 0,
      )

      for (const item of items) item.removeAttribute("data-collapsed")

      let index = 0
      while (list.scrollWidth > breadcrumb.clientWidth && index < items.length) {
        items[index].setAttribute("data-collapsed", "true")
        index += 1
      }
    }

    const observer = new ResizeObserver(updateCollapsedItems)
    observer.observe(breadcrumb)
    updateCollapsedItems()

    return () => observer.disconnect()
  }, [props.children])

  return (
    <ol
      ref={listRef}
      data-slot="breadcrumb-list"
      className={cn(
        "flex w-max shrink-0 flex-nowrap items-center gap-1.5 whitespace-nowrap text-sm text-muted-foreground sm:gap-2.5",
        className
      )}
      {...props}
    />
  )
}

function BreadcrumbItem({ className, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="breadcrumb-item"
      className={cn("inline-flex items-center gap-1.5", className)}
      {...props}
    />
  )
}

function BreadcrumbLink({
  className,
  render,
  ...props
}: useRender.ComponentProps<"a">) {
  return useRender({
    defaultTagName: "a",
    props: mergeProps<"a">(
      {
        className: cn("transition-colors hover:text-foreground", className),
      },
      props
    ),
    render,
    state: {
      slot: "breadcrumb-link",
    },
  })
}

function BreadcrumbPage({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="breadcrumb-page"
      role="link"
      aria-disabled="true"
      aria-current="page"
      className={cn("font-normal text-foreground", className)}
      {...props}
    />
  )
}

function BreadcrumbSeparator({
  children,
  className,
  ...props
}: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="breadcrumb-separator"
      role="presentation"
      aria-hidden="true"
      className={cn("[&>svg]:size-3.5", className)}
      {...props}
    >
      {children ?? (
        <ChevronRightIcon />
      )}
    </li>
  )
}

function BreadcrumbEllipsis({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="breadcrumb-ellipsis"
      role="presentation"
      aria-hidden="true"
      className={cn(
        "flex size-5 items-center justify-center [&>svg]:size-4",
        className
      )}
      {...props}
    >
      <MoreHorizontalIcon
      />
      <span className="sr-only">More</span>
    </span>
  )
}

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
}

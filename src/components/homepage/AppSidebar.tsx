'use client'

import {
  Boxes,
  ChevronUp,
  CupSoda,
  Euro,
  ReceiptText,
  Unplug,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Separator } from '../ui/separator'
import { Button } from '../ui/button'
import { Avatar, AvatarFallback } from '../ui/avatar'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '../ui/hover-card'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../ui/collapsible'
import { useOwnUserInfo } from '@/hooks/data'
import { useSession } from '@/hooks/session'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { logout } from '@/app/actions/auth'

export const AppSidebar = () => {
  const { session } = useSession()

  const userInfo = useOwnUserInfo()
  const nameAbbr = getNameAbbreviation(userInfo?.fullName)
  const { setOpenMobile } = useSidebar()

  // The mobile sidebar is an overlay, so close it once a link was used.
  const closeOnLinkClick = (event: React.MouseEvent) => {
    if (event.target instanceof Element && event.target.closest('a')) {
      setOpenMobile(false)
    }
  }

  return (
    <Sidebar>
      <SidebarHeader className="justify-center" onClick={closeOnLinkClick}>
        <Link href="/" className="self-center">
          <Image
            src={{ src: '/matemate.png', height: 150, width: 150 }}
            alt="MateMate Logo"
            priority={true}
          />
        </Link>
        <span
          style={{
            fontVariantCaps: 'small-caps',
          }}
          className="text-muted-foreground text-lg self-center font-semibold"
        >
          <Link href="/">MateMate</Link>
        </span>
      </SidebarHeader>
      <Separator />

      {userInfo?.isAdmin ?
        <AdminUserSideBarContent onClick={closeOnLinkClick} />
      : <StandardUserSideBarContent onClick={closeOnLinkClick} />}

      <SidebarFooter>
        <Separator />
        <div className="flex items-center gap-3">
          <HoverCard>
            <HoverCardTrigger>
              <Avatar className="cursor-help">
                <AvatarFallback>{nameAbbr}</AvatarFallback>
              </Avatar>
            </HoverCardTrigger>
            <HoverCardContent>
              <div>
                <h4 className="font-semibold">
                  {session !== undefined ? userInfo?.fullName : ''}
                </h4>
                <span className="text-sm text-muted-foreground">
                  {session !== undefined ? '@' + userInfo?.username : ''}
                </span>
              </div>
            </HoverCardContent>
          </HoverCard>
          <Separator orientation="vertical" />
          <div className="flex justify-between w-full">
            <Euro />
            <span className="italic text-muted-foreground">
              {session !== undefined ?
                new Intl.NumberFormat('de-DE', {
                  style: 'decimal',
                  minimumFractionDigits: 2,
                  signDisplay: 'negative',
                }).format((-1 * (userInfo?.balance ?? 0)) / 100)
              : ''}
            </span>
          </div>
        </div>

        <Button onClick={() => void logout()} className="w-full cursor-pointer">
          Logout
        </Button>
      </SidebarFooter>
    </Sidebar>
  )
}

const getNameAbbreviation = (
  fullName: string | undefined,
): string | undefined => {
  if (fullName !== undefined) {
    const nameSplit = fullName.split(' ')
    return (
      nameSplit[0][0].toUpperCase() +
      (nameSplit.length !== 1 ? nameSplit.pop()?.[0].toUpperCase() : '')
    )
  }

  return undefined
}

interface SidebarLinkProps {
  href: string
  icon: LucideIcon
  label: string
}

const SidebarLink = ({ href, icon: Icon, label }: SidebarLinkProps) => {
  const pathname = usePathname()
  const isActive =
    pathname === href || (href !== '/' && pathname.startsWith(`${href}/`))

  return (
    <SidebarMenuItem>
      <SidebarMenuButton render={<Link href={href} />} isActive={isActive}>
        <Icon />
        <span>{label}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

interface SideBarContentProps {
  onClick: (event: React.MouseEvent) => void
}

const StandardUserSideBarContent = ({ onClick }: SideBarContentProps) => {
  return (
    <SidebarContent onClick={onClick}>
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarLink href="/" icon={ReceiptText} label="Transactions" />
            {/* <SidebarMenuItem>
          <SidebarMenuButton render={<Link href="/stats" />}>
              <LucideChartNoAxesCombined />
            <span>Statistics</span>
          </SidebarMenuButton>
        </SidebarMenuItem> */}
            <SidebarLink href="/offerings" icon={CupSoda} label="Offerings" />
            <Separator />
            <SidebarMenuItem>
              <SidebarMenuButton
                render={<Link href="https://api.matekasse.de/graphiql" />}
              >
                <Unplug />
                <span>API</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>
  )
}

const AdminUserSideBarContent = ({ onClick }: SideBarContentProps) => {
  return (
    <SidebarContent onClick={onClick}>
      <Collapsible defaultOpen className="group/collapsible">
        <SidebarGroup>
          <SidebarGroupLabel render={<CollapsibleTrigger />}>
            Admin
            <ChevronUp className="ml-auto transition-transform group-data-open/collapsible:rotate-180" />
          </SidebarGroupLabel>
          <CollapsibleContent>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarLink
                  href="/admin/transactions"
                  icon={ReceiptText}
                  label="All Transactions"
                />
                <SidebarLink href="/admin/users" icon={Users} label="Users" />
                <SidebarLink
                  href="/admin/inventory"
                  icon={Boxes}
                  label="Inventory"
                />
              </SidebarMenu>
            </SidebarGroupContent>
          </CollapsibleContent>
        </SidebarGroup>
      </Collapsible>

      <Collapsible defaultOpen className="group/collapsible">
        <SidebarGroup>
          <SidebarGroupLabel render={<CollapsibleTrigger />}>
            Pleb
            <ChevronUp className="ml-auto transition-transform group-data-open/collapsible:rotate-180" />
          </SidebarGroupLabel>
          <CollapsibleContent>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarLink href="/" icon={ReceiptText} label="Transactions" />
                {/* <SidebarMenuItem>
          <SidebarMenuButton render={<Link href="/stats" />}>
              <LucideChartNoAxesCombined />
            <span>Statistics</span>
          </SidebarMenuButton>
        </SidebarMenuItem> */}
                <SidebarLink
                  href="/offerings"
                  icon={CupSoda}
                  label="Offerings"
                />
              </SidebarMenu>
            </SidebarGroupContent>
          </CollapsibleContent>
        </SidebarGroup>
      </Collapsible>

      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            <Separator />
            <SidebarMenuItem>
              <SidebarMenuButton
                render={<Link href="https://api.matekasse.de/graphiql" />}
              >
                <Unplug />
                <span>API</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>
  )
}

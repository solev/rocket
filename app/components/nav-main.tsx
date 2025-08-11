import { ChevronRight, type LucideIcon } from "lucide-react"
import { NavLink, useLocation } from "react-router"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "~/components/ui/sidebar"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: LucideIcon
    isActive?: boolean
    items?: {
      title: string
      url: string
    }[]
  }[]
}) {
  const location = useLocation();
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const hasChildren = !!item.items?.length;
          if (!hasChildren) {
            return (
              <SidebarMenuItem key={item.title}>
                <NavLink
                  prefetch="intent"
                  to={item.url}
                  end
                  className={({ isActive, isPending }) =>
                    [
                      // base styles (mirroring SidebarMenuButton variants default)
                      "flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-hidden ring-sidebar-ring transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0",
                      isActive && "bg-sidebar-accent font-medium text-sidebar-accent-foreground",
                      isPending && "opacity-75",
                    ]
                      .filter(Boolean)
                      .join(" ")
                  }
                >
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                </NavLink>
              </SidebarMenuItem>
            )
          }
          const childActive = item.items?.some(
            (sub) => sub.url !== "#" && location.pathname.startsWith(sub.url)
          ) || false;
          return (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={childActive}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton tooltip={item.title} isActive={childActive}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items?.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton
                          asChild
                          isActive={location.pathname === subItem.url}
                        >
                          <NavLink
                            to={subItem.url}
                            end
                            prefetch="intent"
                            className={({ isActive, isPending }) =>
                              [
                                "flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-hidden transition hover:underline",
                                isActive && "font-medium",
                                isPending && "opacity-75",
                              ].filter(Boolean).join(" ")
                            }
                          >
                            <span>{subItem.title}</span>
                          </NavLink>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}

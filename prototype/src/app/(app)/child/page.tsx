"use client"

import Link from "next/link"
import { Baby } from "lucide-react"
import { useChildProfile } from "@/components/child/use-child"
import { Button } from "@/components/ui/button"
import { EmptyState, PageBody, PageHeader } from "@/components/app/page"
import { ProfileSwitcher } from "@/components/app/profile-switcher"
import { ChildHome } from "@/components/child/child-home"

export default function ChildPage() {
  const child = useChildProfile()

  return (
    <>
      <PageHeader title={child ? `${child.name}'s feeding` : "Baby feeding"} back="/home" action={<ProfileSwitcher />} />
      <PageBody>
        {child ? (
          <ChildHome profile={child} />
        ) : (
          <EmptyState
            icon={<Baby className="size-6" />}
            title="No child profile yet"
            description="Add a baby or young child to get age-appropriate feeding guidance, a food introduction tracker and growth records."
            action={
              <Button asChild>
                <Link href="/profile/family">Add a child profile</Link>
              </Button>
            }
          />
        )}
      </PageBody>
    </>
  )
}

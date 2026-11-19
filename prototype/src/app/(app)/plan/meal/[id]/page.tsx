"use client"

import { Suspense } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { PageBody, PageHeader } from "@/components/app/page"
import { MealActions, type MealView } from "@/components/plan/meal-actions"

/** Full-page meal task, reached from notifications, calendar links and the recipe screen (§42.16, §15.3). */
export default function MealPage() {
  return (
    <>
      <PageHeader title="Meal" back="/plan" />
      <PageBody>
        <Suspense fallback={null}>
          <MealBody />
        </Suspense>
      </PageBody>
    </>
  )
}

function MealBody() {
  const { id } = useParams<{ id: string }>()
  const view = useSearchParams().get("view")
  const initial: MealView = view === "swap" || view === "reschedule" ? view : "main"
  return <MealActions key={`${id}-${initial}`} mealId={id} page initialView={initial} />
}

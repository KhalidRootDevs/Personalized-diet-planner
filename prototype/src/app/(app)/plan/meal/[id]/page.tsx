"use client"

import { useParams } from "next/navigation"
import { PageBody, PageHeader } from "@/components/app/page"
import { MealActions } from "@/components/plan/meal-actions"

/** Full-page meal task, reached from notifications and calendar links (§42.16). */
export default function MealPage() {
  const { id } = useParams<{ id: string }>()
  return (
    <>
      <PageHeader title="Meal" back="/plan" />
      <PageBody>
        <MealActions mealId={id} page />
      </PageBody>
    </>
  )
}

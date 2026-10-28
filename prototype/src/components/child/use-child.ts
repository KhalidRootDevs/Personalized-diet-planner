"use client"

import { useApp } from "@/lib/store"

/** The active child profile, or the first child when an adult is active. */
export function useChildProfile() {
  const profiles = useApp((s) => s.profiles)
  const activeId = useApp((s) => s.activeProfileId)
  const children = profiles.filter((p) => p.type !== "adult")
  return children.find((p) => p.id === activeId) ?? children[0]
}

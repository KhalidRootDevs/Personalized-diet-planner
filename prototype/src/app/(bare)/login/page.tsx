"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useApp } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field } from "@/components/app/controls"
import { AuthShell, OrDivider, SocialButtons } from "@/components/profile/auth-shell"

export default function LoginPage() {
  const router = useRouter()
  const loadDemo = useApp((s) => s.loadDemo)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string>()

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError("Enter a valid email address.")
    if (password.length < 6) return setError("Password must be at least 6 characters.")
    // Prototype: any credentials work. A returning user gets the demo account so screens have data.
    loadDemo()
    router.push("/home")
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to continue your plan."
      footer={
        <>
          New to NutriPlan?{" "}
          <Link href="/signup" className="font-semibold text-forest hover:underline underline-offset-4">
            Create an account
          </Link>
        </>
      }
    >
      <SocialButtons
        onPick={() => {
          loadDemo()
          router.push("/home")
        }}
      />
      <OrDivider />
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Email" htmlFor="email">
          <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        </Field>
        <Field label="Password" htmlFor="password" error={error}>
          <Input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        <div className="-mt-1 flex justify-end">
          <Link href="/forgot-password" className="text-callout font-semibold text-forest hover:underline underline-offset-4">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" size="lg" className="w-full">
          Sign in
        </Button>
        <p className="text-caption text-center text-muted-foreground">Prototype: any email and password sign you in to the demo account.</p>
      </form>
    </AuthShell>
  )
}

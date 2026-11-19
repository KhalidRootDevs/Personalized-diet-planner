"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useApp } from "@/lib/store"
import { useTx } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field } from "@/components/app/controls"
import { AuthShell, OrDivider, SocialButtons } from "@/components/profile/auth-shell"

export default function LoginPage() {
  const router = useRouter()
  const signIn = useApp((s) => s.signIn)
  const tx = useTx()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string>()

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError("Enter a valid email address.")
    if (password.length < 6) return setError("Password must be at least 6 characters.")
    continueAs(email)
  }

  // Prototype sign-in keeps whatever is already on this device; it never overwrites local data with the demo.
  // With nothing stored, the person goes through onboarding. "Explore with demo data" is the only demo entry.
  const continueAs = (address: string, name?: string) => {
    const { user, onboarded } = useApp.getState()
    if (!user) signIn(address, name)
    router.push(onboarded ? "/home" : "/onboarding")
  }

  return (
    <AuthShell
      title={tx("Welcome back", "আবার স্বাগতম")}
      subtitle={tx("Sign in to continue your plan.", "পরিকল্পনা চালিয়ে যেতে সাইন ইন করুন।")}
      footer={
        <>
          {tx("New to NutriPlan?", "NutriPlan-এ নতুন?")}{" "}
          <Link href="/signup" className="font-semibold text-forest hover:underline underline-offset-4">
            {tx("Create an account", "অ্যাকাউন্ট খুলুন")}
          </Link>
        </>
      }
    >
      <SocialButtons
        onPick={(p) => continueAs(p === "Google" ? "user@example.com" : "+8801700000000@phone")}
      />
      <OrDivider />
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label={tx("Email", "ইমেইল")} htmlFor="email">
          <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        </Field>
        <Field label={tx("Password", "পাসওয়ার্ড")} htmlFor="password" error={error}>
          <Input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        <div className="-mt-1 flex justify-end">
          <Link href="/forgot-password" className="text-callout font-semibold text-forest hover:underline underline-offset-4">
            {tx("Forgot password?", "পাসওয়ার্ড ভুলে গেছেন?")}
          </Link>
        </div>
        <Button type="submit" size="lg" className="w-full">
          {tx("Sign in", "সাইন ইন")}
        </Button>
        <p className="text-caption text-center text-muted-foreground">{tx("Prototype: any email and password work. Data already on this device is kept; otherwise you'll set up a profile.", "প্রোটোটাইপ: যেকোনো ইমেইল ও পাসওয়ার্ড কাজ করে। এই ডিভাইসের তথ্য রাখা হয়; না থাকলে প্রোফাইল তৈরি করবেন।")}</p>
      </form>
    </AuthShell>
  )
}

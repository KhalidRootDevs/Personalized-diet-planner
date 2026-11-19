"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useApp } from "@/lib/store"
import { useTx } from "@/lib/i18n"
import { InfoNote } from "@/components/app/alerts"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Field } from "@/components/app/controls"
import { AuthShell, OrDivider, SocialButtons } from "@/components/profile/auth-shell"

export default function SignupPage() {
  const router = useRouter()
  const signIn = useApp((s) => s.signIn)
  const resetDemo = useApp((s) => s.resetDemo)
  const updateSettings = useApp((s) => s.updateSettings)
  const existing = useApp((s) => s.onboarded)
  const tx = useTx()
  /** Prototype stores one account per device: a new account starts empty (keeping the language choice). */
  const startFresh = (address: string, displayName: string) => {
    const { settings, onboarded } = useApp.getState()
    if (onboarded) {
      resetDemo()
      updateSettings({ language: settings.language, showPhaseBadges: settings.showPhaseBadges })
    }
    signIn(address, displayName)
    router.push("/onboarding")
  }
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [terms, setTerms] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const next: Record<string, string> = {}
    if (!name.trim()) next.name = "Tell us what to call you."
    if (!/^\S+@\S+\.\S+$/.test(email)) next.email = "Enter a valid email address."
    if (password.length < 8) next.password = "Use at least 8 characters."
    if (!terms) next.terms = "Please accept the terms to continue."
    setErrors(next)
    if (Object.keys(next).length) return
    startFresh(email, name.trim())
  }

  return (
    <AuthShell
      title={tx("Create your account", "অ্যাকাউন্ট খুলুন")}
      subtitle={tx("It takes about 3 minutes to set up your first plan.", "প্রথম পরিকল্পনা তৈরি করতে প্রায় ৩ মিনিট লাগে।")}
      footer={
        <>
          {tx("Already have an account?", "আগে থেকেই অ্যাকাউন্ট আছে?")}{" "}
          <Link href="/login" className="font-semibold text-forest hover:underline underline-offset-4">
            {tx("Sign in", "সাইন ইন")}
          </Link>
        </>
      }
    >
      <SocialButtons
        onPick={(p) => startFresh(p === "Google" ? "user@example.com" : "+8801700000000@phone", "Friend")}
      />
      {existing && <InfoNote className="mb-3 p-3.5">{tx("This device already has a NutriPlan account. Sign in to keep it — creating a new account here replaces it (prototype).", "এই ডিভাইসে আগে থেকেই একটি অ্যাকাউন্ট আছে। রাখতে সাইন ইন করুন — নতুন অ্যাকাউন্ট খুললে এটি মুছে যাবে (প্রোটোটাইপ)।")}</InfoNote>}
      <OrDivider />
      <form onSubmit={submit} className="space-y-3.5" noValidate>
        <Field label={tx("Your name", "আপনার নাম")} htmlFor="name" error={errors.name}>
          <Input id="name" autoComplete="given-name" value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label={tx("Email", "ইমেইল")} htmlFor="email" error={errors.email}>
          <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        </Field>
        <Field label={tx("Password", "পাসওয়ার্ড")} htmlFor="password" error={errors.password}>
          <Input id="password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" />
        </Field>
        <div className="space-y-1">
          <label className="text-callout flex items-start gap-3">
            <Checkbox checked={terms} onCheckedChange={(v) => setTerms(v === true)} className="mt-0.5" />
            <span className="text-caption text-muted-foreground">
              I agree to the Terms and Privacy Policy. NutriPlan doesn&apos;t replace medical advice.
            </span>
          </label>
          {errors.terms && <p className="text-caption pl-8 font-medium text-safety">{errors.terms}</p>}
        </div>
        <Button type="submit" size="lg" className="w-full">
          {tx("Continue", "চালিয়ে যান")}
        </Button>
      </form>
    </AuthShell>
  )
}

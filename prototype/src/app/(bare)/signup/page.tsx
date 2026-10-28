"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useApp } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Field } from "@/components/app/controls"
import { AuthShell, OrDivider, SocialButtons } from "@/components/profile/auth-shell"

export default function SignupPage() {
  const router = useRouter()
  const signIn = useApp((s) => s.signIn)
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
    signIn(email, name.trim())
    router.push("/onboarding")
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="It takes about 3 minutes to set up your first plan."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-forest hover:underline underline-offset-4">
            Sign in
          </Link>
        </>
      }
    >
      <SocialButtons
        onPick={(p) => {
          signIn(p === "Google" ? "nadia@example.com" : "+8801700000000@phone", "Nadia")
          router.push("/onboarding")
        }}
      />
      <OrDivider />
      <form onSubmit={submit} className="space-y-5" noValidate>
        <Field label="Your name" htmlFor="name" error={errors.name}>
          <Input id="name" autoComplete="given-name" value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Email" htmlFor="email" error={errors.email}>
          <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        </Field>
        <Field label="Password" htmlFor="password" error={errors.password} hint="At least 8 characters.">
          <Input id="password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        <div className="space-y-1">
          <label className="text-callout flex items-start gap-3">
            <Checkbox checked={terms} onCheckedChange={(v) => setTerms(v === true)} className="mt-0.5" />
            <span className="text-muted-foreground">
              I agree to the Terms and Privacy Policy. NutriPlan offers nutrition guidance and does not replace medical advice.
            </span>
          </label>
          {errors.terms && <p className="text-caption pl-8 font-medium text-safety">{errors.terms}</p>}
        </div>
        <Button type="submit" size="lg" className="mt-2 w-full">
          Continue
        </Button>
      </form>
    </AuthShell>
  )
}

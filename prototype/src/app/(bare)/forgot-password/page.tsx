"use client"

import { useState } from "react"
import Link from "next/link"
import { MailCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field } from "@/components/profile/form-bits"
import { AuthShell } from "@/components/profile/auth-shell"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string>()

  return (
    <AuthShell back="/login" title={sent ? "Check your email" : "Reset your password"} subtitle={sent ? undefined : "We'll send a link to reset it."}>
      {sent ? (
        <div className="space-y-6">
          <div className="flex gap-3 rounded-2xl border bg-card p-4">
            <MailCheck className="size-6 shrink-0 text-forest" aria-hidden />
            <p className="text-sm text-muted-foreground">
              If an account exists for <strong className="text-charcoal">{email}</strong>, a reset link is on its way. It expires in 30 minutes. (Prototype: no email is sent.)
            </p>
          </div>
          <Button asChild size="lg" className="w-full">
            <Link href="/login">Back to sign in</Link>
          </Button>
        </div>
      ) : (
        <form
          className="space-y-4"
          noValidate
          onSubmit={(e) => {
            e.preventDefault()
            if (!/^\S+@\S+\.\S+$/.test(email)) return setError("Enter a valid email address.")
            setSent(true)
          }}
        >
          <Field label="Email" htmlFor="email" error={error}>
            <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Button type="submit" size="lg" className="w-full">
            Send reset link
          </Button>
        </form>
      )}
    </AuthShell>
  )
}

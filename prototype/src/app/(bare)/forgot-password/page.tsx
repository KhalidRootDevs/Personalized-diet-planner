"use client"

import { useState } from "react"
import Link from "next/link"
import { MailCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field } from "@/components/app/controls"
import { AuthShell } from "@/components/profile/auth-shell"
import { IconTile } from "@/components/app/page"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string>()

  return (
    <AuthShell back="/login" title={sent ? "Check your email" : "Reset your password"} subtitle={sent ? undefined : "We'll send a link to reset it."}>
      {sent ? (
        <div className="space-y-6">
          <div className="flex gap-3 rounded-2xl border border-border/80 bg-card p-4">
            <IconTile>
              <MailCheck aria-hidden />
            </IconTile>
            <p className="text-callout text-muted-foreground">
              If an account exists for <strong className="text-charcoal">{email}</strong>, a reset link is on its way. It expires in 30 minutes. (Prototype: no email is sent.)
            </p>
          </div>
          <Button asChild size="lg" className="w-full">
            <Link href="/login">Back to sign in</Link>
          </Button>
        </div>
      ) : (
        <form
          className="space-y-5"
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

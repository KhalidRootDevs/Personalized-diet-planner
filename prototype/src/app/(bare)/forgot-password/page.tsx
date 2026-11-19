"use client"

import { useState } from "react"
import Link from "next/link"
import { MailCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field } from "@/components/app/controls"
import { AuthShell } from "@/components/profile/auth-shell"
import { IconTile } from "@/components/app/page"
import { useTx } from "@/lib/i18n"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string>()
  const tx = useTx()

  return (
    <AuthShell back="/login" title={sent ? tx("Check your email", "ইমেইল দেখুন") : tx("Reset your password", "পাসওয়ার্ড রিসেট করুন")} subtitle={sent ? undefined : tx("We'll send a link to reset it.", "রিসেট করার লিংক পাঠানো হবে।")}>
      {sent ? (
        <div className="space-y-6">
          <div className="flex gap-3 rounded-2xl bg-card p-4 shadow-card">
            <IconTile>
              <MailCheck aria-hidden />
            </IconTile>
            <p className="text-callout text-muted-foreground">
              If an account exists for <strong className="text-charcoal">{email}</strong>, a reset link is on its way. It expires in 30 minutes. (Prototype: no email is sent.)
            </p>
          </div>
          <Button asChild size="lg" className="w-full">
            <Link href="/login">{tx("Back to sign in", "সাইন ইনে ফিরে যান")}</Link>
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
          <Field label={tx("Email", "ইমেইল")} htmlFor="email" error={error}>
            <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Button type="submit" size="lg" className="w-full">
            {tx("Send reset link", "রিসেট লিংক পাঠান")}
          </Button>
        </form>
      )}
    </AuthShell>
  )
}

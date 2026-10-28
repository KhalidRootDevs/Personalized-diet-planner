export function toISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

export function todayISO(): string {
  return toISODate(new Date())
}

export function addDays(iso: string, n: number): string {
  const d = new Date(`${iso}T00:00:00`)
  d.setDate(d.getDate() + n)
  return toISODate(d)
}

export function fromISO(iso: string): Date {
  return new Date(`${iso}T00:00:00`)
}

export function formatDay(iso: string, opts: Intl.DateTimeFormatOptions = { weekday: "short", day: "numeric", month: "short" }): string {
  return fromISO(iso).toLocaleDateString("en-GB", opts)
}

export function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number)
  const suffix = h >= 12 ? "PM" : "AM"
  const hr = h % 12 === 0 ? 12 : h % 12
  return `${hr}:${String(m).padStart(2, "0")} ${suffix}`
}

export function greeting(d = new Date()): string {
  const h = d.getHours()
  if (h < 12) return "Good morning"
  if (h < 17) return "Good afternoon"
  return "Good evening"
}

export function nowHHMM(d = new Date()): string {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
}

export function startOfWeek(iso: string): string {
  const d = fromISO(iso)
  const day = (d.getDay() + 6) % 7 // Monday = 0
  return addDays(iso, -day)
}

export function uid(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`
}

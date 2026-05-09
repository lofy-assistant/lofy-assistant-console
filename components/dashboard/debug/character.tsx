"use client"

import { type FormEvent, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Bot, Loader2, Sparkles } from "lucide-react"

type CharacterResponse = {
  data?: {
    mode?: "character" | "fresh_user"
    user: {
      id: string
      email: string | null
      name: string | null
      phone?: string | null
      pin: string | null
      timezone: string | null
      aiPersona: string | null
      customInstruction: string | null
    }
    subscription?: {
      status: string
      currentPeriodEnd: string
    }
  }
  error?: string
  details?: string
}

export default function CharacterDebug() {
  const [creationMode, setCreationMode] = useState<"character" | "fresh_user">("character")
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [timezone, setTimezone] = useState("Asia/Kuala_Lumpur")
  const [aiPersona, setAiPersona] = useState("atlas")
  const [customInstruction, setCustomInstruction] = useState("")
  const [subscriptionStatus, setSubscriptionStatus] = useState("active")
  const [subscriptionEnd, setSubscriptionEnd] = useState("2099-12-31T23:59:59.000Z")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<CharacterResponse["data"] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch("/api/dashboard/debug/character", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creation_mode: creationMode,
          email: email.trim() || undefined,
          name: name.trim() || undefined,
          phone: phone.trim() || undefined,
          timezone: creationMode === "character" ? timezone.trim() || undefined : undefined,
          ai_persona: creationMode === "character" ? aiPersona : undefined,
          custom_instruction:
            creationMode === "character" ? customInstruction.trim() || undefined : undefined,
          subscription_status: creationMode === "character" ? subscriptionStatus : undefined,
          subscription_period_end: creationMode === "character" ? subscriptionEnd : undefined,
        }),
      })
      const data = (await response.json()) as CharacterResponse
      if (!response.ok || !data.data) {
        const details = data.details ? `\n${data.details}` : ""
        throw new Error(`${data.error || "Failed to create character"}${details}`)
      }

      setResult(data.data)
      setEmail("")
      setName("")
      setPhone("")
      setCustomInstruction("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create character")
    } finally {
      setLoading(false)
    }
  }

  const isFreshUser = creationMode === "fresh_user"
  const disableSubmit =
    loading || (isFreshUser ? !phone.trim() : !email.trim() && !name.trim() && !phone.trim())

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="size-5" />
            Character
          </CardTitle>
          <CardDescription>
            Create a staging-only playground character or first-text user.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="character-mode">Creation Mode</Label>
              <Select value={creationMode} onValueChange={(value) => setCreationMode(value as "character" | "fresh_user")}>
                <SelectTrigger id="character-mode" className="w-full md:w-[22rem]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="character">Full playground character</SelectItem>
                  <SelectItem value="fresh_user">Fresh first-text user</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Fresh first-text users match the WhatsApp path before registration: phone only in
                Postgres, plus a Mongo profile keyed by user ID.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="character-email">Email</Label>
                <Input
                  id="character-email"
                  type="email"
                  placeholder="character@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={isFreshUser}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="character-name">Display Name</Label>
                <Input
                  id="character-name"
                  placeholder="Demo Character"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  disabled={isFreshUser}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="character-phone">
                  {isFreshUser ? "Phone or WhatsApp Sender Identifier" : "Phone or External Identifier"}
                </Label>
                <Input
                  id="character-phone"
                  placeholder={isFreshUser ? "60123456789" : "Optional debug identifier"}
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="character-timezone">Timezone</Label>
                <Input
                  id="character-timezone"
                  value={timezone}
                  onChange={(event) => setTimezone(event.target.value)}
                  disabled={isFreshUser}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="character-persona">Persona</Label>
                <Select value={aiPersona} onValueChange={setAiPersona} disabled={isFreshUser}>
                  <SelectTrigger id="character-persona" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="atlas">atlas</SelectItem>
                    <SelectItem value="brad">brad</SelectItem>
                    <SelectItem value="lexi">lexi</SelectItem>
                    <SelectItem value="rocco">rocco</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="character-subscription">Subscription</Label>
                <Select value={subscriptionStatus} onValueChange={setSubscriptionStatus} disabled={isFreshUser}>
                  <SelectTrigger id="character-subscription" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">active</SelectItem>
                    <SelectItem value="trialing">trialing</SelectItem>
                    <SelectItem value="inactive">inactive</SelectItem>
                    <SelectItem value="past_due">past_due</SelectItem>
                    <SelectItem value="canceled">canceled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="character-subscription-end">Subscription Period End</Label>
                <Input
                  id="character-subscription-end"
                  value={subscriptionEnd}
                  onChange={(event) => setSubscriptionEnd(event.target.value)}
                  disabled={isFreshUser}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="character-instruction">Custom Instruction</Label>
              <Textarea
                id="character-instruction"
                placeholder="Example: This character is testing calendar-heavy workflows."
                value={customInstruction}
                onChange={(event) => setCustomInstruction(event.target.value)}
                disabled={isFreshUser}
              />
            </div>

            <Button type="submit" disabled={disableSubmit}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              {isFreshUser ? "Create fresh user" : "Create character"}
            </Button>
          </form>

          {error && (
            <div className="mt-5 whitespace-pre-wrap rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {result && (
            <div className="mt-5 space-y-3 rounded-lg border bg-muted/30 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium">
                  {result.mode === "fresh_user" ? "Fresh user created" : "Staging character created"}
                </p>
                <Badge variant="secondary">{result.user.id}</Badge>
                {result.subscription && <Badge variant="outline">{result.subscription.status}</Badge>}
              </div>
              <div className="grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
                <p>
                  Name: <span className="text-foreground">{result.user.name || "Not set"}</span>
                </p>
                <p>
                  Email: <span className="text-foreground">{result.user.email || "Not set"}</span>
                </p>
                {result.user.phone && (
                  <p>
                    Phone: <span className="text-foreground">{result.user.phone}</span>
                  </p>
                )}
                <p>
                  PIN: <span className="text-foreground">{result.user.pin || "Not set"}</span>
                </p>
                <p>
                  Timezone: <span className="text-foreground">{result.user.timezone || "Not set"}</span>
                </p>
                <p>
                  Persona: <span className="text-foreground">{result.user.aiPersona || "Not set"}</span>
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                Open Playground and pick this user from the staging user dropdown.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

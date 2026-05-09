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
    user: {
      id: string
      email: string | null
      name: string | null
      pin: string
      timezone: string
      aiPersona: string | null
      customInstruction: string | null
    }
    subscription: {
      status: string
      currentPeriodEnd: string
    }
  }
  error?: string
  details?: string
}

export default function CharacterDebug() {
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
          email: email.trim() || undefined,
          name: name.trim() || undefined,
          phone: phone.trim() || undefined,
          timezone: timezone.trim() || undefined,
          ai_persona: aiPersona,
          custom_instruction: customInstruction.trim() || undefined,
          subscription_status: subscriptionStatus,
          subscription_period_end: subscriptionEnd,
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

  const disableSubmit = loading || (!email.trim() && !name.trim() && !phone.trim())

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="size-5" />
            Character
          </CardTitle>
          <CardDescription>
            Create a staging-only user for the playground.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="character-email">Email</Label>
                <Input
                  id="character-email"
                  type="email"
                  placeholder="character@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="character-name">Display Name</Label>
                <Input
                  id="character-name"
                  placeholder="Demo Character"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="character-phone">Phone or External Identifier</Label>
                <Input
                  id="character-phone"
                  placeholder="Optional debug identifier"
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
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="character-persona">Persona</Label>
                <Select value={aiPersona} onValueChange={setAiPersona}>
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
                <Select value={subscriptionStatus} onValueChange={setSubscriptionStatus}>
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
              />
            </div>

            <Button type="submit" disabled={disableSubmit}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              Create character
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
                <p className="font-medium">Staging character created</p>
                <Badge variant="secondary">{result.user.id}</Badge>
                <Badge variant="outline">{result.subscription.status}</Badge>
              </div>
              <div className="grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
                <p>
                  Name: <span className="text-foreground">{result.user.name || "Not set"}</span>
                </p>
                <p>
                  Email: <span className="text-foreground">{result.user.email || "Not set"}</span>
                </p>
                <p>
                  PIN: <span className="text-foreground">{result.user.pin}</span>
                </p>
                <p>
                  Timezone: <span className="text-foreground">{result.user.timezone}</span>
                </p>
                <p>
                  Persona: <span className="text-foreground">{result.user.aiPersona || "Not set"}</span>
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                Paste the UUID into the Playground custom user ID field to load this staging character.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Bot, ChevronDown, Loader2, RefreshCw, Send, User } from "lucide-react"

interface PlaygroundResponse {
  response?: string
  backend_label?: string
  error?: string
  details?: string
  endpoint?: string
}

interface PlaygroundContextResponse {
  data?: {
    user: {
      id: string
      name: string | null
      email: string | null
      aiPersona: string | null
      createdAt: string
      updatedAt: string
      subscriptionStatus: string | null
      subscriptionPeriodEnd: string | null
      mongoProfile: {
        exists: boolean
        timezone: string | null
      }
      messageCount: number
      latestMessageAt: string | null
    }
    conversationState: {
      state: string | null
      updatedAt: string | null
    }
    recentMessages: Array<{
      id: string
      role: "user" | "assistant"
      content: string
      createdAt: string
    }>
  }
  error?: string
  details?: string
}

interface ActorsResponse {
  actors: Array<{ id: string; label: string }>
  warning?: string
}

interface ActiveAccountContext {
  userId: string
  accountLabel: string
}

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  context: ActiveAccountContext
}

function formatDateTime(value?: string | Date | null) {
  if (!value) {
    return "Not available"
  }

  const parsed = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return "Not available"
  }

  return parsed.toLocaleString()
}

function truncateText(value: string, maxLength = 120) {
  const trimmed = value.trim()
  if (trimmed.length <= maxLength) {
    return trimmed
  }

  return `${trimmed.slice(0, maxLength - 3)}...`
}

export function Playground() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [draftUserId, setDraftUserId] = useState("")
  const [activeUserId, setActiveUserId] = useState<string | null>(null)
  const [contextData, setContextData] = useState<PlaygroundContextResponse["data"] | null>(null)
  const [contextError, setContextError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isContextLoading, setIsContextLoading] = useState(false)
  const [backendLabel, setBackendLabel] = useState<string>("playground core")
  const [actors, setActors] = useState<ActorsResponse["actors"]>([])
  const [actorsWarning, setActorsWarning] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const response = await fetch("/api/dashboard/debug/playground/actors", { cache: "no-store" })
        const data = (await response.json()) as ActorsResponse
        if (!cancelled && response.ok) {
          setActors(data.actors ?? [])
          setActorsWarning(typeof data.warning === "string" ? data.warning : null)
        }
      } catch {
        if (!cancelled) {
          setActors([])
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const selectedAccountLabel =
    contextData?.user.name?.trim() ||
    contextData?.user.email ||
    actors.find((a) => a.id === activeUserId)?.label ||
    activeUserId ||
    "test account"

  const presetSelectValue = actors.some((a) => a.id === draftUserId) ? draftUserId : undefined

  const loadUserContext = async (
    requestedUserId = draftUserId,
    options?: { preserveTranscript?: boolean; keepDraftValue?: boolean }
  ) => {
    const userId = requestedUserId.trim()
    if (!userId) {
      setContextError("Enter a user UUID or pick a preset actor, then load context.")
      return false
    }

    setContextError(null)
    setIsContextLoading(true)

    try {
      const response = await fetch(
        `/api/dashboard/debug/playground/context?userId=${encodeURIComponent(userId)}`,
        {
          cache: "no-store",
        }
      )
      const data = (await response.json()) as PlaygroundContextResponse

      if (!response.ok || !data.data) {
        const details = data.details ? `\n${data.details}` : ""
        throw new Error(`${data.error || "Failed to load user context"}${details}`)
      }

      setActiveUserId(userId)
      setContextData(data.data)
      if (!options?.keepDraftValue) {
        setDraftUserId(userId)
      }
      if (!options?.preserveTranscript) {
        setMessages([])
      }

      return true
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load user context from playground core."
      setContextError(message)
      return false
    } finally {
      setIsContextLoading(false)
    }
  }

  const handleSend = async () => {
    if (!input.trim() || isLoading || !activeUserId) return

    const context: ActiveAccountContext = {
      userId: activeUserId,
      accountLabel: selectedAccountLabel,
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
      context,
    }

    const nextMessages = [...messages, userMessage]
    setMessages(nextMessages)
    setInput("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/dashboard/debug/playground", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: activeUserId,
          message: userMessage.content,
        }),
      })

      const data = (await response.json()) as PlaygroundResponse

      if (!response.ok) {
        const errorDetails = data.details ? `\n${data.details}` : ""
        const endpoint = data.endpoint ? `\nEndpoint: ${data.endpoint}` : ""
        throw new Error(`${data.error || "Failed to get response"}${errorDetails}${endpoint}`)
      }

      if (data.backend_label) {
        setBackendLabel(data.backend_label)
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response || "No response received",
        timestamp: new Date(),
        context,
      }

      setMessages((prev) => [...prev, assistantMessage])
      void loadUserContext(activeUserId, {
        preserveTranscript: true,
        keepDraftValue: true,
      })
    } catch (error) {
      console.error("Error sending message:", error)

      let errorContent = "Sorry, there was an error processing your request."
      if (error instanceof Error) {
        errorContent += `\n\nError: ${error.message}`
      }

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: errorContent,
        timestamp: new Date(),
        context,
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleUserIdKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      void loadUserContext()
    }
  }

  return (
    <div className="flex h-[calc(100vh-3rem)] min-h-0 flex-col gap-4">
      <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row">
        <div className="flex min-h-0 min-w-0 flex-[3] flex-col gap-4">
          <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <CardHeader className="shrink-0 border-b">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle className="flex items-center gap-2">
                  <Bot className="size-5 text-primary" />
                  AI Playground
                </CardTitle>
                {activeUserId && (
                  <Badge variant="outline" className="max-w-full truncate">
                    {selectedAccountLabel}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="min-h-0 flex-1 overflow-y-auto p-4">
              {!activeUserId ? (
                <div className="flex h-full min-h-[12rem] items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <Bot className="mx-auto mb-4 size-12 opacity-50" />
                    <p className="text-lg font-medium">Load a test account</p>
                    <p className="text-sm">
                      Pick a preset actor or enter a UUID on the right, then load context. Chat runs on
                      the playground core using that canonical user ID.
                    </p>
                  </div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex h-full min-h-[12rem] items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <Bot className="mx-auto mb-4 size-12 opacity-50" />
                    <p className="text-lg font-medium">Start a conversation</p>
                    <p className="text-sm">
                      Messages use the loaded account&apos;s canonical user ID; the console does not query
                      that user in production databases.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      {message.role === "assistant" && (
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <Bot className="size-4" />
                        </div>
                      )}
                      <div className="flex max-w-[78%] flex-col gap-2">
                        <div
                          className={`rounded-lg px-4 py-2 ${
                            message.role === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-foreground"
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{message.content}</p>
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                          <span>{message.timestamp.toLocaleTimeString()}</span>
                          <span>{message.context.accountLabel}</span>
                          <span>{message.context.userId}</span>
                        </div>
                      </div>
                      {message.role === "user" && (
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                          <User className="size-4" />
                        </div>
                      )}
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start gap-3">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Bot className="size-4" />
                      </div>
                      <div className="flex items-center gap-2 rounded-lg bg-muted px-4 py-2">
                        <Loader2 className="size-4 animate-spin" />
                        <span className="text-sm text-muted-foreground">Thinking...</span>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shrink-0">
            <CardContent className="p-4">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Type your message..."
                  disabled={isLoading || !activeUserId}
                  className="flex-1"
                />
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading || !activeUserId}
                  size="icon"
                  className="shrink-0"
                >
                  {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                </Button>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Messages are proxied to the playground core with the loaded user ID. Backend host:{" "}
                <span className="font-medium text-foreground">{backendLabel}</span>
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="flex min-h-0 min-w-0 flex-[2] flex-col">
          <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <CardHeader className="shrink-0 border-b">
              <CardTitle className="text-base">Test account</CardTitle>
            </CardHeader>
            <CardContent className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
              {actors.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Preset actors</p>
                  <Select
                    value={presetSelectValue}
                    onValueChange={(value) => {
                      setDraftUserId(value)
                      setContextError(null)
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose a preset…" />
                    </SelectTrigger>
                    <SelectContent>
                      {actors.map((actor) => (
                        <SelectItem key={actor.id} value={actor.id}>
                          {actor.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {actorsWarning && (
                    <p className="text-xs text-amber-600 dark:text-amber-500">{actorsWarning}</p>
                  )}
                </div>
              )}

              <Collapsible defaultOpen={actors.length === 0} className="space-y-2">
                <CollapsibleTrigger asChild>
                  <Button variant="outline" size="sm" type="button" className="flex w-full items-center justify-between gap-2">
                    <span className="text-sm">Custom user ID</span>
                    <ChevronDown className="size-4 shrink-0 opacity-60" />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Paste any canonical UUID the playground core knows about (e.g. a staging-only test
                    user).
                  </p>
                  <div className="flex gap-2">
                    <Input
                      value={draftUserId}
                      onChange={(e) => setDraftUserId(e.target.value)}
                      onKeyDown={handleUserIdKeyPress}
                      placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                      disabled={isContextLoading}
                    />
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <div className="flex gap-2">
                <Button onClick={() => void loadUserContext()} disabled={isContextLoading} className="flex-1">
                  {isContextLoading ? <Loader2 className="size-4 animate-spin" /> : "Load context"}
                </Button>
              </div>

              {contextError && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                  {contextError}
                </div>
              )}

              {contextData ? (
                <>
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="font-medium text-foreground">
                          {contextData.user.name || "Unnamed user"}
                        </p>
                        <p className="break-all text-xs text-muted-foreground">
                          {contextData.user.email || contextData.user.id}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          void loadUserContext(activeUserId ?? draftUserId, {
                            preserveTranscript: true,
                            keepDraftValue: true,
                          })
                        }
                        disabled={isContextLoading || !activeUserId}
                      >
                        <RefreshCw className={`size-4 ${isContextLoading ? "animate-spin" : ""}`} />
                      </Button>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge variant="secondary">{contextData.user.id}</Badge>
                      {contextData.user.subscriptionStatus && (
                        <Badge variant="outline">{contextData.user.subscriptionStatus}</Badge>
                      )}
                      {contextData.user.aiPersona && (
                        <Badge variant="outline">Persona {contextData.user.aiPersona}</Badge>
                      )}
                      <Badge variant={contextData.user.mongoProfile.exists ? "default" : "outline"}>
                        {contextData.user.mongoProfile.exists ? "Mongo profile found" : "No Mongo profile"}
                      </Badge>
                    </div>

                    <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                      <p>
                        Mongo timezone:{" "}
                        <span className="text-foreground">
                          {contextData.user.mongoProfile.timezone || "Not set"}
                        </span>
                      </p>
                      <p>
                        Recent messages:{" "}
                        <span className="text-foreground">{contextData.user.messageCount}</span>
                      </p>
                      <p>
                        Latest activity:{" "}
                        <span className="text-foreground">
                          {formatDateTime(contextData.user.latestMessageAt)}
                        </span>
                      </p>
                      <p>
                        Conversation state:{" "}
                        <span className="text-foreground">
                          {contextData.conversationState.state || "unknown"}
                        </span>
                      </p>
                      <p>
                        Subscription period end:{" "}
                        <span className="text-foreground">
                          {formatDateTime(contextData.user.subscriptionPeriodEnd)}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">Past chats</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setMessages([])}
                      disabled={messages.length === 0 || isLoading}
                    >
                      Clear transcript
                    </Button>
                  </div>

                  {contextData.recentMessages.length === 0 ? (
                    <div className="rounded-lg border border-dashed px-3 py-4 text-sm text-muted-foreground">
                      No stored chat history for this account yet (from playground core).
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {contextData.recentMessages.map((entry) => (
                        <div key={entry.id} className="rounded-lg border p-3">
                          <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                            <Badge variant={entry.role === "assistant" ? "outline" : "secondary"}>
                              {entry.role}
                            </Badge>
                            <span>{formatDateTime(entry.createdAt)}</span>
                          </div>
                          <p className="text-sm text-foreground">
                            {truncateText(entry.content || "(empty message)")}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="rounded-lg border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                    Context and chat are served by the playground core deployment (staging data). The
                    console dashboard elsewhere still uses production Supabase/Mongo.
                  </div>
                </>
              ) : (
                <div className="rounded-lg border border-dashed px-3 py-4 text-sm text-muted-foreground">
                  Load context to inspect the user as seen by the playground core (Postgres + Mongo on
                  that deployment).
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

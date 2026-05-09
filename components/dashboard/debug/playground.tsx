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
import { Bot, ImageIcon, Loader2, Mic, RefreshCw, Send, Square, User, X } from "lucide-react"

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
      timezone: string | null
      messageCount: number
      latestMessageAt: string | null
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
  actors: Array<{ id: string; label: string; name: string | null; email: string | null }>
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

interface DraftMedia {
  type: "image" | "audio"
  mime_type: string
  data_base64: string
  filename: string
  size: number
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

function formatBytes(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "0 B"
  const units = ["B", "KB", "MB"]
  let size = value
  let unitIndex = 0
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex += 1
  }
  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`
}

export function Playground() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [draftMedia, setDraftMedia] = useState<DraftMedia | null>(null)
  const [draftUserId, setDraftUserId] = useState("")
  const [activeUserId, setActiveUserId] = useState<string | null>(null)
  const [contextData, setContextData] = useState<PlaygroundContextResponse["data"] | null>(null)
  const [contextError, setContextError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isContextLoading, setIsContextLoading] = useState(false)
  const [backendLabel, setBackendLabel] = useState<string>("playground core")
  const [actors, setActors] = useState<ActorsResponse["actors"]>([])
  const [actorsWarning, setActorsWarning] = useState<string | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [mediaError, setMediaError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const audioInputRef = useRef<HTMLInputElement>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const recordingChunksRef = useRef<Blob[]>([])

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

  const canSend = Boolean((input.trim() || draftMedia) && !isLoading && activeUserId)

  const mediaSummary = draftMedia
    ? `${draftMedia.type === "image" ? "Image" : "Voice"} · ${draftMedia.filename} · ${formatBytes(draftMedia.size)}`
    : null

  const loadUserContext = async (
    requestedUserId = draftUserId,
    options?: { preserveTranscript?: boolean; keepDraftValue?: boolean }
  ) => {
    const userId = requestedUserId.trim()
    if (!userId) {
      setContextError("Choose a staging user, then load context.")
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

  const readMediaFile = async (file: File, type: DraftMedia["type"]) => {
    setMediaError(null)
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result || ""))
      reader.onerror = () => reject(new Error("Could not read media file"))
      reader.readAsDataURL(file)
    })
    const [, data_base64 = ""] = dataUrl.split(",", 2)
    if (!data_base64) {
      setMediaError("Could not prepare that file for upload.")
      return
    }
    setDraftMedia({
      type,
      mime_type: file.type || (type === "image" ? "image/jpeg" : "audio/webm"),
      data_base64,
      filename: file.name || (type === "image" ? "image-upload" : "voice-note"),
      size: file.size,
    })
  }

  const handleMediaPick = (file: File | undefined, type: DraftMedia["type"]) => {
    if (!file) return
    void readMediaFile(file, type).catch((error) => {
      setMediaError(error instanceof Error ? error.message : "Could not read media file.")
    })
  }

  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setMediaError("Voice recording is not available in this browser.")
      return
    }

    try {
      setMediaError(null)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      recordingChunksRef.current = []
      recorderRef.current = recorder
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) recordingChunksRef.current.push(event.data)
      }
      recorder.onstop = () => {
        const mimeType = recorder.mimeType || "audio/webm"
        const blob = new Blob(recordingChunksRef.current, { type: mimeType })
        stream.getTracks().forEach((track) => track.stop())
        void readMediaFile(new File([blob], `voice-note-${Date.now()}.webm`, { type: mimeType }), "audio")
        setIsRecording(false)
      }
      recorder.start()
      setIsRecording(true)
    } catch (error) {
      setMediaError(error instanceof Error ? error.message : "Could not start voice recording.")
      setIsRecording(false)
    }
  }

  const stopRecording = () => {
    recorderRef.current?.stop()
  }

  const handleSend = async () => {
    if (!canSend || !activeUserId) return

    const context: ActiveAccountContext = {
      userId: activeUserId,
      accountLabel: selectedAccountLabel,
    }

    const content = [
      input.trim(),
      mediaSummary ? `[Attached ${mediaSummary}]` : null,
    ].filter(Boolean).join("\n\n")

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date(),
      context,
    }

    const nextMessages = [...messages, userMessage]
    setMessages(nextMessages)
    setInput("")
    const mediaToSend = draftMedia
    setDraftMedia(null)
    setIsLoading(true)

    try {
      const response = await fetch("/api/dashboard/debug/playground", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: activeUserId,
          message: input.trim(),
          ...(mediaToSend
            ? {
                media: {
                  type: mediaToSend.type,
                  mime_type: mediaToSend.mime_type,
                  data_base64: mediaToSend.data_base64,
                  filename: mediaToSend.filename,
                },
              }
            : {}),
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
                    <p className="text-lg font-medium">Load a staging user</p>
                    <p className="text-sm">
                      Pick a staging user by name on the right, then load context. Chat runs on the
                      playground core using that canonical user ID.
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
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  handleMediaPick(event.target.files?.[0], "image")
                  event.target.value = ""
                }}
              />
              <input
                ref={audioInputRef}
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={(event) => {
                  handleMediaPick(event.target.files?.[0], "audio")
                  event.target.value = ""
                }}
              />
              {draftMedia && (
                <div className="mb-3 flex items-center justify-between gap-3 rounded-lg border bg-muted/30 px-3 py-2 text-sm">
                  <div className="flex min-w-0 items-center gap-2">
                    {draftMedia.type === "image" ? <ImageIcon className="size-4" /> : <Mic className="size-4" />}
                    <span className="truncate">{mediaSummary}</span>
                  </div>
                  <Button variant="ghost" size="icon" className="size-7 shrink-0" onClick={() => setDraftMedia(null)}>
                    <X className="size-4" />
                  </Button>
                </div>
              )}
              {mediaError && (
                <div className="mb-3 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                  {mediaError}
                </div>
              )}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={isLoading || !activeUserId}
                  className="shrink-0"
                  title="Attach image"
                >
                  <ImageIcon className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => audioInputRef.current?.click()}
                  disabled={isLoading || !activeUserId}
                  className="shrink-0"
                  title="Attach audio"
                >
                  <Mic className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant={isRecording ? "destructive" : "outline"}
                  size="icon"
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isLoading || !activeUserId}
                  className="shrink-0"
                  title={isRecording ? "Stop recording" : "Record voice note"}
                >
                  {isRecording ? <Square className="size-4" /> : <Mic className="size-4" />}
                </Button>
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder={draftMedia ? "Add an optional caption..." : "Type your message..."}
                  disabled={isLoading || !activeUserId}
                  className="flex-1"
                />
                <Button
                  onClick={handleSend}
                  disabled={!canSend}
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
                  <p className="text-sm font-medium">Staging user</p>
                  <Select
                    value={presetSelectValue}
                    onValueChange={(value) => {
                      setDraftUserId(value)
                      setContextError(null)
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose a staging user..." />
                    </SelectTrigger>
                    <SelectContent>
                      {actors.map((actor) => (
                        <SelectItem key={actor.id} value={actor.id} textValue={actor.label}>
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

              {actors.length === 0 && !actorsWarning && (
                <div className="rounded-lg border border-dashed px-3 py-4 text-sm text-muted-foreground">
                  No staging users found.
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={() => void loadUserContext()} disabled={isContextLoading || !draftUserId.trim()} className="flex-1">
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
                    </div>

                    <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                      <p>
                        Timezone:{" "}
                        <span className="text-foreground">
                          {contextData.user.timezone || "Not set"}
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
                    User options are loaded from staging Postgres. Context and chat are served by the
                    playground core deployment (staging data).
                  </div>
                </>
              ) : (
                <div className="rounded-lg border border-dashed px-3 py-4 text-sm text-muted-foreground">
                  Load context to inspect the user as seen by the playground core.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

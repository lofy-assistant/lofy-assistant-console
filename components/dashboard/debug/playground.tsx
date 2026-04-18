"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Bot, ExternalLink, Loader2, Send, User } from "lucide-react"

type PlaygroundMode = "live-user" | "new-user" | "expired-trial" | "seasoned-user"
type PersonalityKey = "atlas" | "brad" | "lexi" | "rocco"
type SeededProfileKey = "ops-founder" | "sales-lead" | "personal-organizer"

interface UsageCall {
    call_type: string
    provider: string
    model: string
    input_tokens: number
    output_tokens: number
}

interface UsageSummary {
    total_input_tokens: number
    total_output_tokens: number
    calls: UsageCall[]
}

interface MessageContext {
    mode: PlaygroundMode
    personality: PersonalityKey
    seededProfileKey?: SeededProfileKey
}

interface Message {
    id: string
    role: "user" | "assistant"
    content: string
    timestamp: Date
    cta_url?: string
    cta_text?: string
    buttons?: unknown[]
    usage?: UsageSummary
    context: MessageContext
}

const MODE_OPTIONS: Array<{
    value: PlaygroundMode
    label: string
    description: string
}> = [
    {
        value: "live-user",
        label: "Live user",
        description: "Use the current Lofy account against staging with this playground session only.",
    },
    {
        value: "new-user",
        label: "New user flow",
        description: "Strip prior context and simulate a first-time user experience.",
    },
    {
        value: "expired-trial",
        label: "Expired trial",
        description: "Force the expired-trial persuasion flow for this session.",
    },
    {
        value: "seasoned-user",
        label: "Seasoned user",
        description: "Inject a seeded profile with rich dummy knowledge for testing.",
    },
]

const PERSONALITY_OPTIONS: Array<{ value: PersonalityKey; label: string }> = [
    { value: "atlas", label: "ATLAS" },
    { value: "brad", label: "Brad" },
    { value: "lexi", label: "Lexi" },
    { value: "rocco", label: "Rocco" },
]

const SEEDED_PROFILE_OPTIONS: Array<{
    value: SeededProfileKey
    label: string
    description: string
}> = [
    {
        value: "ops-founder",
        label: "Ops founder",
        description: "Fast-moving operator with calendar, travel, and investor context.",
    },
    {
        value: "sales-lead",
        label: "Sales lead",
        description: "Pipeline-heavy profile with customer follow-ups and deal stages.",
    },
    {
        value: "personal-organizer",
        label: "Personal organizer",
        description: "Personal-life memory heavy profile with family and admin context.",
    },
]

function formatUsage(usage?: UsageSummary) {
    if (!usage) {
        return null
    }

    const callSummary = usage.calls
        .map((call) => `${call.call_type} ${call.input_tokens}/${call.output_tokens}`)
        .join(" | ")

    return `Tokens ${usage.total_input_tokens}/${usage.total_output_tokens}${callSummary ? ` • ${callSummary}` : ""}`
}

function getModeMeta(mode: PlaygroundMode) {
    return MODE_OPTIONS.find((option) => option.value === mode) ?? MODE_OPTIONS[0]
}

function getPersonalityLabel(personality: PersonalityKey) {
    return PERSONALITY_OPTIONS.find((option) => option.value === personality)?.label ?? personality
}

function getSeededProfileMeta(profileKey?: SeededProfileKey) {
    if (!profileKey) {
        return null
    }
    return SEEDED_PROFILE_OPTIONS.find((option) => option.value === profileKey) ?? null
}

export function Playground() {
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [mode, setMode] = useState<PlaygroundMode>("live-user")
    const [personality, setPersonality] = useState<PersonalityKey>("atlas")
    const [seededProfileKey, setSeededProfileKey] = useState<SeededProfileKey>("ops-founder")
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const handleSend = async () => {
        if (!input.trim() || isLoading) return

        const context: MessageContext = {
            mode,
            personality,
            seededProfileKey: mode === "seasoned-user" ? seededProfileKey : undefined,
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
                    message: userMessage.content,
                    playground: {
                        mode: context.mode,
                        personality: context.personality,
                        seeded_profile_key: context.seededProfileKey,
                        include_token_usage: true,
                        conversation_history: messages.slice(-10).map((entry) => ({
                            role: entry.role,
                            content: entry.content,
                        })),
                    },
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                const errorDetails = data.details ? `\n${data.details}` : ""
                const endpoint = data.endpoint ? `\nEndpoint: ${data.endpoint}` : ""
                throw new Error(`${data.error || "Failed to get response"}${errorDetails}${endpoint}`)
            }

            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: data.response || "No response received",
                timestamp: new Date(),
                cta_url: data.cta_url,
                cta_text: data.cta_text,
                buttons: data.buttons,
                usage: data.usage,
                context,
            }

            setMessages((prev) => [...prev, assistantMessage])
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

    const currentMode = getModeMeta(mode)
    const currentSeededProfile = getSeededProfileMeta(
        mode === "seasoned-user" ? seededProfileKey : undefined
    )

    return (
        <div className="flex h-[calc(100vh-3rem)] flex-col gap-4">
            <Card>
                <CardHeader className="border-b">
                    <CardTitle className="flex items-center gap-2">
                        <Bot className="size-5 text-primary" />
                        AI Playground
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 p-4 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_auto]">
                    <div className="space-y-2">
                        <p className="text-sm font-medium">Mode</p>
                        <Select value={mode} onValueChange={(value) => setMode(value as PlaygroundMode)}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select a mode" />
                            </SelectTrigger>
                            <SelectContent>
                                {MODE_OPTIONS.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">{currentMode.description}</p>
                    </div>

                    <div className="space-y-2">
                        <p className="text-sm font-medium">Personality</p>
                        <Select
                            value={personality}
                            onValueChange={(value) => setPersonality(value as PersonalityKey)}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select personality" />
                            </SelectTrigger>
                            <SelectContent>
                                {PERSONALITY_OPTIONS.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                            Every request from this page is forced through the selected response personality.
                        </p>
                    </div>

                    <div className="flex items-start justify-end">
                        <Button
                            variant="outline"
                            onClick={() => setMessages([])}
                            disabled={messages.length === 0 || isLoading}
                        >
                            Clear transcript
                        </Button>
                    </div>

                    {mode === "seasoned-user" && (
                        <div className="space-y-2 md:col-span-2">
                            <p className="text-sm font-medium">Seeded profile</p>
                            <Select
                                value={seededProfileKey}
                                onValueChange={(value) => setSeededProfileKey(value as SeededProfileKey)}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select staged profile" />
                                </SelectTrigger>
                                <SelectContent>
                                    {SEEDED_PROFILE_OPTIONS.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                {currentSeededProfile?.description}
                            </p>
                        </div>
                    )}

                    <div className="rounded-lg border bg-muted/40 px-3 py-2 text-xs text-muted-foreground md:col-span-3">
                        Playground requests are routed to the staging AI backend and include the current in-browser
                        transcript, so mode changes stay scoped to this page instead of normal chat history.
                    </div>
                </CardContent>
            </Card>

            <Card className="flex flex-1 flex-col overflow-hidden">
                <CardContent className="flex-1 overflow-y-auto p-4">
                    {messages.length === 0 ? (
                        <div className="flex h-full items-center justify-center">
                            <div className="text-center text-muted-foreground">
                                <Bot className="mx-auto mb-4 size-12 opacity-50" />
                                <p className="text-lg font-medium">Start a conversation</p>
                                <p className="text-sm">Test staging AI flows, personas, and token usage from one place.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {messages.map((message) => {
                                const modeMeta = getModeMeta(message.context.mode)
                                const profileMeta = getSeededProfileMeta(message.context.seededProfileKey)
                                return (
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
                                                className={`rounded-lg px-4 py-2 ${message.role === "user"
                                                    ? "bg-primary text-primary-foreground"
                                                    : "bg-muted text-foreground"
                                                    }`}
                                            >
                                                <p className="whitespace-pre-wrap break-words">{message.content}</p>
                                            </div>
                                            <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                                                <span>{message.timestamp.toLocaleTimeString()}</span>
                                                <span>{modeMeta.label}</span>
                                                <span>{getPersonalityLabel(message.context.personality)}</span>
                                                {profileMeta && <span>{profileMeta.label}</span>}
                                            </div>
                                            {message.role === "assistant" && message.usage && (
                                                <p className="text-[11px] text-muted-foreground">
                                                    {formatUsage(message.usage)}
                                                </p>
                                            )}
                                            {message.role === "assistant" && message.cta_url && message.cta_text && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    asChild
                                                    className="w-fit"
                                                >
                                                    <a href={message.cta_url} target="_blank" rel="noopener noreferrer">
                                                        {message.cta_text}
                                                        <ExternalLink className="ml-2 size-3" />
                                                    </a>
                                                </Button>
                                            )}
                                        </div>
                                        {message.role === "user" && (
                                            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                                                <User className="size-4" />
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
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

            <Card>
                <CardContent className="p-4">
                    <div className="flex gap-2">
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyPress}
                            placeholder="Type your message..."
                            disabled={isLoading}
                            className="flex-1"
                        />
                        <Button
                            onClick={handleSend}
                            disabled={!input.trim() || isLoading}
                            size="icon"
                            className="shrink-0"
                        >
                            {isLoading ? (
                                <Loader2 className="size-4 animate-spin" />
                            ) : (
                                <Send className="size-4" />
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

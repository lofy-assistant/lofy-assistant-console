"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Send, Bot, User, Loader2, ExternalLink } from "lucide-react"

interface Message {
    id: string
    role: "user" | "assistant"
    content: string
    timestamp: Date
    cta_url?: string
    cta_text?: string
    buttons?: unknown[]
}

export function Playground() {
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const handleSend = async () => {
        if (!input.trim() || isLoading) return

        const userMessage: Message = {
            id: Date.now().toString(),
            role: "user",
            content: input.trim(),
            timestamp: new Date(),
        }

        setMessages((prev) => [...prev, userMessage])
        setInput("")
        setIsLoading(true)

        try {
            const response = await fetch("/api/dashboard/debug/playground", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ message: userMessage.content }),
            })

            const data = await response.json()

            if (!response.ok) {
                // Show detailed error from API
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
            }

            setMessages((prev) => [...prev, assistantMessage])
        } catch (error) {
            console.error("Error sending message:", error)

            let errorContent = "Sorry, there was an error processing your request."

            // Try to get more detailed error info
            if (error instanceof Error) {
                errorContent += `\n\nError: ${error.message}`
            }

            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: errorContent,
                timestamp: new Date(),
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
        <div className="flex h-[calc(100vh-3rem)] flex-col gap-4">
            <Card className="flex-1 flex flex-col overflow-hidden">
                <CardHeader className="border-b">
                    <CardTitle className="flex items-center gap-2">
                        <Bot className="size-5 text-primary" />
                        AI Playground
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto p-4">
                    {messages.length === 0 ? (
                        <div className="flex h-full items-center justify-center">
                            <div className="text-center text-muted-foreground">
                                <Bot className="mx-auto mb-4 size-12 opacity-50" />
                                <p className="text-lg font-medium">Start a conversation</p>
                                <p className="text-sm">Send a message to test the AI in staging</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {messages.map((message) => (
                                <div
                                    key={message.id}
                                    className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"
                                        }`}
                                >
                                    {message.role === "assistant" && (
                                        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                            <Bot className="size-4" />
                                        </div>
                                    )}
                                    <div className="flex flex-col gap-2 max-w-[70%]">
                                        <div
                                            className={`rounded-lg px-4 py-2 ${message.role === "user"
                                                ? "bg-primary text-primary-foreground"
                                                : "bg-muted text-foreground"
                                                }`}
                                        >
                                            <p className="whitespace-pre-wrap break-words">{message.content}</p>
                                            <p className="mt-1 text-xs opacity-70">
                                                {message.timestamp.toLocaleTimeString()}
                                            </p>
                                        </div>
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
                            ))}
                            {isLoading && (
                                <div className="flex gap-3 justify-start">
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
                            onKeyPress={handleKeyPress}
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

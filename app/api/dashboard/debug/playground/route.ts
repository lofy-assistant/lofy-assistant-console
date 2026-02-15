/**
 * AI Playground API Route
 * 
 * This endpoint forwards chat messages to the FastAPI backend for AI processing.
 * 
 * Configuration:
 * - Set FASTAPI_URL environment variable to your FastAPI backend URL
 * - Default: http://localhost:8000
 * - FastAPI endpoint: POST /standalone/chat
 * - Request body: { user_id: string, message: string }
 * - Response: { message: string, cta_url?: string, cta_text?: string, buttons?: unknown[] }
 */

import { NextRequest, NextResponse } from "next/server"
import { getSessionFromCookie } from "@/lib/session"

interface ChatResponse {
  message: string
  cta_url?: string
  cta_text?: string
  buttons?: unknown[]
}

export async function POST(request: NextRequest) {
  try {
    // Get the current user session
    const session = await getSessionFromCookie()
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Parse the request body
    const body = await request.json()
    const { message } = body

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      )
    }

    // Get FastAPI URL from environment variables
    const fastapiUrl = process.env.FASTAPI_URL
    
    if (!fastapiUrl) {
      console.error("FASTAPI_URL is not defined in environment variables")
      return NextResponse.json(
        { error: "FastAPI URL not configured" },
        { status: 500 }
      )
    }

    // Ensure we don't have double slashes if fastapiUrl ends with a slash
    const base = fastapiUrl.endsWith("/") ? fastapiUrl.slice(0, -1) : fastapiUrl
    // The standalone router has a prefix of "/standalone"
    const endpoint = `${base}/standalone/chat`

    console.log("Calling FastAPI endpoint:", endpoint)
    
    const requestPayload = {
      user_id: session.userId,
      message: message.trim(),
    }
    console.log("Request payload:", requestPayload)

    // Call the FastAPI backend with the correct format
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestPayload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("FastAPI error:", response.status, response.statusText, errorText)
      console.error("Attempted endpoint:", endpoint)
      return NextResponse.json(
        { 
          error: "Failed to get response from AI",
          details: `${response.status} ${response.statusText}`,
          endpoint: endpoint
        },
        { status: response.status }
      )
    }

    const data: ChatResponse = await response.json()

    // Return the response with all fields from FastAPI
    return NextResponse.json({
      response: data.message,
      cta_url: data.cta_url,
      cta_text: data.cta_text,
      buttons: data.buttons,
    })
  } catch (error) {
    console.error("Error in playground API:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

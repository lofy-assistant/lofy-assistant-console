"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"

export default function GeneralDebug() {
    const [email, setEmail] = useState("")
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<any>(null)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        setResult(null)

        try {
            const response = await fetch("/api/dashboard/debug/general", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email })
            })

            const data = await response.json()

            if (!response.ok) {
                setError(data.error || "Failed to update subscription")
            } else {
                setResult(data)
                setEmail("")
            }
        } catch (err) {
            setError("An error occurred while updating subscription")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="p-6">
            <Card>
                <CardHeader>
                    <CardTitle>Make User Permanent Active Subscriber</CardTitle>
                    <CardDescription>
                        Enter user email to set their subscription to active with expiry date in 2099
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">User Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="user@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Processing..." : "Update Subscription"}
                        </Button>
                    </form>

                    {error && (
                        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                            <p className="text-red-800 text-sm">{error}</p>
                        </div>
                    )}

                    {result && result.success && (
                        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
                            <p className="text-green-800 font-medium mb-2">{result.message}</p>
                            <div className="text-sm text-green-700 space-y-1">
                                <p><strong>User ID:</strong> {result.data.user_id}</p>
                                <p><strong>Email:</strong> {result.data.email}</p>
                                <p><strong>Status:</strong> {result.data.subscription_status}</p>
                                <p><strong>Expires:</strong> {new Date(result.data.current_period_end).toLocaleDateString()}</p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

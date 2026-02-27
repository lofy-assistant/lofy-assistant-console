import { NextResponse } from "next/server"
import { prisma } from "@/lib/database"

export async function POST(request: Request) {
    try {
        const { email } = await request.json()

        if (!email) {
            return NextResponse.json({ error: "Email is required" }, { status: 400 })
        }

        // Find user by email
        const user = await prisma.users.findUnique({
            where: { email }
        })

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        // Find subscription for this user
        const subscription = await prisma.subscriptions.findFirst({
            where: { user_id: user.id }
        })

        if (!subscription) {
            return NextResponse.json({ error: "Subscription not found for this user" }, { status: 404 })
        }

        // Update subscription to permanent active
        const updatedSubscription = await prisma.subscriptions.update({
            where: { id: subscription.id },
            data: {
                subscription_status: "active",
                current_period_end: new Date("2099-12-31T23:59:59Z"),
                stripe_customer_id: "",
                stripe_price_id: ""
            }
        })

        return NextResponse.json({
            success: true,
            message: "User subscription updated to permanent active",
            data: {
                user_id: user.id,
                email: user.email,
                subscription_status: updatedSubscription.subscription_status,
                current_period_end: updatedSubscription.current_period_end
            }
        })
    } catch (error) {
        console.error("Error updating subscription:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
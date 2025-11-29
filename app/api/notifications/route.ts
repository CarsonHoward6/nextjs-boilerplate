import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/getSession";

// GET /api/notifications - Fetch user's notifications
export async function GET(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const unreadOnly = searchParams.get("unread_only") === "true";

        let query = supabase
            .from("notifications")
            .select("*")
            .eq("user_id", session.user.id)
            .order("created_at", { ascending: false })
            .limit(50);

        if (unreadOnly) {
            query = query.eq("is_read", false);
        }

        const { data: notifications, error } = await query;

        if (error) {
            console.error("Error fetching notifications:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ notifications });
    } catch (error: any) {
        console.error("Error in GET /api/notifications:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST /api/notifications - Create a notification (internal use)
export async function POST(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { user_id, type, title, message, link } = body;

        if (!user_id || !type || !title || !message) {
            return NextResponse.json(
                { error: "user_id, type, title, and message are required" },
                { status: 400 }
            );
        }

        const { data: notification, error } = await supabase
            .from("notifications")
            .insert({
                user_id,
                type,
                title,
                message,
                link
            })
            .select()
            .single();

        if (error) {
            console.error("Error creating notification:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ notification }, { status: 201 });
    } catch (error: any) {
        console.error("Error in POST /api/notifications:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PATCH /api/notifications - Mark notifications as read
export async function PATCH(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { notification_ids, mark_all_read } = body;

        if (mark_all_read) {
            // Mark all user's notifications as read
            const { error } = await supabase
                .from("notifications")
                .update({ is_read: true })
                .eq("user_id", session.user.id)
                .eq("is_read", false);

            if (error) {
                console.error("Error marking all notifications as read:", error);
                return NextResponse.json({ error: error.message }, { status: 500 });
            }

            return NextResponse.json({ success: true });
        } else if (notification_ids && Array.isArray(notification_ids)) {
            // Mark specific notifications as read
            const { error } = await supabase
                .from("notifications")
                .update({ is_read: true })
                .in("id", notification_ids)
                .eq("user_id", session.user.id);

            if (error) {
                console.error("Error marking notifications as read:", error);
                return NextResponse.json({ error: error.message }, { status: 500 });
            }

            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json(
                { error: "Either notification_ids or mark_all_read must be provided" },
                { status: 400 }
            );
        }
    } catch (error: any) {
        console.error("Error in PATCH /api/notifications:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
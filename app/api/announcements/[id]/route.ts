import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/getSession";
import { getSupabase } from '@/lib/supabase';

interface AnnouncementUpdate {
    title?: string;
    content?: string;
    priority?: string;
    is_pinned?: boolean;
}

// PUT /api/announcements/[id]
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await getSession();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { title, content, priority, is_pinned } = body;

        const supabase = getSupabase();

        // Verify user is the author
        const { data: announcement } = await (supabase
            .from("announcements")
            .select("author_id")
            .eq("id", id)
            .maybeSingle() as any as Promise<{ data: { author_id: string } | null }>);

        if (!announcement) {
            return NextResponse.json({ error: "Announcement not found" }, { status: 404 });
        }

        if (announcement.author_id !== session.user.id) {
            return NextResponse.json(
                { error: "You can only edit your own announcements" },
                { status: 403 }
            );
        }

        // Update announcement
        const updateData: AnnouncementUpdate = {};
        if (title !== undefined) updateData.title = title;
        if (content !== undefined) updateData.content = content;
        if (priority !== undefined) updateData.priority = priority;
        if (is_pinned !== undefined) updateData.is_pinned = is_pinned;

        const { data: updated, error } = await ((supabase as any)
            .from("announcements")
            .update(updateData)
            .eq("id", id)
            .select(`
                *,
                author:author_id (
                    id,
                    full_name,
                    email
                )
            `)
            .maybeSingle());

        if (error) {
            console.error("Error updating announcement:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ announcement: updated });
    } catch (error) {
        console.error("Error in PUT /api/announcements/[id]:", error);
        return NextResponse.json({ error: error instanceof Error ? error.message : "An error occurred" }, { status: 500 });
    }
}

// DELETE /api/announcements/[id]
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await getSession();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const supabase = getSupabase();

        // Verify user is the author
        const { data: announcement } = await (supabase
            .from("announcements")
            .select("author_id")
            .eq("id", id)
            .maybeSingle() as any as Promise<{ data: { author_id: string } | null }>);

        if (!announcement) {
            return NextResponse.json({ error: "Announcement not found" }, { status: 404 });
        }

        if (announcement.author_id !== session.user.id) {
            return NextResponse.json(
                { error: "You can only delete your own announcements" },
                { status: 403 }
            );
        }

        // Delete announcement
        const { error } = await ((supabase as any)
            .from("announcements")
            .delete()
            .eq("id", id));

        if (error) {
            console.error("Error deleting announcement:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error in DELETE /api/announcements/[id]:", error);
        return NextResponse.json({ error: error instanceof Error ? error.message : "An error occurred" }, { status: 500 });
    }
}

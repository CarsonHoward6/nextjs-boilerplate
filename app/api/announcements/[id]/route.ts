import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/getSession";

// PUT /api/announcements/[id]
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getSession();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { title, content, priority, is_pinned } = body;

        // Verify user is the author
        const { data: announcement } = await supabase
            .from("announcements")
            .select("author_id")
            .eq("id", params.id)
            .single();

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
        const updateData: any = {};
        if (title !== undefined) updateData.title = title;
        if (content !== undefined) updateData.content = content;
        if (priority !== undefined) updateData.priority = priority;
        if (is_pinned !== undefined) updateData.is_pinned = is_pinned;

        const { data: updated, error } = await supabase
            .from("announcements")
            .update(updateData)
            .eq("id", params.id)
            .select(`
                *,
                author:author_id (
                    id,
                    full_name,
                    email
                )
            `)
            .single();

        if (error) {
            console.error("Error updating announcement:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ announcement: updated });
    } catch (error: any) {
        console.error("Error in PUT /api/announcements/[id]:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE /api/announcements/[id]
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getSession();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Verify user is the author
        const { data: announcement } = await supabase
            .from("announcements")
            .select("author_id")
            .eq("id", params.id)
            .single();

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
        const { error } = await supabase
            .from("announcements")
            .delete()
            .eq("id", params.id);

        if (error) {
            console.error("Error deleting announcement:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Error in DELETE /api/announcements/[id]:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

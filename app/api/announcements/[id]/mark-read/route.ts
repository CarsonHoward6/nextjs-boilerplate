import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/getSession";

// POST /api/announcements/[id]/mark-read
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await getSession();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Verify announcement exists and user has access to it
        const { data: announcement } = await supabase
            .from("announcements")
            .select("section_id")
            .eq("id", id)
            .single();

        if (!announcement) {
            return NextResponse.json({ error: "Announcement not found" }, { status: 404 });
        }

        // Verify user has access to this section
        const { data: userSection } = await supabase
            .from("user_sections")
            .select("*")
            .eq("user_id", session.user.id)
            .eq("section_id", announcement.section_id)
            .single();

        if (!userSection) {
            return NextResponse.json(
                { error: "Access denied to this announcement" },
                { status: 403 }
            );
        }

        // Mark as read (upsert to avoid duplicates)
        const { error } = await supabase
            .from("announcement_reads")
            .upsert(
                {
                    announcement_id: id,
                    user_id: session.user.id,
                    read_at: new Date().toISOString()
                },
                {
                    onConflict: "announcement_id,user_id"
                }
            );

        if (error) {
            console.error("Error marking announcement as read:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Error in POST /api/announcements/[id]/mark-read:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/getSession";

// GET /api/announcements?section_id=xxx
export async function GET(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const sectionId = searchParams.get("section_id");

        if (!sectionId) {
            return NextResponse.json({ error: "section_id is required" }, { status: 400 });
        }

        // Verify user has access to this section
        const { data: userSection } = await supabase
            .from("user_sections")
            .select("*")
            .eq("user_id", session.user.id)
            .eq("section_id", sectionId)
            .single();

        if (!userSection) {
            return NextResponse.json({ error: "Access denied to this section" }, { status: 403 });
        }

        // Fetch announcements for this section
        const { data: announcements, error } = await supabase
            .from("announcements")
            .select(`
                *,
                author:author_id (
                    id,
                    full_name,
                    email
                ),
                reads:announcement_reads(
                    user_id,
                    read_at
                )
            `)
            .eq("section_id", sectionId)
            .order("is_pinned", { ascending: false })
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error fetching announcements:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Add read status for current user
        const announcementsWithReadStatus = announcements.map(announcement => ({
            ...announcement,
            is_read: announcement.reads?.some((r: any) => r.user_id === session.user.id) || false,
            reads: undefined // Remove reads array from response
        }));

        return NextResponse.json({ announcements: announcementsWithReadStatus });
    } catch (error: any) {
        console.error("Error in GET /api/announcements:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST /api/announcements
export async function POST(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { section_id, title, content, priority, is_pinned } = body;

        if (!section_id || !title || !content) {
            return NextResponse.json(
                { error: "section_id, title, and content are required" },
                { status: 400 }
            );
        }

        // Verify user is a teacher or TA in this section
        const { data: userSection } = await supabase
            .from("user_sections")
            .select("role")
            .eq("user_id", session.user.id)
            .eq("section_id", section_id)
            .single();

        if (!userSection || !["teacher", "teacher_assistant"].includes(userSection.role)) {
            return NextResponse.json(
                { error: "Only teachers can create announcements" },
                { status: 403 }
            );
        }

        // Create announcement
        const { data: announcement, error } = await supabase
            .from("announcements")
            .insert({
                section_id,
                author_id: session.user.id,
                title,
                content,
                priority: priority || "normal",
                is_pinned: is_pinned || false
            })
            .select(`
                *,
                author:author_id (
                    id,
                    full_name,
                    email
                ),
                section:section_id (
                    id,
                    title,
                    course_id
                )
            `)
            .single();

        if (error) {
            console.error("Error creating announcement:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Create notifications for all users in this section (except the author)
        try {
            const { data: sectionUsers } = await supabase
                .from("user_sections")
                .select("user_id")
                .eq("section_id", section_id)
                .neq("user_id", session.user.id); // Don't notify the author

            if (sectionUsers && sectionUsers.length > 0) {
                const notifications = sectionUsers.map(su => ({
                    user_id: su.user_id,
                    type: "announcement",
                    title: `New ${priority === "urgent" ? "Urgent " : ""}Announcement: ${title}`,
                    message: content.substring(0, 150) + (content.length > 150 ? "..." : ""),
                    link: "/lms"
                }));

                await supabase
                    .from("notifications")
                    .insert(notifications);
            }
        } catch (notifError) {
            // Log error but don't fail the announcement creation
            console.error("Error creating notifications:", notifError);
        }

        return NextResponse.json({ announcement }, { status: 201 });
    } catch (error: any) {
        console.error("Error in POST /api/announcements:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
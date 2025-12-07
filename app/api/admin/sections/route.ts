import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
    try {
        const { userId, sectionId, role, userEmail, sectionTitle, courseTitle } = await request.json();

        if (!userId || !sectionId || !role) {
            return NextResponse.json(
                { error: "Missing userId, sectionId, or role" },
                { status: 400 }
            );
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !serviceKey) {
            return NextResponse.json({
                error: "Server configuration error"
            }, { status: 500 });
        }

        // Create admin client with service role to bypass RLS
        const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });

        // Add section assignment
        const { error } = await supabaseAdmin
            .from("user_sections")
            .insert({ user_id: userId, section_id: sectionId, role });

        if (error) {
            console.error("Error adding section assignment:", error);
            return NextResponse.json(
                { error: "Failed to add section assignment", details: error.message },
                { status: 500 }
            );
        }

        // Create notification for the user
        await supabaseAdmin
            .from("notifications")
            .insert({
                user_id: userId,
                message: `You have been assigned to ${courseTitle || "a course"} - ${sectionTitle || "Section"} as a ${role}`,
                notification_type: "course_assigned",
                related_section_id: sectionId
            });

        // If assigning a student, notify all teachers of that section
        if (role === "student") {
            const { data: teachers } = await supabaseAdmin
                .from("user_sections")
                .select("user_id")
                .eq("section_id", sectionId)
                .eq("role", "teacher");

            if (teachers && teachers.length > 0) {
                const teacherNotifications = teachers.map((t: any) => ({
                    user_id: t.user_id,
                    message: `${userEmail} has been assigned to your class: ${courseTitle} - ${sectionTitle}`,
                    notification_type: "student_assigned",
                    related_user_id: userId,
                    related_section_id: sectionId
                }));

                await supabaseAdmin
                    .from("notifications")
                    .insert(teacherNotifications);
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("API error:", error);
        return NextResponse.json({
            error: "Internal server error"
        }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { userId, sectionId } = await request.json();

        if (!userId || !sectionId) {
            return NextResponse.json(
                { error: "Missing userId or sectionId" },
                { status: 400 }
            );
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !serviceKey) {
            return NextResponse.json({
                error: "Server configuration error"
            }, { status: 500 });
        }

        // Create admin client with service role to bypass RLS
        const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });

        // Remove section assignment
        const { error } = await supabaseAdmin
            .from("user_sections")
            .delete()
            .eq("user_id", userId)
            .eq("section_id", sectionId);

        if (error) {
            console.error("Error removing section assignment:", error);
            return NextResponse.json(
                { error: "Failed to remove section assignment", details: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("API error:", error);
        return NextResponse.json({
            error: "Internal server error"
        }, { status: 500 });
    }
}

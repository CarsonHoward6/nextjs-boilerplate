import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
    try {
        const { userId, courseId, role, userEmail, courseTitle } = await request.json();

        if (!userId || !courseId || !role) {
            return NextResponse.json(
                { error: "Missing userId, courseId, or role" },
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

        // Add course assignment
        const { error } = await supabaseAdmin
            .from("user_courses")
            .insert({ user_id: userId, course_id: courseId, role });

        if (error) {
            console.error("Error adding course assignment:", error);
            return NextResponse.json(
                { error: "Failed to add course assignment", details: error.message },
                { status: 500 }
            );
        }

        // Create notification for the user
        await supabaseAdmin
            .from("notifications")
            .insert({
                user_id: userId,
                message: `You have been assigned to ${courseTitle || "a course"} as a ${role}`,
                notification_type: "course_assigned",
                related_course_id: courseId
            });

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
        const { userId, courseId } = await request.json();

        if (!userId || !courseId) {
            return NextResponse.json(
                { error: "Missing userId or courseId" },
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

        // Remove course assignment
        const { error } = await supabaseAdmin
            .from("user_courses")
            .delete()
            .eq("user_id", userId)
            .eq("course_id", courseId);

        if (error) {
            console.error("Error removing course assignment:", error);
            return NextResponse.json(
                { error: "Failed to remove course assignment", details: error.message },
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

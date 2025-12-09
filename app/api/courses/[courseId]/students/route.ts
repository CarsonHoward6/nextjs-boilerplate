import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ courseId: string }> }
) {
    try {
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

        const { courseId } = await params;

        // Get all users enrolled in this course
        const { data: enrollments, error } = await supabaseAdmin
            .from("user_courses")
            .select(`
                user_id,
                role,
                created_at,
                user:user_id (
                    id,
                    email,
                    full_name,
                    username
                )
            `)
            .eq("course_id", courseId);

        if (error) {
            console.error("Error fetching course enrollments:", error);
            return NextResponse.json(
                { error: "Failed to fetch enrollments", details: error.message },
                { status: 500 }
            );
        }

        // Transform the data
        const students = enrollments?.map(enrollment => {
            const user = Array.isArray(enrollment.user) ? enrollment.user[0] : enrollment.user;
            return {
                id: user?.id,
                email: user?.email,
                full_name: user?.full_name || "No name",
                username: user?.username,
                role: enrollment.role,
                enrolled_at: enrollment.created_at
            };
        }) || [];

        return NextResponse.json({ students });
    } catch (error) {
        console.error("API error:", error);
        return NextResponse.json({
            error: "Internal server error"
        }, { status: 500 });
    }
}

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
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

        // Fetch all user profiles
        const { data: profiles, error: profilesError } = await supabaseAdmin
            .from("user_profiles")
            .select("*")
            .order("created_at", { ascending: false });

        if (profilesError) {
            console.error("Error fetching profiles:", profilesError);
            return NextResponse.json(
                { error: "Failed to fetch profiles", details: profilesError.message },
                { status: 500 }
            );
        }

        // Fetch all user roles
        const { data: roles, error: rolesError } = await supabaseAdmin
            .from("user_roles")
            .select("*");

        if (rolesError) {
            console.error("Error fetching roles:", rolesError);
            return NextResponse.json(
                { error: "Failed to fetch roles", details: rolesError.message },
                { status: 500 }
            );
        }

        // Fetch all course assignments with course details
        const { data: courseAssignments, error: coursesError } = await supabaseAdmin
            .from("user_courses")
            .select(`
                *,
                course:course(*)
            `);

        if (coursesError) {
            console.error("Error fetching course assignments:", coursesError);
            return NextResponse.json(
                { error: "Failed to fetch course assignments", details: coursesError.message },
                { status: 500 }
            );
        }

        // Build user data structure combining profiles, roles, and courses
        const usersData = profiles?.map(profile => {
            // Get roles for this user
            const userRoles = roles?.filter(r => r.user_id === profile.id) || [];

            // Get course assignments for this user
            const userCourses = courseAssignments?.filter(ca => ca.user_id === profile.id) || [];

            return {
                id: profile.id,
                email: profile.email,
                username: profile.username,
                full_name: profile.full_name,
                created_at: profile.created_at,
                roles: userRoles.map(r => r.role),
                courses: userCourses.map(ca => ({
                    id: ca.course?.id,
                    title: ca.course?.title,
                    role: ca.role,
                    assigned_at: ca.created_at
                }))
            };
        }) || [];

        return NextResponse.json({ users: usersData });
    } catch (error) {
        console.error("API error:", error);
        return NextResponse.json({
            error: "Internal server error"
        }, { status: 500 });
    }
}

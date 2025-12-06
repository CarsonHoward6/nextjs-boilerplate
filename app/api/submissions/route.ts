import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/getSession";

export async function GET(request: NextRequest) {
    const session = await getSession();
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabase();

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get("courseId");
    const assignmentId = searchParams.get("assignmentId");
    const userId = searchParams.get("userId");

    let query = supabase
        .from("assignment_submissions")
        .select(`
            *,
            user_profiles:user_id (
                email,
                username,
                first_name,
                last_name
            )
        `)
        .order("submitted_at", { ascending: false });

    if (courseId) {
        query = query.eq("course_id", parseInt(courseId));
    }

    if (assignmentId) {
        query = query.eq("assignment_id", parseInt(assignmentId));
    }

    if (userId) {
        query = query.eq("user_id", userId);
    }

    const { data, error } = await query;

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
    const session = await getSession();
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabase();

    const body = await request.json();
    const { courseId, assignmentId, problemId, answer } = body;

    if (!courseId || !assignmentId || !problemId || !answer) {
        return NextResponse.json(
            { error: "Missing required fields" },
            { status: 400 }
        );
    }

    // Upsert submission (insert or update if exists)
    const { data, error } = await ((supabase as any)
        .from("assignment_submissions")
        .upsert({
            user_id: session.user.id,
            course_id: parseInt(courseId),
            assignment_id: parseInt(assignmentId),
            problem_id: parseInt(problemId),
            answer,
        }, {
            onConflict: "user_id,course_id,assignment_id,problem_id"
        })
        .select()
        .single());

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
}

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

    // Get student profile for notification
    const { data: profile } = await ((supabase as any)
        .from("user_profiles")
        .select("email, username")
        .eq("id", session.user.id)
        .single());

    // Get course name for notification
    const { data: course } = await ((supabase as any)
        .from("course")
        .select("title")
        .eq("id", courseId)
        .single());

    // Find all teachers for this course via sections
    const { data: teacherSections } = await ((supabase as any)
        .from("user_sections")
        .select(`
            user_id,
            section:section_id (
                course_id
            )
        `)
        .eq("role", "teacher"));

    // Filter teachers whose sections match this course
    const teacherIds = new Set<string>();
    if (teacherSections) {
        for (const ts of teacherSections) {
            const section = Array.isArray(ts.section) ? ts.section[0] : ts.section;
            if (section && section.course_id === courseId) {
                teacherIds.add(ts.user_id);
            }
        }
    }

    // Create notifications for teachers
    if (teacherIds.size > 0) {
        const studentName = profile?.username || profile?.email || "A student";
        const courseName = course?.title || "a course";

        const notifications = Array.from(teacherIds).map(teacherId => ({
            user_id: teacherId,
            message: `${studentName} submitted Assignment ${assignmentId}, Problem ${problemId} in ${courseName}`,
            notification_type: "assignment_submission",
            related_user_id: session.user.id,
            related_course_id: courseId
        }));

        await ((supabase as any)
            .from("notifications")
            .insert(notifications));
    }

    return NextResponse.json(data);
}

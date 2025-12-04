import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/getSession";

// GET /api/sections/[id]/role - Get user's role in a section
export async function GET(
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
        const { data: userSection } = await ((supabase as any)
            .from("user_sections")
            .select("role")
            .eq("user_id", session.user.id)
            .eq("section_id", id)
            .maybeSingle());

        if (!userSection) {
            return NextResponse.json({ role: null });
        }

        return NextResponse.json({ role: userSection.role });
    } catch (error) {
        console.error("Error in GET /api/sections/[id]/role:", error);
        return NextResponse.json({ error: error instanceof Error ? error.message : "An error occurred" }, { status: 500 });
    }
}
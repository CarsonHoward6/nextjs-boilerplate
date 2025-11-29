import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/getSession";

// GET /api/sections/[id]/role - Get user's role in a section
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getSession();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data: userSection } = await supabase
            .from("user_sections")
            .select("role")
            .eq("user_id", session.user.id)
            .eq("section_id", params.id)
            .single();

        if (!userSection) {
            return NextResponse.json({ role: null });
        }

        return NextResponse.json({ role: userSection.role });
    } catch (error: any) {
        console.error("Error in GET /api/sections/[id]/role:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
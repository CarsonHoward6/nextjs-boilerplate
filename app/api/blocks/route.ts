import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function PUT(request: NextRequest) {
    try {
        const { blockId, title, content } = await request.json();

        if (!blockId) {
            return NextResponse.json(
                { error: "Missing blockId" },
                { status: 400 }
            );
        }

        const supabase = getSupabase();

        // Build update object with only provided fields
        const updates: any = {};
        if (title !== undefined) updates.title = title;
        if (content !== undefined) updates.content = content;

        if (Object.keys(updates).length === 0) {
            return NextResponse.json(
                { error: "No fields to update" },
                { status: 400 }
            );
        }

        // Update the block
        const { error } = await (supabase as any)
            .from("block")
            .update(updates)
            .eq("id", blockId);

        if (error) {
            console.error("Error updating block:", error);
            return NextResponse.json(
                { error: "Failed to update block" },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error in block update:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

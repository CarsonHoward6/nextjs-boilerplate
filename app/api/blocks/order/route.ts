import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function PUT(request: NextRequest) {
    try {
        const { pageBlockId, newOrderIndex } = await request.json();

        if (!pageBlockId || newOrderIndex === undefined) {
            return NextResponse.json(
                { error: "Missing pageBlockId or newOrderIndex" },
                { status: 400 }
            );
        }

        const supabase = getSupabase();

        // Update the page_blocks order
        const { error } = await (supabase as any)
            .from("page_blocks")
            .update({ order_index: newOrderIndex })
            .eq("id", pageBlockId);

        if (error) {
            console.error("Error updating block order:", error);
            return NextResponse.json(
                { error: "Failed to update block order" },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error in block order update:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

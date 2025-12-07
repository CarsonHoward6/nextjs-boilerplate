import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function PUT(request: NextRequest) {
    try {
        const { pageId, newOrderIndex } = await request.json();

        if (!pageId || newOrderIndex === undefined) {
            return NextResponse.json(
                { error: "Missing pageId or newOrderIndex" },
                { status: 400 }
            );
        }

        const supabase = getSupabase();

        // Update the page order
        const { error } = await (supabase as any)
            .from("page")
            .update({ order_index: newOrderIndex })
            .eq("id", pageId);

        if (error) {
            console.error("Error updating page order:", error);
            return NextResponse.json(
                { error: "Failed to update page order" },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error in page order update:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

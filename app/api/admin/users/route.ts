import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
    try {
        // Log environment variables for debugging
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        console.log("API Route - Supabase URL exists:", !!supabaseUrl);
        console.log("API Route - Service key exists:", !!serviceKey);

        if (!supabaseUrl || !serviceKey) {
            console.error("Missing environment variables");
            return NextResponse.json({
                error: "Server configuration error: Missing credentials"
            }, { status: 500 });
        }

        // Create Supabase admin client with service role
        const supabaseAdmin = createClient(
            supabaseUrl,
            serviceKey,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        );

        // Fetch all users using admin API
        console.log("Attempting to fetch users...");
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers();

        if (authError) {
            console.error("Error fetching users:", authError);
            return NextResponse.json({
                error: "Failed to fetch users",
                details: authError.message
            }, { status: 500 });
        }

        console.log("Successfully fetched users:", authData.users.length);

        // Return the users data
        return NextResponse.json({ users: authData.users });
    } catch (error) {
        console.error("API error:", error);
        return NextResponse.json({
            error: "Internal server error",
            details: error instanceof Error ? error.message : "Unknown error"
        }, { status: 500 });
    }
}
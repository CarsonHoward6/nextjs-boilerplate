import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
    console.error("❌ Missing Supabase environment variables");
    process.exit(1);
}

// Create admin client with service role
const supabase = createClient(supabaseUrl, serviceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function verify() {
    console.log("\n🔍 Starting verification...\n");

    try {
        // 1. Check if is_admin function exists
        console.log("1️⃣ Checking is_admin function...");
        const { data: functionExists, error: funcError } = await supabase
            .rpc("is_admin", { check_user_id: "00000000-0000-0000-0000-000000000000" });

        if (funcError && funcError.message.includes("function") && funcError.message.includes("does not exist")) {
            console.log("   ❌ is_admin function not found");
            console.log("   → Run migration 015 in Supabase SQL Editor\n");
        } else {
            console.log("   ✅ is_admin function exists\n");
        }

        // 2. Check user_roles data
        console.log("2️⃣ Checking user_roles table...");
        const { data: roles, error: rolesError } = await supabase
            .from("user_roles")
            .select("*");

        if (rolesError) {
            console.log("   ❌ Error fetching roles:", rolesError.message);
        } else {
            console.log(`   ✅ Found ${roles?.length || 0} role assignments`);
            if (roles && roles.length > 0) {
                console.log("   Roles:");
                roles.forEach(role => {
                    console.log(`     - User ${role.user_id.substring(0, 8)}... has role: ${role.role}`);
                });
            }
            console.log();
        }

        // 3. Check user_courses data
        console.log("3️⃣ Checking user_courses table...");
        const { data: courses, error: coursesError } = await supabase
            .from("user_courses")
            .select(`
                *,
                course:course_id (title)
            `);

        if (coursesError) {
            console.log("   ❌ Error fetching courses:", coursesError.message);
        } else {
            console.log(`   ✅ Found ${courses?.length || 0} course assignments`);
            if (courses && courses.length > 0) {
                console.log("   Course assignments:");
                courses.forEach(assignment => {
                    const courseTitle = assignment.course ?
                        (Array.isArray(assignment.course) ? assignment.course[0]?.title : assignment.course.title)
                        : "Unknown";
                    console.log(`     - User ${assignment.user_id.substring(0, 8)}... → ${courseTitle} (${assignment.role})`);
                });
            }
            console.log();
        }

        // 4. Check notifications table for related_course_id column
        console.log("4️⃣ Checking notifications table structure...");
        const { data: notifications, error: notifError } = await supabase
            .from("notifications")
            .select("id, related_course_id")
            .limit(1);

        if (notifError && notifError.message.includes("related_course_id")) {
            console.log("   ❌ related_course_id column not found");
            console.log("   → Run migration 016 in Supabase SQL Editor\n");
        } else {
            console.log("   ✅ notifications table has related_course_id column\n");
        }

        // 5. Check user_profiles
        console.log("5️⃣ Checking user_profiles...");
        const { data: profiles, error: profilesError } = await supabase
            .from("user_profiles")
            .select("id, email, username, full_name");

        if (profilesError) {
            console.log("   ❌ Error fetching profiles:", profilesError.message);
        } else {
            console.log(`   ✅ Found ${profiles?.length || 0} user profiles`);
            if (profiles && profiles.length > 0) {
                console.log("   Users:");
                profiles.forEach(profile => {
                    console.log(`     - ${profile.email} ${profile.username ? `(@${profile.username})` : ""}`);
                });
            }
            console.log();
        }

        // 6. Check courses in database
        console.log("6️⃣ Checking available courses...");
        const { data: allCourses, error: allCoursesError } = await supabase
            .from("course")
            .select("id, title")
            .order("id", { ascending: true });

        if (allCoursesError) {
            console.log("   ❌ Error fetching courses:", allCoursesError.message);
        } else {
            console.log(`   ✅ Found ${allCourses?.length || 0} courses in database`);
            if (allCourses && allCourses.length > 0) {
                console.log("   Courses:");
                allCourses.forEach(course => {
                    console.log(`     - [${course.id}] ${course.title}`);
                });
            }
            console.log();
        }

        // Summary
        console.log("\n" + "=".repeat(50));
        console.log("📋 VERIFICATION SUMMARY");
        console.log("=".repeat(50));

        const allGood = !funcError && !rolesError && !coursesError &&
                       !notifError && !profilesError && !allCoursesError;

        if (allGood) {
            console.log("\n✅ All checks passed!");
            console.log("\nYour setup is complete and ready to use.");
            console.log("\n📝 Next steps:");
            console.log("   1. Visit /admin to manage users");
            console.log("   2. Assign roles and courses to users");
            console.log("   3. Users can view their courses at /lms");
        } else {
            console.log("\n⚠️  Some issues detected");
            console.log("\nPlease review the errors above and:");
            console.log("   1. Run any pending migrations in Supabase SQL Editor");
            console.log("   2. Check your environment variables");
            console.log("   3. Re-run this script to verify");
        }

        console.log("\n");

    } catch (error) {
        console.error("\n❌ Verification failed:", error);
        process.exit(1);
    }
}

verify();

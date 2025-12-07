# How to Create Users in the LMS

Users are created directly in **Supabase**, not through the application interface. Follow these steps:

## Method 1: Supabase Dashboard (Recommended)

1. **Go to your Supabase Dashboard**
   - Visit https://supabase.com/dashboard
   - Select your project (`wlsnsdi...`)

2. **Navigate to Authentication**
   - Click on **Authentication** in the left sidebar
   - Click on **Users**

3. **Add a New User**
   - Click the **"Add user"** button (top right)
   - Choose **"Create new user"**
   - Enter:
     - Email address
     - Password (or auto-generate one)
   - Click **"Create user"**

4. **Send Confirmation Email (Optional)**
   - If you want users to verify their email, enable "Send email confirmation"
   - Otherwise, they can log in immediately with the credentials you created

## Method 2: Using Supabase SQL Editor

1. **Go to SQL Editor** in Supabase Dashboard

2. **Run this SQL to create a user:**
   ```sql
   -- This creates an auth user
   -- Note: You'll need to use the Dashboard or Auth Admin API to create auth users
   -- The SQL editor cannot directly create auth.users entries
   ```

## Method 3: Sign Up Page (For Students)

Students can self-register through the application:
1. Go to `/signup` page in your app
2. Fill in:
   - Email
   - Password
   - Confirm Password
3. Click **"Sign Up"**
4. They'll be automatically assigned the "student" role

## Assigning Roles and Sections

After creating users in Supabase, use the **Admin Panel** to:

### Assign Global Roles:
1. Log in as admin (carsonhoward6@gmail.com)
2. Go to `/admin`
3. Click on the **Users** tab
4. Select a user
5. Click **"Assign Role"**
6. Choose: Admin, Teacher, Student, or Teacher Assistant
7. Click **"Assign"**

### Assign Users to Course Sections:
1. In the Admin Panel, select a user
2. Click **"Assign to Section"**
3. Choose:
   - Course (e.g., Biology, Chemistry)
   - Section (e.g., "Spring 2024 Section A")
   - Role in that section (Teacher or Student)
4. Click **"Assign"**

## Quick Test Users Setup

To quickly set up test users:

1. **Create 3 users in Supabase:**
   - teacher@test.com (password: test123)
   - student@test.com (password: test123)
   - admin@test.com (password: test123)

2. **In Admin Panel:**
   - Assign teacher@test.com → Teacher role → Biology Spring 2024 Section A
   - Assign student@test.com → Student role → Biology Spring 2024 Section A
   - Assign admin@test.com → Admin role (no section needed)

## Troubleshooting

### Users not showing in Admin Panel?

Check these:

1. **Service Role Key**
   - Make sure `SUPABASE_SERVICE_ROLE_KEY` is in your `.env.local`
   - Get it from: Supabase Dashboard → Settings → API → service_role (secret)

2. **User Profile Creation**
   - Users might not have profiles yet
   - Profiles are created automatically on first login
   - Or run: `npx tsx scripts/create-user-profiles.ts`

3. **Database Permissions**
   - Make sure RLS policies allow admin access
   - Check in Supabase → Authentication → Policies

### Need to Delete Users?

1. Go to Supabase Dashboard → Authentication → Users
2. Click the `...` menu next to a user
3. Select **"Delete user"**

## Important Notes

- **Admin email is hardcoded:** Only `carsonhoward6@gmail.com` has admin access in the app
- **Teachers can only manage their sections:** They can't see other sections
- **Students see only their enrolled sections**
- **First login tracking:** The system tracks when users first log in for notifications

## Database Schema

Users are stored across multiple tables:
- `auth.users` - Supabase authentication (email, password, etc.)
- `user_profiles` - Extended profile data (full_name, username, etc.)
- `user_roles` - Global roles (admin, teacher, student)
- `user_sections` - Section assignments (which classes they're in)

# LMS Deployment Guide

This guide will help you deploy your Learning Management System to GitHub and Vercel.

## Prerequisites

- Git installed on your computer
- GitHub account
- Vercel account (free tier is sufficient)
- Supabase project with your database

## Step 1: Prepare Your Repository

### 1.1 Initialize Git (if not already done)

```bash
git init
git add .
git commit -m "Initial commit: LMS with announcements and notifications"
```

### 1.2 Create .gitignore

Make sure you have a `.gitignore` file that includes:

```
# dependencies
node_modules/
/.pnp
.pnp.js

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env.local
.env.development.local
.env.test.local
.env.production.local

# vercel
.vercel

# IDE
.idea/
.vscode/
*.swp
*.swo
```

## Step 2: Push to GitHub

### 2.1 Create a GitHub Repository

1. Go to [GitHub](https://github.com)
2. Click the "+" icon in the top right corner
3. Select "New repository"
4. Name your repository (e.g., "lms-platform")
5. Choose "Public" or "Private"
6. **Do NOT** initialize with README, .gitignore, or license (we already have these)
7. Click "Create repository"

### 2.2 Connect Local Repository to GitHub

Copy the commands from GitHub and run them:

```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

Replace `YOUR_USERNAME` and `YOUR_REPO_NAME` with your actual GitHub username and repository name.

## Step 3: Deploy to Vercel

### 3.1 Sign Up/Login to Vercel

1. Go to [Vercel](https://vercel.com)
2. Click "Sign Up" or "Login"
3. Choose "Continue with GitHub"
4. Authorize Vercel to access your GitHub account

### 3.2 Import Your Project

1. Click "Add New..." → "Project"
2. Find your repository in the list
3. Click "Import"

### 3.3 Configure Environment Variables

Before deploying, add your environment variables:

1. In the "Configure Project" section, scroll to "Environment Variables"
2. Add the following variables:

   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   POSTGRES_URL=your_postgres_connection_string
   ```

3. Get these values from your Supabase project:
   - Go to your Supabase project dashboard
   - Click "Project Settings" (gear icon)
   - Go to "API" section
   - Copy the Project URL and anon/public key
   - Go to "Database" section
   - Copy the Connection String (URI format)

### 3.4 Deploy

1. Click "Deploy"
2. Wait for the build to complete (usually 1-3 minutes)
3. Once deployed, you'll get a URL like `https://your-app.vercel.app`

## Step 4: Run Database Migrations

After deployment, you need to set up your database tables:

### 4.1 Run Migrations Locally

From your local machine, run:

```bash
npx tsx scripts/run-migration.ts
```

This will create all necessary tables in your Supabase database.

### 4.2 Seed Initial Data (Optional)

If you want to add example announcements:

```bash
npx tsx scripts/seed-announcements.ts
```

And create test notifications:

```bash
npx tsx scripts/create-test-notification.ts
```

## Step 5: Verify Deployment

1. Visit your Vercel URL
2. You should see the animated landing page
3. Try signing up/logging in
4. Check that all features work:
   - Course navigation
   - Announcements
   - Notifications (bell icon in header)
   - Admin page (if you're an admin user)

## Step 6: Set Up Custom Domain (Optional)

### 6.1 Add Custom Domain in Vercel

1. Go to your project in Vercel
2. Click "Settings" → "Domains"
3. Enter your custom domain
4. Follow the DNS configuration instructions

### 6.2 Configure DNS

Add the DNS records provided by Vercel to your domain registrar's DNS settings.

## Updating Your Deployment

Whenever you make changes to your code:

```bash
# Commit your changes
git add .
git commit -m "Description of changes"

# Push to GitHub
git push origin main
```

Vercel will automatically detect the push and redeploy your application!

## Troubleshooting

### Build Fails

- Check the build logs in Vercel
- Ensure all environment variables are correctly set
- Make sure `package.json` has all dependencies

### Database Connection Issues

- Verify your `POSTGRES_URL` is correct
- Check that your Supabase project is active
- Ensure RLS (Row Level Security) policies are properly configured

### Login/Auth Not Working

- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Check Supabase Auth settings
- Ensure redirect URLs are configured in Supabase

### Pages Not Loading

- Check browser console for errors
- Verify all environment variables are set
- Try clearing Vercel cache and redeploying

## Support

If you encounter issues:

1. Check Vercel deployment logs
2. Check browser console for errors
3. Verify environment variables
4. Check Supabase logs

## Next Steps

- Customize the landing page with your branding
- Add more course content
- Set up user roles and permissions
- Configure email notifications via Supabase
- Add more LMS features (assignments, quizzes, etc.)

---

**Congratulations!** Your LMS is now deployed and accessible online. 🎉
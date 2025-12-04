# Security Setup Guide

This document contains important security configurations for your Next.js + Supabase application.

## ✅ Completed Security Measures

### 1. Row Level Security (RLS) Policies
All database tables now have RLS enabled with appropriate policies:
- ✅ Users can only access data they're authorized to see
- ✅ Role-based access control (Admin, Teacher, Student)
- ✅ Section-based data isolation
- ✅ Secure announcement and notification systems

**Migration:** `lib/migrations/005_enable_rls_policies.sql`

### 2. Function Search Path Security
The `update_updated_at_column()` function has been secured:
- ✅ Explicit `search_path` set to prevent hijacking
- ✅ Uses `SECURITY DEFINER` with safe configuration
- ✅ All triggers properly recreated

**Migration:** `lib/migrations/006_fix_function_search_path.sql`

---

## ⚠️ Additional Security Configuration Required

### Enable Leaked Password Protection

Supabase Auth can prevent users from using passwords that have been compromised in data breaches by checking against the [HaveIBeenPwned](https://haveibeenpwned.com/) database.

#### How to Enable (via Supabase Dashboard):

1. **Navigate to Authentication Settings:**
   - Go to your [Supabase Dashboard](https://app.supabase.com)
   - Select your project
   - Click on **Authentication** in the left sidebar
   - Click on **Policies** or **Auth Providers** (depending on your dashboard version)

2. **Enable Password Protection:**
   - Look for **Password Settings** or **Security** section
   - Find the option labeled **"Check for compromised passwords"** or **"Leaked password protection"**
   - Toggle it **ON**

3. **Alternative: Via Supabase CLI**
   ```bash
   supabase auth update --enable-leaked-password-protection
   ```

4. **Alternative: Via API (if using Management API)**
   ```bash
   curl -X PATCH 'https://api.supabase.com/v1/projects/{project-ref}/config/auth' \
     -H "Authorization: Bearer {service-role-key}" \
     -H "Content-Type: application/json" \
     -d '{
       "SECURITY_UPDATE_PASSWORD_REQUIRE_REAUTHENTICATION": true,
       "PASSWORD_MIN_LENGTH": 6,
       "PASSWORD_REQUIRED_CHARACTERS": "abcdefghijklmnopqrstuvwxyz0123456789"
     }'
   ```

#### What This Does:

When enabled, Supabase will:
- Check new passwords against the HaveIBeenPwned API
- Reject passwords that have been found in data breaches
- Help protect your users from account compromise
- No personally identifiable information is sent to HaveIBeenPwned (uses k-anonymity)

#### Testing:

After enabling, try signing up with a known compromised password like:
- `password123`
- `123456`
- `qwerty`

The signup should be rejected with an error about the password being compromised.

---

## 🔒 Additional Security Best Practices

### 1. Environment Variables
Ensure these are set in your `.env.local` (never commit to git):
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
POSTGRES_URL=your_postgres_connection_string
```

### 2. Email Verification
Enable email verification in Supabase:
- Dashboard → Authentication → Email Templates
- Enable "Confirm your signup" email
- Customize email templates as needed

### 3. Rate Limiting
Consider implementing rate limiting for:
- Login attempts
- Password reset requests
- API endpoints

You can use Supabase's built-in rate limiting or implement custom middleware.

### 4. HTTPS Only
Ensure your production deployment uses HTTPS:
- Next.js on Vercel automatically uses HTTPS
- For custom deployments, configure SSL/TLS certificates

### 5. Content Security Policy (CSP)
Add CSP headers in `next.config.js`:
```javascript
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        {
          key: 'X-Frame-Options',
          value: 'DENY',
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'Referrer-Policy',
          value: 'origin-when-cross-origin',
        },
      ],
    },
  ];
}
```

### 6. Regular Security Audits
Run the Supabase linter regularly:
```bash
# In Supabase Dashboard → Database → Linter
# Or via SQL:
SELECT * FROM supabase_linter.lint();
```

### 7. Backup Strategy
Ensure you have automated backups configured:
- Supabase Pro+ plans include daily backups
- Test restore procedures regularly

---

## 📚 Resources

- [Supabase Security Best Practices](https://supabase.com/docs/guides/database/database-linter)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Auth Configuration](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

---

## ✅ Security Checklist

- [x] RLS enabled on all public tables
- [x] Function search_path secured
- [ ] Leaked password protection enabled (requires dashboard action)
- [ ] Email verification enabled
- [ ] Rate limiting configured
- [ ] HTTPS enforced in production
- [ ] CSP headers configured
- [ ] Regular backups tested
- [ ] Security audit schedule established

---

**Last Updated:** December 2025
**Status:** RLS and Function Security Complete, Leaked Password Protection Pending

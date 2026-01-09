# 🚨 SECURITY NOTICE - IMMEDIATE ACTION REQUIRED

## Exposed Supabase Key in Git History

**Status**: The `VITE_SUPABASE_PUBLISHABLE_KEY` has been committed to the repository and must be treated as compromised.

### Immediate Actions Required:

#### 1. Rotate the Supabase Key (CRITICAL)
1. Go to: https://supabase.com/dashboard/project/zcikfntelmtkgoibtttc/settings/api
2. In the "Project API keys" section, click "Reveal" on the anon/public key
3. Click "Generate new anon key" or "Reset" to revoke the current key
4. Copy the new anon key
5. Update your local `.env` file with the new key:
   ```
   VITE_SUPABASE_PUBLISHABLE_KEY="<new_key_here>"
   ```
6. **DO NOT COMMIT THE NEW KEY**

#### 2. Clean Git History (CRITICAL)
The old key exists in git history and must be removed:

```bash
# Option A: Using git-filter-repo (recommended)
pip install git-filter-repo
git filter-repo --path .env --invert-paths --force

# Option B: Using BFG Repo-Cleaner
brew install bfg
bfg --delete-files .env
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# After cleaning, force push
git push origin main --force
```

#### 3. Audit Supabase Access (HIGH PRIORITY)
1. Go to: https://supabase.com/dashboard/project/zcikfntelmtkgoibtttc/logs
2. Check for any unauthorized access or suspicious activity
3. Review API usage patterns
4. Check for any unexpected database changes

#### 4. Update Production Deployments
After rotating the key, update:
- [ ] Vercel environment variables (if deployed)
- [ ] Any CI/CD secrets
- [ ] Team members' local `.env` files
- [ ] Any other services using this key

#### 5. Security Improvements Implemented

✅ **Fixed in this commit:**
- Gated demo authentication to development only (`import.meta.env.DEV`)
- Removed hardcoded demo OTP from production builds
- Added real phone OTP verification for production
- Added profile completion check for returning users
- Improved credential security in demo mode

### Prevention Checklist
- [x] `.env` added to `.gitignore`
- [x] `.env.example` created (no secrets)
- [ ] Supabase key rotated
- [ ] Git history cleaned
- [ ] Team notified

### Timeline
- **Exposure**: Multiple commits (check `git log -- .env`)
- **Detection**: January 9, 2026
- **Response**: Immediate (this notice)

### Contact
If you have questions about this security incident, contact the repository owner immediately.

---
**Note**: This file should be removed after all remediation steps are complete and verified.

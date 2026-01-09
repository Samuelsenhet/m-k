# 🚀 MÄÄK MVP - Quick Launch Guide

**Ready in 6 Steps** | **Time: 30-45 minutes**

---

#---- Check tables created
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('consents', 'privacy_settings');

-- Check column added
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name = 'onboarding_completed_at';

-- Check consent seeding
SELECT COUNT(*) as total_consents FROM public.consents;
SELECT COUNT(*) as total_users FROM auth.users;
-- total_consents should be ~3x total_users

---

## ✅ Step 3: Test Backend (5 min)

**Edge Functions** → **match-status** → **Test**:
```json
{"user_id": "test-user-id"}
```

Expected: `journey_phase`, `time_remaining`, `next_reset_time`

---

## ✅ Step 4: Deploy Frontend (5 min)

```bash
npm run build
vercel --prod

# Or commit and push for auto-deploy
git add .
git commit -m "feat: journey phases + GDPR compliance"
git push origin main
```

---

## ✅ Step 5: End-to-End Test (10 min)

1. **New User**:
   - Sign up → Complete onboarding
   - See waiting phase with countdown ✅
   
2. **Simulate 24h Wait**:
   ```sql
   UPDATE profiles 
   SET onboarding_completed_at = NOW() - INTERVAL '25 hours'
   WHERE user_id = 'test-user-id';
   ```

3. **Check First Match**:
   - Refresh page → Get matches
   - See confetti celebration ✅

---

## ✅ Step 6: Launch! 🎉

**Pre-Flight Checklist**:
- [ ] Database migration successful
- [ ] Edge functions deployed
- [ ] Frontend built and deployed
- [ ] Waiting phase displays
- [ ] Celebration animates
- [ ] No console errors

---

## 🆘 Quick Troubleshooting

**Waiting phase not showing?**
→ Check `onboarding_completed_at` is set

**No celebration?**
→ Verify `special_effects` in API response

**API errors?**
→ Check Edge Function logs in dashboard

---

## 📊 What Changed

### Backend ✅
- ✅ 2 new tables (consents, privacy_settings)
- ✅ 1 new column (onboarding_completed_at)
- ✅ 24-hour wait enforcement
- ✅ First match celebration detection

### Frontend ✅
- ✅ WaitingPhase component (countdown timer)
- ✅ FirstMatchCelebration (confetti + mascot)
- ✅ Journey phase routing in Matches page

---

## 🎯 Success Metrics

Monitor after launch:
- Waiting phase → 100% new users see it
- Celebration → 100% first matches trigger it
- API response time → < 500ms
- Error rate → < 1%

---

**Need Help?** Check `/docs/DEPLOYMENT_GUIDE.md` for detailed steps

**Ready to Launch?** Follow steps 1-6 above! 🚀

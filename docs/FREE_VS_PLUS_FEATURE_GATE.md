# MÄÄK Matching System - Free vs Plus Feature Gate

## Explicit Rules

### Eligibility
- ✅ All users must complete onboarding before entering matching pool
- ✅ All users are 20+ (verified at registration, no age validation in matching)

### Daily Match Delivery Rules

#### Free Users (Tier: 'free')
- **Cap**: Max 5 matches per day
- **Not Guaranteed**: User may receive 0-5 matches depending on pool availability
- **Applied At**: Delivery layer (AFTER ranking and scoring)
- **Formula**: `min(5, pool.length)`
- **user_limit field**: `5`

#### Plus Users (Tier: 'plus' or 'premium')
- **Cap**: Uncapped
- **Limit**: Up to full global batch size set by admin
- **Formula**: `pool.length`
- **user_limit field**: `null`

### Algorithm Flow

```
1. ADMIN SETS GLOBAL BATCH (3-10)
   ↓
2. ALGORITHM RANKS ALL CANDIDATES
   - Applies dealbreaker filters (age, gender, onboarding)
   - Scores using composite algorithm (personality 40%, archetype 30%, interests 30%)
   - Splits 60% similar / 40% complementary
   ↓
3. USER-SPECIFIC POOL CREATED
   - Stored in user_daily_match_pool
   - Contains ranked candidates (may be > 5)
   ↓
4. DELIVERY LAYER APPLIES CAP
   - If free: take first min(5, pool.length)
   - If plus: take all pool.length
   - No modification to scores or ranking
```

### Key Principles

✅ **Algorithm decides ranking** → Delivery layer applies cap  
✅ **Admin controls global batch** → Not per-user  
✅ **Free users capped at 5** → Not guaranteed 5  
✅ **Plus users uncapped** → Up to admin's batch_size  
✅ **Pool can store > 5** → Delivery slices based on tier

### Response Contract

All responses from `POST /match/daily` must include:

```json
{
  "date": "YYYY-MM-DD",
  "batch_size": number,
  "user_limit": 5 | null,
  "matches": MatchOutput[]
}
```

- `batch_size`: Number of matches being delivered this request
- `user_limit`: 5 for free users, null for plus users

### Examples

#### Example 1: Free User, Pool Has 8 Candidates
```json
{
  "date": "2026-01-09",
  "batch_size": 5,
  "user_limit": 5,
  "matches": [...] // 5 matches (capped)
}
```

#### Example 2: Plus User, Pool Has 8 Candidates
```json
{
  "date": "2026-01-09",
  "batch_size": 8,
  "user_limit": null,
  "matches": [...] // 8 matches (uncapped)
}
```

#### Example 3: Free User, Pool Has Only 3 Candidates
```json
{
  "date": "2026-01-09",
  "batch_size": 3,
  "user_limit": 5,
  "matches": [...] // 3 matches (no error, just what's available)
}
```

#### Example 4: Plus User, Pool Has Only 3 Candidates
```json
{
  "date": "2026-01-09",
  "batch_size": 3,
  "user_limit": null,
  "matches": [...] // 3 matches
}
```

### Repeat Avoidance

- Same match cannot appear 2 days in a row **IF alternatives exist**
- If no alternatives: repeat is allowed to prevent 0 matches
- Applied at pool generation, not delivery

### Daily Reset

- Happens at **00:00 CET (Europe/Stockholm timezone)**
- All date calculations use `sv-SE` locale with `Europe/Stockholm` timezone
- Ensures consistent reset across DST changes

### What Free Cap Does NOT Do

❌ Modify algorithm rankings  
❌ Change 60/40 similar/complementary split  
❌ Affect composite scores  
❌ Store individual user limits in database  
❌ Guarantee 5 matches (it's a cap, not a promise)

### What Free Cap DOES Do

✅ Slice first 5 matches from ranked pool at delivery  
✅ Return `user_limit: 5` in response  
✅ Allow < 5 if pool has fewer candidates  
✅ Apply after all ranking and splitting logic

## Implementation Files

- `/supabase/functions/match-daily/index.ts` - Delivery logic with cap
- `/src/lib/matching.ts` - Algorithm (no cap logic here)
- `/docs/MATCHING_ALGORITHM_MVP.md` - Full technical documentation

## Testing Matrix

| User Tier | Pool Size | Expected Delivery | user_limit |
|-----------|-----------|-------------------|------------|
| Free | 8 | 5 | 5 |
| Free | 3 | 3 | 5 |
| Free | 0 | 0 | 5 |
| Plus | 8 | 8 | null |
| Plus | 3 | 3 | null |
| Plus | 0 | 0 | null |
| Plus | 10 | 10 | null |

## Summary for Lovable

When implementing this in Lovable, remember:

1. **Algorithm file** (`matching.ts`) has NO subscription logic
2. **API endpoint** (`match-daily`) applies the cap
3. **Cap is delivery-time**, not generation-time
4. **user_limit must always be in response**
5. **Free ≠ guaranteed 5, just capped at 5**
6. **Plus = uncapped up to admin's batch_size**

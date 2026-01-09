## Testing Guide

### Overview
Testing strategies and procedures for ensuring MÄÄK quality and reliability.

## Testing Stack

### Tools
- **Manual Testing** - Primary method (no automated tests yet)
- **Browser DevTools** - Debug and inspect
- **React DevTools** - Component inspection
- **Supabase Dashboard** - Database queries and logs

### Future Additions
- **Vitest** - Unit testing
- **Testing Library** - Component testing
- **Playwright** - E2E testing

## Manual Testing Checklist

### Authentication Flow

#### Phone Auth
```
✓ Phone Input
  [ ] Accepts 10-digit Swedish numbers
  [ ] Validates format (07xxxxxxxx)
  [ ] Shows error for invalid numbers
  [ ] Displays +46 prefix

✓ OTP Verification
  [ ] Demo code 123456 works in DEV mode
  [ ] Shows error for wrong code
  [ ] Resend button appears after countdown
  [ ] Production mode requires real OTP

✓ Age Verification
  [ ] Day/Month/Year selectors work
  [ ] Validates minimum age 20
  [ ] Shows error for underage
  [ ] Calculates age correctly
  [ ] Saves date_of_birth to database

✓ Navigation
  [ ] Redirects to onboarding after completion
  [ ] No navigation loops
  [ ] Uses replace: true for clean history
  [ ] Back button behavior correct
```

#### Session Management
```
✓ Login Persistence
  [ ] Session persists on page reload
  [ ] Auto-login if session valid
  [ ] Logout clears session
  [ ] Redirects to login when expired

✓ Protected Routes
  [ ] /matches requires authentication
  [ ] /profile requires authentication
  [ ] /chat requires authentication
  [ ] Redirects to /login if not authenticated
```

### Personality Test

#### Test Flow
```
✓ Question Display
  [ ] All 30 questions load
  [ ] Questions display in correct order
  [ ] Progress indicator updates
  [ ] Navigation between questions works

✓ Answer Selection
  [ ] All 5 options selectable
  [ ] Selected answer highlighted
  [ ] Can change answer before submit
  [ ] Answers persist on navigation

✓ Results
  [ ] Correct archetype calculated
  [ ] Category matches archetype
  [ ] Dimension scores accurate
  [ ] Results save to database
  [ ] Redirects to matches page
```

### Matches Page

#### Match Display
```
✓ Match List
  [ ] Matches load from database
  [ ] Sorted by compatibility score
  [ ] Photos display correctly
  [ ] Category badges show correct colors
  [ ] Archetype displayed

✓ Match Interactions
  [ ] Click opens profile detail
  [ ] Start chat button works
  [ ] Accept/reject actions save
  [ ] Optimistic updates work
  [ ] Error handling graceful

✓ Empty States
  [ ] Shows waiting message if no matches
  [ ] Displays mascot in waiting state
  [ ] Explains when matches arrive
  [ ] Countdown if time-based
```

### Chat System

#### Message Display
```
✓ Message List
  [ ] Messages load chronologically
  [ ] Own messages aligned right
  [ ] Other messages aligned left
  [ ] Timestamps displayed
  [ ] Read receipts work

✓ Send Message
  [ ] Text input works
  [ ] Enter key sends message
  [ ] Message appears immediately
  [ ] Saves to database
  [ ] Error handling works

✓ Realtime Updates
  [ ] New messages appear instantly
  [ ] Typing indicators work
  [ ] Read receipts update
  [ ] Connection status shown
```

### Profile Management

#### View Profile
```
✓ Display
  [ ] All profile fields shown
  [ ] Photos display in gallery
  [ ] Archetype information correct
  [ ] Bio and location shown
  [ ] Edit button visible

✓ Edit Profile
  [ ] All fields editable
  [ ] Photo upload works
  [ ] Validation prevents invalid data
  [ ] Save button updates database
  [ ] Changes reflect immediately
```

### UI/UX Testing

#### Responsive Design
```
✓ Mobile (375px - 767px)
  [ ] All pages fit viewport
  [ ] Touch targets 44x44px minimum
  [ ] Text readable without zoom
  [ ] Navigation accessible
  [ ] Forms usable

✓ Tablet (768px - 1023px)
  [ ] Layout adjusts appropriately
  [ ] No horizontal scroll
  [ ] Images scale correctly
  [ ] Grid layouts work

✓ Desktop (1024px+)
  [ ] Content max-width applied
  [ ] Sidebar navigation works
  [ ] Multiple columns display
  [ ] Hover states active
```

#### Dark Mode
```
✓ Theme Toggle
  [ ] Switch between light/dark
  [ ] Preference persists
  [ ] All components themed
  [ ] Colors have sufficient contrast
  [ ] Images visible in both modes

✓ Visual Consistency
  [ ] Brand colors maintained
  [ ] Personality colors adjusted
  [ ] Gradients work in dark mode
  [ ] Shadows visible
```

#### Accessibility
```
✓ Keyboard Navigation
  [ ] Tab order logical
  [ ] Focus indicators visible
  [ ] All interactive elements reachable
  [ ] Escape closes modals
  [ ] Enter submits forms

✓ Screen Reader
  [ ] Alt text on images
  [ ] ARIA labels on buttons
  [ ] Form fields labeled
  [ ] Error messages announced
  [ ] Loading states announced

✓ Visual
  [ ] Text contrast ≥ 4.5:1
  [ ] Large text contrast ≥ 3:1
  [ ] Focus indicators visible
  [ ] No color-only indicators
  [ ] Text resizable to 200%
```

### Performance Testing

#### Load Times
```
✓ Initial Load
  [ ] FCP < 1.8s
  [ ] LCP < 2.5s
  [ ] TTI < 3.8s
  [ ] Bundle size reasonable

✓ Page Transitions
  [ ] Navigation feels instant
  [ ] No layout shifts
  [ ] Images lazy load
  [ ] Animations smooth (60fps)
```

#### Network Conditions
```
✓ Fast 3G
  [ ] App usable
  [ ] Loading states shown
  [ ] Images load progressively
  [ ] Errors handled gracefully

✓ Offline
  [ ] Service worker active
  [ ] Cached pages accessible
  [ ] Offline indicator shown
  [ ] Queued actions when back online
```

### Database Testing

#### Data Integrity
```
✓ CRUD Operations
  [ ] Create profile works
  [ ] Read profile accurate
  [ ] Update profile saves
  [ ] Delete works (if applicable)

✓ Relationships
  [ ] Foreign keys enforced
  [ ] Cascading deletes work
  [ ] Join queries correct
  [ ] Indexes improve performance

✓ RLS Policies
  [ ] Users can only see own data
  [ ] Cross-user access blocked
  [ ] Service role bypasses RLS
  [ ] Policies performant
```

#### Realtime Subscriptions
```
✓ Connection
  [ ] Connects on mount
  [ ] Reconnects on disconnect
  [ ] Cleans up on unmount
  [ ] Multiple subscriptions work

✓ Events
  [ ] INSERT events trigger
  [ ] UPDATE events trigger
  [ ] DELETE events trigger
  [ ] Filters work correctly
```

## Test Demo Account

### Credentials
```
Phone: 46762832139
OTP Code: 123456 (DEV mode only)
Email: 46762832139@maak.app
Password: Maak46762832139Demo!2026
```

### Usage
```bash
# Test authentication flow
1. Enter phone: 46762832139
2. Enter OTP: 123456
3. Set date of birth (20+ years)
4. Complete personality test
5. View matches
```

## Browser Testing Matrix

### Required Browsers
```
✓ Chrome/Edge (Chromium)
  [ ] Latest version
  [ ] Previous version

✓ Firefox
  [ ] Latest version
  [ ] ESR version

✓ Safari
  [ ] Latest macOS
  [ ] Latest iOS

✓ Mobile Browsers
  [ ] Chrome Android
  [ ] Safari iOS
  [ ] Samsung Internet
```

## Bug Reporting Template

```markdown
## Bug Description
Clear description of the issue

## Steps to Reproduce
1. Go to...
2. Click on...
3. See error

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- Browser: Chrome 120
- OS: macOS 14
- Device: MacBook Pro
- Screen: 1920x1080

## Screenshots
Attach relevant screenshots

## Console Errors
```
Paste any console errors
```

## Additional Context
Any other relevant information
```

## Regression Testing

### After Each Deploy
```
✓ Critical Path
  [ ] User can sign up
  [ ] User can log in
  [ ] Personality test works
  [ ] Matches display
  [ ] Chat functional
  [ ] Profile editable

✓ Previous Bugs
  [ ] Navigation loop fixed
  [ ] Email validation works
  [ ] Database race condition resolved
  [ ] Phone uniqueness enforced
```

## Performance Benchmarks

### Target Metrics
```
Lighthouse Scores:
- Performance: > 90
- Accessibility: > 95
- Best Practices: > 90
- SEO: > 90

Core Web Vitals:
- LCP: < 2.5s
- FID: < 100ms
- CLS: < 0.1

Bundle Size:
- Main: < 500 KB
- Vendor: < 300 KB
- Total: < 800 KB (gzipped)
```

### Monitoring
```bash
# Run Lighthouse
npx lighthouse https://maak.app --view

# Check bundle size
npm run build
npx vite-bundle-visualizer

# Measure performance
# Open DevTools > Performance > Record
```

## Security Testing

### Checklist
```
✓ Authentication
  [ ] Cannot access protected routes without auth
  [ ] Session expires appropriately
  [ ] Logout clears sensitive data
  [ ] XSS protection in place

✓ Database
  [ ] RLS policies prevent unauthorized access
  [ ] SQL injection not possible
  [ ] Sensitive data not exposed in API
  [ ] Rate limiting active

✓ Files
  [ ] File upload validation works
  [ ] File size limits enforced
  [ ] File type restrictions work
  [ ] Malicious files rejected
```

## Testing Best Practices

1. **Test Early and Often**
   - Test each feature as developed
   - Run full regression before deploy
   - Test on multiple devices

2. **Document Issues**
   - Use bug report template
   - Include reproduction steps
   - Attach screenshots/logs

3. **Prioritize Testing**
   - Critical paths first
   - Then user-facing features
   - Then edge cases

4. **Real User Testing**
   - Beta test with small group
   - Gather feedback
   - Iterate based on findings

#!/bin/bash
set -e

MAX=${1:-10}
SLEEP=${2:-2}

echo "Starting Ralph - Max $MAX iterations"
echo ""

for ((i=1; i<=$MAX; i++)); do
    echo "==========================================="
    echo "  Iteration $i of $MAX"
    echo "==========================================="

    result=$(claude --dangerously-skip-permissions -p "You are Ralph, an autonomous coding agent. Do exactly ONE task per iteration.

## Project Context

MÄÄK is a Swedish personality-based dating app with:
- React 18 + TypeScript + Vite + Supabase
- Premium mobile-first design system (21st.dev inspired)
- Glassmorphism, gradients, and smooth animations throughout
- Design system includes: .glass, .card-premium, .gradient-rose-glow, .shadow-glow-rose
- Mobile-optimized with safe-area handling and touch targets (min 44px)
- Recent work: Complete premium mobile design overhaul completed (Jan 2026)

## Steps

1. Learn about the project structure by listing files and folders in the root directory.
2. Read PRD.md to understand the project.
3. Read PRD.md and find the first task that is NOT complete (marked [ ]).
4. Read progress.txt - check the Learnings section first for patterns from previous iterations.
5. Implement that ONE task only.
6. Run tests/typecheck to verify it works.

## Critical: Only Complete If Tests Pass

- If tests PASS:
  - Update PRD.md to mark the task complete (change [ ] to [x])
  - Commit your changes with message: feat: [task description]
  - Append what worked to progress.txt

- If tests FAIL:
  - Do NOT mark the task complete
  - Do NOT commit broken code
  - Append what went wrong to progress.txt (so next iteration can learn)

## Progress Notes Format

Append to progress.txt using this format:

## Iteration [N] - [Task Name]
- What was implemented
- Files changed
- Learnings for future iterations:
  - Patterns discovered
  - Gotchas encountered
  - Useful context
---

## Design System Notes

When working on UI components:
- Use premium design classes: .card-premium, .glass, .glass-dark
- Apply gradients: .gradient-rose-glow, .gradient-violet-glow, .gradient-emerald-glow
- Use premium shadows: .shadow-glow-rose, .shadow-glow-violet
- Add animations: .animate-scale-in, .animate-slide-in-right, .animate-bounce-gentle
- Ensure mobile touch targets are at least 44px (use min-h-[44px])
- Add .touch-manipulation and .active:scale-95 for better mobile UX
- Use .safe-area-top and .safe-area-bottom for notch handling

## Update AGENTS.md (If Applicable)

If you discover a reusable pattern that future work should know about:
- Check if AGENTS.md exists in the project root
- Add patterns like: 'This codebase uses X for Y' or 'Always do Z when changing W'
- Only add genuinely reusable knowledge, not task-specific details

## End Condition

After completing your task, check PRD.md:
- If ALL tasks are [x], output exactly: <promise>COMPLETE</promise>
- If tasks remain [ ], just end your response (next iteration will continue)")

    echo "$result"
    echo ""

    if [[ "$result" == *"<promise>COMPLETE</promise>"* ]]; then
        echo "==========================================="
        echo "  All tasks complete after $i iterations!"
        echo "==========================================="
        exit 0
    fi

    sleep $SLEEP
done

echo "==========================================="
echo "  Reached max iterations ($MAX)"
echo "==========================================="
exit 1

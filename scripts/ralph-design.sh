#!/bin/bash
set -e

MAX=${1:-20}
SLEEP=${2:-2}

echo "==========================================="
echo "  Ralph Design System Implementation"
echo "  Max iterations: $MAX"
echo "==========================================="
echo ""

for ((i=1; i<=$MAX; i++)); do
    echo "==========================================="
    echo "  Iteration $i of $MAX"
    echo "==========================================="

    PROMPT='You are Ralph, an autonomous coding agent implementing the MaakUnifiedDesignSystem. Do exactly ONE task per iteration.

## Project Context

MÄÄK is a Swedish personality-based dating app implementing the MaakUnifiedDesignSystem:
- React 18 + TypeScript + Vite + Supabase
- Design System: Eucalyptus Grove (Forest Green #4B6E48) + Coral (#F97068) + Sage (#B2AC88)
- ui-v2 components in src/components/ui-v2/
- Design tokens in src/design/tokens.ts
- Philosophy: Passa -> Chatta -> Se profil (NO swipes, NO likes, NO percentages)

## Reference File

The complete design specification is in:
/Users/samuelsenhet/Downloads/MÄÄK CLUADE/MaakUnifiedDesignSystem.jsx

This file contains exact colors, component definitions, and screen layouts to implement.

## Steps

1. Read docs/prd/PRD_DESIGN_SYSTEM.md and find the first task that is NOT complete (marked [ ]).
2. Read progress_design_system.txt - check the Learnings section for patterns from previous iterations.
3. Implement that ONE task only, following the acceptance criteria exactly.
4. Run npm run build && npm run lint to verify.

## Critical: Only Complete If Tests Pass

- If tests PASS:
  - Update docs/prd/PRD_DESIGN_SYSTEM.md to mark ALL criteria for the task complete (change [ ] to [x])
  - Commit your changes with message: feat(design): [task description]
  - Append what worked to progress_design_system.txt under "## Completed Tasks"

- If tests FAIL:
  - Do NOT mark the task complete
  - Do NOT commit broken code
  - Append what went wrong to progress_design_system.txt (so next iteration can learn)

## Progress Notes Format

Append to progress_design_system.txt using this format:

## Iteration [N] - US-XXX: [Task Name]
- What was implemented
- Files changed
- Learnings for future iterations:
  - Patterns discovered
  - Gotchas encountered
---

## Design System Rules

When implementing:
- Import COLORS from src/design/tokens.ts (never use inline hex values)
- Use ui-v2 components from src/components/ui-v2/
- Use ButtonPrimary for main CTAs (forest green gradient)
- Use ButtonCoral for emotional actions (Start Chat, etc.)
- Use AvatarWithRing with hasRing=true for unread messages
- Use Mascot component with correct token for each state
- All animations should be subtle and calm (100-300ms duration)

## End Condition

After completing your task, check docs/prd/PRD_DESIGN_SYSTEM.md:
- If ALL tasks are [x], output exactly: <promise>COMPLETE</promise>
- If tasks remain [ ], just end your response (next iteration will continue)'

    result=$(claude --dangerously-skip-permissions -p "$PROMPT" 2>&1)

    echo "$result"
    echo ""

    if [[ "$result" == *"<promise>COMPLETE</promise>"* ]]; then
        echo "==========================================="
        echo "  Design System Implementation Complete!"
        echo "  Finished after $i iterations"
        echo "==========================================="
        exit 0
    fi

    sleep $SLEEP
done

echo "==========================================="
echo "  Reached max iterations ($MAX)"
echo "  Check progress_design_system.txt for status"
echo "==========================================="
exit 1

#!/bin/bash
# EventOne GSSoC Label Setup Script
# Run this ONCE to create all labels in your repo
# Usage: bash create-labels.sh

REPO="anubhavxdev/Event-management-system-main"

echo "🏷️  Creating GSSoC labels for $REPO..."

# ── PIPELINE STAGES ──
gh label create "stage-1-approved"         --color "0075ca" --description "Pipeline: Stage 1 automated checks passed" --repo $REPO --force
gh label create "mentor-review-requested"  --color "e4e669" --description "Pipeline: Mentor review requested" --repo $REPO --force
gh label create "mentor-approved"          --color "0e8a16" --description "Pipeline: Mentor has approved this PR" --repo $REPO --force
gh label create "stage-3-ready"            --color "006b75" --description "Pipeline: Ready for admin final review" --repo $REPO --force
gh label create "gssoc:review"             --color "cfd3d7" --description "GSSoC: Under review" --repo $REPO --force

# ── DIFFICULTY ──
gh label create "level:beginner"           --color "0075ca" --description "GSSoC: Beginner difficulty — 20 pts" --repo $REPO --force
gh label create "level:intermediate"       --color "e4e669" --description "GSSoC: Intermediate difficulty — 35 pts" --repo $REPO --force
gh label create "level:advanced"           --color "d93f0b" --description "GSSoC: Advanced difficulty — 55 pts" --repo $REPO --force
gh label create "level:critical"           --color "b60205" --description "GSSoC: Critical difficulty — 80 pts" --repo $REPO --force

# ── QUALITY ──
gh label create "quality:clean"            --color "0e8a16" --description "GSSoC: Clean code — ×1.2 multiplier" --repo $REPO --force
gh label create "quality:exceptional"      --color "006b75" --description "GSSoC: Exceptional quality — ×1.5 multiplier" --repo $REPO --force

# ── TYPE BONUS ──
gh label create "type:docs"               --color "cfd3d7" --description "GSSoC: Documentation changes" --repo $REPO --force
gh label create "type:testing"            --color "cfd3d7" --description "GSSoC: Test additions or fixes" --repo $REPO --force
gh label create "type:feature"            --color "cfd3d7" --description "GSSoC: New feature" --repo $REPO --force
gh label create "type:bug"               --color "cfd3d7" --description "GSSoC: Bug fix" --repo $REPO --force
gh label create "type:devops"            --color "cfd3d7" --description "GSSoC: DevOps or CI changes" --repo $REPO --force
gh label create "type:design"            --color "cfd3d7" --description "GSSoC: UI or UX design changes" --repo $REPO --force
gh label create "type:performance"       --color "cfd3d7" --description "GSSoC: Performance improvements" --repo $REPO --force
gh label create "type:security"          --color "cfd3d7" --description "GSSoC: Security fixes" --repo $REPO --force
gh label create "type:accessibility"     --color "cfd3d7" --description "GSSoC: Accessibility improvements" --repo $REPO --force
gh label create "type:refactor"          --color "cfd3d7" --description "GSSoC: Code refactoring" --repo $REPO --force

# ── VALIDATION ──
gh label create "gssoc:approved"          --color "0e8a16" --description "GSSoC: Admin approved — counts for points" --repo $REPO --force
gh label create "gssoc:invalid"           --color "ee0701" --description "GSSoC: Invalid PR — no points" --repo $REPO --force
gh label create "gssoc:spam"             --color "ee0701" --description "GSSoC: Spam PR — no points" --repo $REPO --force
gh label create "gssoc:ai-slop"          --color "ee0701" --description "GSSoC: AI-generated content — no points" --repo $REPO --force

echo ""
echo "✅ All labels created for $REPO"
echo "🚀 Now push your .github/ workflows and you're live!"
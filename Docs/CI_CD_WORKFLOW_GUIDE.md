# CharusatNeeds — CI/CD & Team Workflow Guide

> Complete guide for all team members on how to push code, create PRs, and work with the CI/CD pipeline.

---

## How the CI/CD Pipeline Works

### Pipeline Overview

```
Push/PR to develop or main
          │
          ▼
┌─────────────────────────────────────┐
│        GitHub Actions CI            │
│                                     │
│  ┌──────────────┐ ┌──────────────┐  │
│  │   Backend    │ │   Frontend   │  │
│  │  (parallel)  │ │  (parallel)  │  │
│  │              │ │              │  │
│  │ Java 17      │ │ Node 18     │  │
│  │ mvn clean    │ │ npm ci      │  │
│  │   verify     │ │ npm run lint│  │
│  │              │ │ npm run     │  │
│  │              │ │  typecheck  │  │
│  │              │ │ npm run     │  │
│  │              │ │   build     │  │
│  └──────┬───────┘ └──────┬──────┘  │
│         │                │         │
│         └────────┬───────┘         │
│                  ▼                 │
│         ✅ Both must pass          │
│         to merge PR                │
└─────────────────────────────────────┘
```

### What Triggers CI

| Event | Branch | Pipeline |
|-------|--------|----------|
| **Push** | `develop` | CI Pipeline + Deploy to Staging |
| **Pull Request** | → `develop` | CI Pipeline |
| **Pull Request** | → `main` | CI Pipeline |
| **Push** | `main` | Deploy to Production |

### What CI Checks

| Job | Steps | Failure Means |
|-----|-------|--------------|
| **Backend** | `mvn clean verify` | Java compilation error or test failure |
| **Frontend Lint** | `npm run lint` | ESLint violations (currently non-blocking) |
| **Frontend Typecheck** | `npm run typecheck` (`tsc --noEmit`) | TypeScript type errors |
| **Frontend Build** | `npm run build` (`tsc -b && vite build`) | Build failure — missing imports, syntax errors |

### Branch Protection Rules

| Branch | Rules |
|--------|-------|
| `main` | ❌ No direct push. Must use PR. CI must pass. 1 approval required. |
| `develop` | ✅ Direct push allowed (for project owner). PR merges allowed for everyone. |

---

## 🔴 Project Owner Workflow (Kush Shah — @kush1310)

### First-Time Setup

```bash
# Clone the repository
git clone https://github.com/kush1310/ProjectX.git
cd ProjectX

# Set up backend
cd Backend
# Edit src/main/resources/application.properties (DB, JWT, OAuth, SMTP)
mvn clean install
cd ..

# Set up frontend
cd Frontend
npm install
# Copy .env.example to .env and fill in values
cd ..
```

### Daily Workflow

#### 1. Start your day — pull latest changes

```bash
git checkout develop
git pull origin develop
```

#### 2. Create a feature branch

```bash
git checkout -b feature/your-feature-name
```

#### 3. Make changes, test locally

```bash
# Test backend compiles
cd Backend
mvn clean verify -B
cd ..

# Test frontend compiles
cd Frontend
npm run typecheck
npm run build
cd ..
```

#### 4. Commit your changes

```bash
git add -A
git commit -m "feat: add payment gateway integration"
```

> Use Conventional Commits format: `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`

#### 5. Push your branch

```bash
git push origin feature/your-feature-name
```

#### 6. Merge to develop (owner privilege)

As the project owner, you can either:

**Option A — Direct merge (quick fixes):**
```bash
git checkout develop
git merge feature/your-feature-name --no-edit
git push origin develop
```

**Option B — Create PR on GitHub (preferred for tracked history):**
- Go to GitHub → Pull Requests → New Pull Request
- **From:** `feature/your-feature-name` → **To:** `develop`
- Wait for CI to pass ✅
- Merge the PR

#### 7. Release to main (requires PR)

```bash
# main is protected — you CANNOT push directly
# Create a PR: develop → main on GitHub
# Wait for CI ✅ → Approve → Merge
```

### Owner-Only: CI/CD Management

```bash
# View CI workflow files
ls .github/workflows/
#   ci.yml              ← Runs on PR/push to develop & main
#   cd-staging.yml      ← Deploys on push to develop
#   cd-production.yml   ← Deploys on push to main

# Run CI checks locally before pushing
cd Backend && mvn clean verify -B && cd ..
cd Frontend && npm run typecheck && npm run build && cd ..
```

### Owner-Only: Emergency Hotfix

```bash
# Create hotfix branch from main
git checkout main
git pull origin main
git checkout -b hotfix/critical-fix

# Make fix, commit, push
git add -A
git commit -m "fix: critical security patch"
git push origin hotfix/critical-fix

# Create PR: hotfix/critical-fix → main on GitHub
# After merge, also merge main back into develop:
git checkout develop
git pull origin develop
git merge main --no-edit
git push origin develop
```

---

## 🔵 Team Member Workflow (Dhairy, Ishan, Krina, Mrugendra)

### First-Time Setup

```bash
# Step 1: Clone the repository
git clone https://github.com/kush1310/ProjectX.git
cd ProjectX

# Step 2: Set up backend
cd Backend
mvn clean install
cd ..

# Step 3: Set up frontend
cd Frontend
npm install
cd ..

# Step 4: Switch to develop branch
git checkout develop
git pull origin develop
```

### Daily Workflow — Step by Step

#### Step 1: Pull latest changes (ALWAYS do this first!)

```bash
git checkout develop
git pull origin develop
```

#### Step 2: Create your feature branch

```bash
# Name your branch with the convention: feature/<description>
git checkout -b feature/your-feature-name

# Examples:
git checkout -b feature/menu-crud-ui
git checkout -b feature/order-tracking
git checkout -b bugfix/cart-total-nan
```

#### Step 3: Do your work

Make your code changes in the `Backend/` or `Frontend/` folders.

#### Step 4: Test locally before committing

```bash
# If you changed backend code:
cd Backend
mvn clean verify -B
cd ..

# If you changed frontend code:
cd Frontend
npm run typecheck       # Must show 0 errors
npm run build           # Must succeed
cd ..
```

> [!IMPORTANT]
> **DO NOT skip this step!** If these fail locally, they WILL fail on GitHub CI and your PR will be blocked.

#### Step 5: Stage and commit your changes

```bash
# Stage all changes
git add -A

# Commit with a descriptive message (use conventional format)
git commit -m "feat: add menu item variant selector component"
```

**Commit message format:**
```
<type>: <short description>

Examples:
  feat: add coupon validation on checkout
  fix: resolve cart total NaN when no items
  refactor: extract order processing into service layer
  docs: update API reference for coupon endpoints
  style: fix button alignment on mobile view
```

#### Step 6: Push your branch to GitHub

```bash
git push origin feature/your-feature-name
```

#### Step 7: Create a Pull Request on GitHub

1. Go to [github.com/kush1310/ProjectX](https://github.com/kush1310/ProjectX)
2. You'll see a yellow banner: **"Compare & pull request"** — click it
3. Set:
   - **Base branch:** `develop`
   - **Compare branch:** `feature/your-feature-name`
4. Fill out the PR template:
   - **What** changed and **why**
   - **How** to test the changes
   - Screenshots for UI changes
5. Click **"Create Pull Request"**

#### Step 8: Wait for CI to pass

After creating the PR, GitHub Actions will automatically:
1. ✅ Build the backend (`mvn clean verify`)
2. ✅ Lint the frontend (`npm run lint`)
3. ✅ Typecheck the frontend (`tsc --noEmit`)
4. ✅ Build the frontend (`vite build`)

**If CI fails:** See the [Troubleshooting](#troubleshooting-ci-failures) section below.

#### Step 9: Request review

- Tag **@kush1310** as a reviewer
- Wait for at least **1 approval**

#### Step 10: After your PR is merged

```bash
# Switch back to develop and pull the merged changes
git checkout develop
git pull origin develop

# Delete your feature branch locally (cleanup)
git branch -d feature/your-feature-name
```

---

## Common Scenarios

### Scenario: Your branch is behind develop

If GitHub shows "This branch is out of date," update your branch:

```bash
# On your feature branch
git checkout feature/your-feature-name
git pull origin develop
# Resolve any conflicts in your editor
git add -A
git commit -m "fix: resolve merge conflict with develop"
git push origin feature/your-feature-name
```

### Scenario: You need to continue work on an existing branch

```bash
git checkout feature/your-feature-name
git pull origin feature/your-feature-name  # in case someone else pushed
# Make changes
git add -A
git commit -m "feat: add loading states to order tracking"
git push origin feature/your-feature-name
```

### Scenario: You accidentally committed to develop

```bash
# Undo the last commit (keep changes)
git reset --soft HEAD~1

# Create a proper branch
git checkout -b feature/accidental-feature

# Commit and push on the new branch
git add -A
git commit -m "feat: your feature description"
git push origin feature/accidental-feature
```

---

## Troubleshooting CI Failures

### Backend Build Failure (`mvn clean verify`)

**Symptom:** CI shows ❌ on "Backend Build & Test"

```bash
# Reproduce locally
cd Backend
mvn clean verify -B 2>&1 | tail -50
```

**Common causes:**
| Issue | Fix |
|-------|-----|
| Compilation error | Fix the Java syntax/type error shown in logs |
| Missing import | Add the missing import statement |
| Test failure | Fix the failing test or update the test |
| Dependency issue | Run `mvn clean install` to refresh dependencies |

### Frontend Typecheck Failure (`npm run typecheck`)

**Symptom:** CI shows ❌ on "Frontend Build & Lint" at the typecheck step

```bash
# Reproduce locally
cd Frontend
npx tsc --noEmit
```

**Common causes:**
| Issue | Fix |
|-------|-----|
| Type mismatch | Fix the TypeScript type error on the line shown |
| Missing property | Add the missing property to the interface/type |
| Unused import | Remove the unused import |
| Null safety | Add null checks or optional chaining (`?.`) |

### Frontend Build Failure (`npm run build`)

**Symptom:** CI shows ❌ on "Frontend Build & Lint" at the build step

```bash
# Reproduce locally
cd Frontend
npm run build
```

**Common causes:**
| Issue | Fix |
|-------|-----|
| Import error | Check for typos in import paths |
| Missing dependency | Run `npm install` and commit `package-lock.json` |
| Vite error | Check vite config and environment variables |

---

## Quick Reference Card

### Branch Naming

| Type | Pattern | Example |
|------|---------|---------|
| Feature | `feature/<description>` | `feature/payment-gateway` |
| Bug Fix | `bugfix/<description>` | `bugfix/cart-total-nan` |
| Hot Fix | `hotfix/<description>` | `hotfix/login-crash` |

### Commit Types

| Type | When |
|------|------|
| `feat` | New feature |
| `fix` | Bug fix |
| `refactor` | Code restructuring |
| `docs` | Documentation |
| `style` | Formatting only |
| `chore` | Build/CI/tooling |

### The Golden Rules

> [!CAUTION]
> 1. **NEVER** push directly to `main`
> 2. **NEVER** force-push to `develop` or `main`
> 3. **ALWAYS** pull `develop` before creating a new branch
> 4. **ALWAYS** test locally before pushing
> 5. **ALWAYS** use descriptive commit messages

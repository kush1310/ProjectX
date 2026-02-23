# Enterprise GitHub Governance & DevOps Documentation

## CI/CD · Branch Protection · Access Control Model

**Project:** CharusatNeeds — Campus Food Aggregator  
**Repository:** [kush1310/ProjectX](https://github.com/kush1310/ProjectX)  
**Last Updated:** February 2026

---

## 1. Purpose

This document defines the enterprise workflow for collaborative development on CharusatNeeds. It ensures:

- Concurrent development without conflict across 5 team members
- Controlled code integration via Pull Requests
- Automated quality validation through CI/CD
- Secure production deployment
- Full audit traceability

---

## 2. Repository Architecture

### 2.1 Branch Strategy

| Branch      | Purpose                                     | Protection                   |
| ----------- | ------------------------------------------- | ---------------------------- |
| `main`      | Production-ready, stable code               | Protected (PR + CI required) |
| `develop`   | Integration branch for latest combined work | Protected (PR + CI required) |
| `feature/*` | Individual feature development              | Unprotected                  |
| `bugfix/*`  | Bug-related changes                         | Unprotected                  |
| `hotfix/*`  | Critical production emergency fixes         | Unprotected                  |
| `release/*` | Pre-production stabilization                | Unprotected                  |

### 2.2 Branch Flow

```
main (production)
  ↑ PR + CI + Approval
develop (integration)
  ↑ PR + CI
feature/* | bugfix/* | hotfix/* | release/*
  ↑
Individual developer work
```

**Rules:**

- No direct push to `main` or `develop`
- All changes go through Pull Requests
- CI must pass before merge is allowed

---

## 3. Access Control Model (RBAC)

### 3.1 Role Definitions

| Role           | Responsibility                              | GitHub Permission |
| -------------- | ------------------------------------------- | ----------------- |
| **Owner**      | Full governance, billing, security policies | Admin             |
| **Maintainer** | Merge PRs, manage branches, configure CI/CD | Maintain          |
| **Developer**  | Feature development, raise PRs              | Write             |
| **Reviewer**   | Code approval                               | Write             |
| **Viewer**     | Read-only access (interns, stakeholders)    | Read              |

### 3.2 Current Team Allocation

| Member    | Role      | GitHub Username |
| --------- | --------- | --------------- |
| Kush Shah | Owner     | @kush1310       |
| TBD       | Developer | —               |
| TBD       | Developer | —               |
| TBD       | Developer | —               |
| TBD       | Developer | —               |

> Update this table as team members are onboarded.

### 3.3 Team-Based Permissions (Future Scale)

When the team grows, create GitHub Teams:

- `core-team` → Maintain access
- `backend-team` → Write access to `/Backend/`
- `frontend-team` → Write access to `/Frontend/`
- `devops-team` → Admin access to `/.github/`

---

## 4. Branch Protection Policy

### 4.1 Protection Rules for `main`

| Rule                                | Setting            |
| ----------------------------------- | ------------------ |
| Require Pull Request before merging | ✅ Enabled         |
| Required approving reviews          | 1 minimum          |
| Dismiss stale PR approvals          | ✅ Enabled         |
| Require status checks to pass       | ✅ (`CI Pipeline`) |
| Require branches to be up to date   | ✅ Enabled         |
| Restrict who can push               | ✅ (Owner only)    |
| Enforce for administrators          | ✅ Enabled         |

### 4.2 Protection Rules for `develop`

| Rule                                | Setting            |
| ----------------------------------- | ------------------ |
| Require Pull Request before merging | ✅ Enabled         |
| Required approving reviews          | 1 minimum          |
| Dismiss stale PR approvals          | ✅ Enabled         |
| Require status checks to pass       | ✅ (`CI Pipeline`) |
| Require branches to be up to date   | ✅ Enabled         |

---

## 5. CI/CD Architecture

### 5.1 CI Pipeline (Automatic on Every PR)

**File:** `.github/workflows/ci.yml`

```
PR opened/updated → CI triggered → Two parallel jobs:

Job 1: Backend
  ├── Checkout code
  ├── Setup Java 17 (Temurin)
  ├── mvn clean verify
  └── Upload test reports (on failure)

Job 2: Frontend
  ├── Checkout code
  ├── Setup Node 18
  ├── npm ci
  ├── npm run lint
  ├── npm run typecheck
  └── npm run build
```

**Merge is blocked if either job fails.**

### 5.2 CD — Staging Deployment

**File:** `.github/workflows/cd-staging.yml`

- Triggered on push to `develop`
- Deploys to staging environment
- Currently a placeholder — configure with your server details

### 5.3 CD — Production Deployment

**File:** `.github/workflows/cd-production.yml`

- Triggered on push to `main`
- Requires manual approval via GitHub Environments
- Currently a placeholder — configure with your server details

### 5.4 Pipeline Flow

```
feature/* → PR to develop → CI validates → Merge → Deploy to Staging
                                                          ↓
develop → PR to main → CI validates + Approval → Merge → Deploy to Production
```

---

## 6. Pull Request Standards

Every PR must include:

1. **Clear title** following Conventional Commits
2. **Linked issue** reference (`Closes #42`)
3. **Description** of changes and motivation
4. **Screenshots** for UI changes
5. **Testing proof** — how changes were verified

### PR Checklist (enforced via template)

- [ ] Code compiles without errors
- [ ] All existing tests pass
- [ ] New tests added for new functionality
- [ ] Linting passes
- [ ] No console errors or warnings
- [ ] Documentation updated
- [ ] Screenshots attached (if UI changes)

---

## 7. Conflict Management

### When Conflicts Occur

1. Pull latest `develop` into your feature branch:

   ```bash
   git checkout feature/your-branch
   git pull origin develop
   ```

2. Resolve conflicts locally (look for `<<<<<<` markers)

3. Commit and push:

   ```bash
   git add .
   git commit -m "fix: resolve merge conflict with develop"
   git push
   ```

4. PR re-validation runs automatically after push

### Prevention Strategies

- Pull `develop` daily before starting work
- Keep feature branches short-lived (1–3 days)
- Avoid modifying the same files unnecessarily
- Follow clear module ownership (see CODEOWNERS)
- Communicate with the team about shared files

---

## 8. Release Management

### Creating a Release

1. Create release branch from `develop`:

   ```bash
   git checkout -b release/v1.0.0 develop
   ```

2. Stabilize — fix only bugs, no new features

3. Merge into `main` via PR

4. Tag the release:

   ```bash
   git tag -a v1.0.0 -m "Production release v1.0.0"
   git push origin v1.0.0
   ```

5. Merge back into `develop`

### Hotfix Process

1. Branch from `main`:

   ```bash
   git checkout -b hotfix/critical-fix main
   ```

2. Fix and test

3. PR to `main` AND `develop`

---

## 9. Security Controls

### Enabled Protections

| Control                        | Status |
| ------------------------------ | ------ |
| Branch protection on `main`    | ✅     |
| Branch protection on `develop` | ✅     |
| CODEOWNERS enforcement         | ✅     |
| CI validation on PRs           | ✅     |
| `.env` in `.gitignore`         | ✅     |

### Recommended Additions

| Control                | How to Enable                                  |
| ---------------------- | ---------------------------------------------- |
| Dependabot             | Settings → Security → Enable Dependabot alerts |
| Secret scanning        | Settings → Security → Enable secret scanning   |
| 2FA enforcement        | Organization → Settings → Require 2FA          |
| CodeQL analysis        | Security → Code scanning → Set up CodeQL       |
| HTTPS-only enforcement | Settings → General → Always redirect to HTTPS  |

---

## 10. CODEOWNERS

**File:** `.github/CODEOWNERS`

Automatically requests reviews from code owners when their files are modified.

| Path          | Owner     |
| ------------- | --------- |
| `*` (default) | @kush1310 |
| `/Backend/`   | @kush1310 |
| `/Frontend/`  | @kush1310 |
| `/.github/`   | @kush1310 |
| `/Docs/`      | @kush1310 |

> Update with team member usernames as they join.

---

## 11. Developer Daily Checklist

- [ ] Pull latest `develop` before starting work
- [ ] Work only in your feature/bugfix branch
- [ ] Commit in small, logical, focused units
- [ ] Push your branch and raise a PR with full documentation
- [ ] Address review comments promptly
- [ ] Never push directly to `main` or `develop`

## 12. Admin Weekly Checklist

- [ ] Review and merge pending PRs
- [ ] Monitor CI pipeline failures and fix flaky tests
- [ ] Check Dependabot alerts for security vulnerabilities
- [ ] Review team access and permissions
- [ ] Audit branch protection rules
- [ ] Rotate secrets if needed

---

## 13. Recovery Procedures

### If Something Goes Wrong

The repository has a safety backup created before this workflow was set up:

- **Tag:** `v0.0.0-pre-workflow` — permanent recovery point
- **Branch:** `backup/pre-workflow-setup` — full copy of original state

### Recovery Commands

```bash
# View the backup state
git show v0.0.0-pre-workflow

# Full recovery to pre-workflow state
git checkout main
git reset --hard v0.0.0-pre-workflow
git push origin main --force
```

---

## 14. Scalability

This setup supports:

| Scale           | Model                                      |
| --------------- | ------------------------------------------ |
| 5 developers    | Single repo, team-based ownership          |
| 20 developers   | Multi-team ownership via CODEOWNERS        |
| 100+ developers | Microservices architecture, multiple repos |

---

## 15. Compliance Alignment

This governance model aligns with:

- DevSecOps best practices
- SOC 2 development controls
- ISO 27001 information security standards
- Enterprise-grade auditability requirements

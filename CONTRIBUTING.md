# Contributing to CharusatNeeds

Thank you for contributing to the CharusatNeeds project! This guide ensures consistent collaboration across the team.

---

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/kush1310/ProjectX.git
cd ProjectX
```

### 2. Switch to the Integration Branch

```bash
git checkout develop
git pull origin develop
```

### 3. Set Up Your Environment

**Backend:**

```bash
cd Backend
# Configure src/main/resources/application.properties (see README.md)
mvn clean install
mvn spring-boot:run
```

**Frontend:**

```bash
cd Frontend
npm install
# Copy .env.example to .env and fill in values
npm run dev
```

---

## Branching Strategy

We follow **Git Flow**. All work happens in isolated branches off `develop`.

### Branch Naming Conventions

| Type    | Pattern                 | Example                         |
| ------- | ----------------------- | ------------------------------- |
| Feature | `feature/<description>` | `feature/payment-gateway`       |
| Bug Fix | `bugfix/<description>`  | `bugfix/cart-total-calculation` |
| Hot Fix | `hotfix/<description>`  | `hotfix/login-crash`            |
| Release | `release/<version>`     | `release/v1.1.0`                |

### Rules

- **Never** push directly to `main` or `develop`
- **Always** branch from the latest `develop`
- Keep branches **short-lived** (merge within 1–3 days)

---

## Daily Workflow

### Step 1 -- Pull Latest Changes

```bash
git checkout develop
git pull origin develop
```

### Step 2 -- Create Your Branch

```bash
git checkout -b feature/your-feature-name
```

### Step 3 -- Work and Commit

```bash
git add .
git commit -m "feat: add payment gateway integration"
```

### Step 4 -- Push Your Branch

```bash
git push origin feature/your-feature-name
```

### Step 5 -- Open a Pull Request

- Go to GitHub → Pull Requests → New Pull Request
- **From:** `feature/your-feature-name`
- **To:** `develop`
- Fill out the PR template completely
- Request review from at least one team member

---

## Commit Message Standards

Use the **Conventional Commits** format:

```
<type>: <short description>

[optional body]
[optional footer]
```

### Types

| Type       | When to Use                              |
| ---------- | ---------------------------------------- |
| `feat`     | New feature                              |
| `fix`      | Bug fix                                  |
| `refactor` | Code restructuring (no behavior change)  |
| `docs`     | Documentation only                       |
| `style`    | Formatting, whitespace (no logic change) |
| `test`     | Adding or updating tests                 |
| `chore`    | Build, CI, tooling changes               |

### Examples

```
feat: add coupon validation on checkout
fix: resolve cart total NaN when no items
refactor: extract order processing into service layer
docs: update API reference for coupon endpoints
```

### Rules

- Keep subject line under **72 characters**
- Use **imperative mood** ("add" not "added")
- One logical change per commit

---

## Pull Request Guidelines

### Before Submitting

- [ ] Pull latest `develop` and merge into your branch
- [ ] Code compiles without errors
- [ ] All tests pass (`mvn verify` / `npm run lint && npm run typecheck`)
- [ ] No console errors or warnings
- [ ] PR template filled out completely

### PR Description Must Include

1. **What** changed and **why**
2. **How** to test the changes
3. Screenshots for any UI changes
4. Link to related issue (`Closes #42`)

### Review Process

1. At least **1 approval** required before merge
2. Address all review comments
3. CI pipeline must pass (green checks)
4. Merge via **Squash and Merge** or **Merge Commit** (no rebase)

---

## Resolving Merge Conflicts

If GitHub shows conflicts:

```bash
# On your feature branch
git checkout feature/your-feature
git pull origin develop

# Resolve conflicts in your editor
# Look for <<<<<<< HEAD / ======= / >>>>>>> markers

# After resolving
git add .
git commit -m "fix: resolve merge conflict with develop"
git push
```

**Never** force-push to shared branches.

---

## Code Review Checklist

When reviewing someone's PR, check:

- [ ] Code follows project conventions
- [ ] No hardcoded secrets or credentials
- [ ] Error handling is present
- [ ] No unnecessary console.log or System.out.println
- [ ] Changes are focused (single responsibility)
- [ ] Tests cover new functionality
- [ ] Documentation updated if API changed

---

## Module Ownership

| Module        | Owners                                                                |
| ------------- | --------------------------------------------------------------------- |
| Backend API   | @kush1310 @dhairy18 @Ishanshastithecoder @krinaparikh227 @Mrugendra83 |
| Frontend UI   | @kush1310 @dhairy18 @Ishanshastithecoder @krinaparikh227 @Mrugendra83 |
| CI/CD         | @kush1310                                                             |
| Documentation | @kush1310 @dhairy18 @Ishanshastithecoder @krinaparikh227 @Mrugendra83 |

> CI/CD configuration is managed exclusively by the project owner.

---

## Need Help?

- Check existing [issues](https://github.com/kush1310/ProjectX/issues) first
- Create a new issue using the provided templates
- Tag `@kush1310` for urgent matters

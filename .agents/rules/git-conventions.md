# Git Conventions & Commit Rules

This rule document establishes version control standards, branch naming conventions, commit message structures, and repository hygiene for the Property Market API project.

## 1. Commit Message Structure (Conventional Commits)

All commit messages must follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```text
<type>(<scope>): <subject>

[optional body]

[optional footer(s)]
```

### Commit Types
- **`feat`**: A new endpoint, feature, or capability (e.g., `feat(api): add GET /api/v1/listings endpoint`).
- **`fix`**: A bug fix or correction to meet PRD requirements (e.g., `fix(validation): clamp limit parameter to 100`).
- **`docs`**: Documentation changes only (e.g., `docs(readme): add curl examples for viewing endpoints`).
- **`refactor`**: Code change that neither fixes a bug nor adds a feature (e.g., `refactor(lib): extract visitor email masking into shared helper`).
- **`test`**: Adding missing tests or correcting existing tests (e.g., `test(integration): add bad-input test cases for agents`).
- **`chore`**: Changes to build process, dependencies, or tool configurations (e.g., `chore(prisma): update schema indexes`).
- **`perf`**: Code change that improves performance (e.g., `perf(db): optimize viewing query with composite index`).

### Scopes
Use relevant, lowercase component scopes:
- `api`: General API handlers or Next.js route handlers.
- `consumer`: The separate consumer frontend application.
- `db` / `prisma`: Prisma schema, migrations, or seed scripts.
- `validation`: Zod schemas and request parameter parsers.
- `rate-limit`: Upstash Redis rate limiting logic.
- `deps`: Dependency updates.

### Subject Guidelines
- Use the imperative, present tense: "add" not "added" or "adds".
- Do not capitalize the first letter of the subject.
- Do not end the subject line with a period.
- Keep the subject line under 72 characters.

---

## 2. Branch Naming Conventions

Branches should be named using the format:
`<type>/<short-kebab-case-description>`

### Examples:
- `feat/agents-endpoints`
- `feat/listings-filter-query`
- `fix/cuid-validation-error-code`
- `test/viewings-bad-input-suite`
- `docs/api-readme-curl`

---

## 3. Commit Hygiene & Safety Rules

1. **Atomic Commits:** Make small, focused commits that represent a single logical change. Avoid monolithic commits that combine unrelated features, fixes, and refactoring.
2. **Never Commit Secrets:**
   - Never commit `.env`, `.env.local`, or files containing real database URLs (`DATABASE_URL`), Redis tokens, or hosting credentials.
   - Always verify `.gitignore` excludes local environment files before staging.
3. **Never Commit Build Artifacts:**
   - Ensure `.next/`, `node_modules/`, `coverage/`, and generated client files (except intended schema definitions) remain uncommitted.
4. **Pre-Commit Verification:**
   - Code must pass TypeScript compilation (`tsc --noEmit`) with zero errors before committing.
   - Ensure all tests pass before pushing changes to the main branch.

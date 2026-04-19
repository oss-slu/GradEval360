# Contributing Guidelines

This document outlines the workflow and standards for contributors to this project. Please follow these steps to keep changes consistent and easy to review.

---

## Before You Start

- Read the setup guide: [docs/setup.md](docs/setup.md)
- Review our code of conduct: [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)
- Skim the architecture diagram: [docs/architecture.svg](docs/architecture.svg)

---

## Workflow

### Branching Strategy
To keep our project organized, we link all code changes directly to issues.

1. **Create Branch:**  
   Navigate to the specific GitHub Issue page and use the **"Create a branch"** link in the sidebar.

2. **Sync Locally:**  
   Pull the new branch to your machine:

   ```bash
   git fetch origin
   git checkout <your-branch-name>
   ```

3. **Work:**  
   Commit your changes locally using descriptive messages.

---

## Submission Process

When you are ready to submit your work:

### 1. Push to GitHub

```bash
git add .
git commit -m "Briefly describe your changes"
git push -u origin <your-branch-name>
```

> **Note:** For all subsequent pushes to the same branch, a simple `git push` will suffice.

---

### 2. Open a Pull Request (PR)

- Go to the repository on GitHub and click **"Compare & pull request"**.
- **Reviewers:** Assign the Tech Lead to review.
- **Description:** Add a descriptive comment explaining what you did.  
  Use the phrase `Closes #123` (replace 123 with your issue number) to link the issue.
- **Notify:** Send a link to the PR in the team Slack channel.

---

> ⚠️ **CAUTION — Merge Policy**  
> Only the Tech Lead is authorized to merge branches into the main codebase.  
> Do **not** merge your own PR.

---

## Standards and Expectations

### Sprint Deadlines

- **Completion:** All assigned issues must be completed by the end of the sprint.
- **Mid-Sprint PR:** You are required to have a Pull Request opened with at least **50% completion** halfway through the sprint.  
  This allows the Tech Lead to provide guidance and ensure you aren't stuck on the wrong track.

---

## Issue Labels

We use labels to make issues easier to pick up and prioritize.

- `good first issue` for newcomer-friendly tasks
- `help wanted` for contributor-ready tasks
- `bug` for defects and regressions
- `enhancement` for new features or improvements
- `documentation` for docs-only changes

If you are new to the project, start with issues labeled `good first issue`.

---

## Pull Request Checklist

- Keep PRs focused and scoped to a single issue.
- Link the issue in the PR description using `Closes #123`.
- Add screenshots for UI changes.
- Note any follow-up work or tradeoffs in the PR body.

## Testing Guide

Before opening a PR, run the checks that match your change:

```bash
npm test
npm run test:coverage
```

Useful commands:

- `npm test`: runs all workspace unit tests
- `npm run test:coverage`: runs all workspace tests with enforced coverage thresholds
- `npm --prefix server run test:integration`: runs the server integration script against a running backend
- `npm run lint`: runs available workspace lint tasks

Test placement rules:

- Put frontend unit tests in `client/tests/unit/`
- Put backend unit tests in `server/tests/unit/`
- Put shared schema tests in `shared/tests/unit/`
- Reserve `client/tests/integration/` and `server/tests/integration/` for multi-module flows
- Reserve `tests/e2e/` for future full-system journeys
- Reuse builders from `tests/fixtures/` before creating new ad hoc sample objects

Coverage thresholds enforced in CI:

- `client`: lines `>= 90`, branches `>= 70`, functions `>= 100`
- `server`: lines `>= 95`, branches `>= 75`, functions `>= 85`
- `shared`: lines `>= 100`, branches `>= 100`, functions `>= 50`

## Code Boundaries

Keep changes aligned with the repo boundaries:

- `client/src/`: UI, page composition, browser-only behavior
- `client/tests/`: frontend tests only
- `server/src/routes/*.logic.ts`: pure workflow logic that should stay easy to unit test
- `server/src/routes/*.ts`: request/response orchestration
- `shared/schemas/`: shared contracts used by both client and server
- `tests/fixtures/`: reusable test data builders shared across packages

---

## Communication

Effective communication is key to our success.

- **Primary Channel:** Slack is our main hub for technical discussion and assistance. [Slack](https://oss-slu.slack.com/archives/C0AB0SMMAKY)
- **Emergency Only:** If a teammate is unresponsive on Slack, you may use the texting group chat to nudge them to check Slack.
- **The "2-Hour Wall":**  
  If you are stuck on a technical error or blocker for more than **2 hours**, you must escalate the issue in Slack.  
  Do not waste a full day on a single bug without asking for help!

---

**Questions?** Reach out to the Tech Lead on Slack.

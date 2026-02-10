# Contributing Guidelines

This document outlines the workflow and standards for all contributors to this project. Please follow these steps to ensure a smooth development process.

---

## 🚀 Workflow

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

## 📤 Submission Process

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

## 📋 Standards & Expectations

### Sprint Deadlines

- **Completion:** All assigned issues must be completed by the end of the sprint.
- **Mid-Sprint PR:** You are required to have a Pull Request opened with at least **50% completion** halfway through the sprint.  
  This allows the Tech Lead to provide guidance and ensure you aren't stuck on the wrong track.

---

## 💬 Communication

Effective communication is key to our success.

- **Primary Channel:** Slack is our main hub for technical discussion and assistance. [Slack](https://oss-slu.slack.com/archives/C0AB0SMMAKY)
- **Emergency Only:** If a teammate is unresponsive on Slack, you may use the texting group chat to nudge them to check Slack.
- **The "2-Hour Wall":**  
  If you are stuck on a technical error or blocker for more than **2 hours**, you must escalate the issue in Slack.  
  Do not waste a full day on a single bug without asking for help!

---

**Questions?** Reach out to the Tech Lead on Slack.

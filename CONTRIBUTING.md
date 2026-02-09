**Workflow:**

*Branching Strategy:*

For each issue:

In main branch, type:

git branch feature/your-issue-id
git checkout feature/your-issue-id


Then, work on your issue in this branch. When you are finished, type:

git add .

git commit -m "your message here"

git push -u origin feature/your-issue-id (if it's your first push. Do "git push" for every push after that.)

Then, go to GitHub and create a pull request, assign the tech lead to review it, and inform the tech lead via the Slack chanel.

*Merege Policy:*

Nobody is allowed to merge anything except the tech lead. The tech lead will merge everyone's branch after he approves of it.

**Standards:**

At the end of each sprint, the issue assigned should be completed. Halfway through the sprint, a pull request with at least a dent amount of work should be done. This is so that the tech lead can ssist in any areas where you are struggling, or can give you advice on what to do from that point forward.

**Communication:**

Team members must communicate and ask for assistance via Slack as the main form of communication. In the case of people not responding to Slack, team mates may use the texting group chat to remind everyone to look at the slack channel. 
The "2-Hour Wall": If a developer is stuck on a technical error for more than 2 hours,
they must escalate the issue via Slack for assistance.

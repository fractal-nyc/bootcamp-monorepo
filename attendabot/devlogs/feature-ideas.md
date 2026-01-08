# Features

- Read people's EOD messages, follow links to their PRs, ingest their contents, store them somewhere, analyze them.
- Prepare a morning briefing for the instructors on the status of each student (e.g. who was late, who didn't write their EOD, who didn't do enough PRs) and an overall temperature check of the cohort.
- Keep a dossier on every student (stored in Airtable?) based on their Discord and Github activity.
- Be able to read instructor notes on a per student basis from Airtable.
- Send other reminders to students (e.g. upcoming workshops, demo prep).
- ...

# Bug fixes

- Need to make links in messages clickable.

- ...

# Random thoughts

- Probably don't want to do LLM analysis on every single message that someone sends. Also probably don't want to store each individual message that a user sends, especially if it's decontextualized. What's the most useful thing? If we DO want to respond proactively to high-priority messages though, we could look for keywords. Probably most useful would be to synthesize their Discord and Github output, plus any blog posts they've written or tweets they've sent.
- ...

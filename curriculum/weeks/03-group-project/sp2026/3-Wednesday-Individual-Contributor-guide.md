# Overview

Tips and tricks for succeeding as an Individual Contributor (IC) in a software project.

## Morning

- Standardizing work product
  - Linting
    - Checks for risky patterns in code that are syntactically valid but may cause bugs or performance issues
    - Suggested tool: ESLint
  - Formatting
    - Everyone has their own preferences for how code should look (e.g. tabs vs. spaces...)
    - But, code is read more often than written, so you want a standard appearance.
    - And, you don't want to waste a bunch of time in code reviews nitpicking over formatting details.
    - Best to have an automated process that enforces a popular style guide.
    - Suggested tool: Prettier
  - Testing
    - With AI coding, deep test coverage is easier than ever.
    - All tests should pass before merging a PR to keep the build "green."
    - PRs should be rolled back if they cause a regression. This is safer than trying to "fix it forward."
    - Once your app gets complex enough, you'll typically set up a "staging" environment where you can test the code in a realistic environment before promoting it to production.
  - Automate linting, formatting, and testing with precommit hooks (try Husky: https://typicode.github.io/husky/)
- PRs
  - Description
    - Say what change is being made (can go in the title).
    - Say why the change was made.
    - Google's guidance: https://google.github.io/eng-practices/review/developer/cl-descriptions.html
  - Size
    - Favor small PRs. They're easier to review and less likely to contain bugs because they're more focused.
    - Google's best practices for small PRs ("CLs" in their language): https://google.github.io/eng-practices/review/developer/small-cls.html
  - Code review
    - Catches bugs, shares knowledge across teams,
    - Best practices (useful for code authors too): https://google.github.io/eng-practices/review/reviewer/looking-for.html
    - If you're coding with AI, you should review its output first **before** sending it to your peer for review, otherwise you're offloading the most difficult part onto your coworker.

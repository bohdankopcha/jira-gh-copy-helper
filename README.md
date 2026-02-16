# jira-gh-copy-helper

Chrome/Arc extension that copies Jira ticket and GitHub PR/Issue titles as formatted links.

## What it does

When you're on a Jira ticket or GitHub PR/Issue page, press:

- **`Cmd+C`** — copies a rich text link (paste into Slack, Notion, etc. and it becomes a clickable link)
- **`Cmd+Shift+C`** — copies a markdown link

If you have text selected on the page, standard copy behavior is preserved.

### Copy formats

**Jira** (e.g. on `https://savvylabs.atlassian.net/browse/SPM-783`):
- Rich: `[SPM-783] Model Builder UX Improvements` (clickable link)
- Markdown: `[[SPM-783] Model Builder UX Improvements](https://savvylabs.atlassian.net/browse/SPM-783)`

**GitHub** (e.g. on `https://github.com/org/repo/pull/123`):
- Rich: `[#123] Some updates` (clickable link)
- Markdown: `[[#123] Some updates](https://github.com/org/repo/pull/123)`

## Installation

1. Clone this repo
2. Open `chrome://extensions/` (or `arc://extensions/`)
3. Enable **Developer mode** (toggle in top right)
4. Click **Load unpacked**
5. Select the repo folder

The extension auto-activates on `*.atlassian.net` and `github.com` pages.

## Updating

After pulling changes, go to `chrome://extensions/` and click the reload button on the extension card.

## Troubleshooting

If copying stops working on a site, it's likely because the site updated its DOM structure.

### Debugging

1. Open the page where it's broken
2. Open DevTools (`Cmd+Option+I`) → Console
3. Check if there are errors from the content script
4. Go to Elements tab and inspect the page title element to find the current selector

### Fixing Jira

In `content.js`, find `getJiraSummary()`. The `selectors` array contains CSS selectors for the ticket title. Inspect the `<h1>` element on the Jira ticket page and add/update the matching selector.

`getJiraKey()` extracts the ticket ID from the URL (`/browse/SPM-783`), which is unlikely to break.

### Fixing GitHub

In `content.js`, find `getGitHubData()`. It tries two strategies:

1. **DOM selectors** — the list of `querySelector` calls at the top of the function. Inspect the PR title element and update selectors if needed.
2. **`<title>` tag fallback** — parses the browser tab title (format: `"Title by author · Pull Request #123 · org/repo"`). This is more stable but will break if GitHub changes their title format.

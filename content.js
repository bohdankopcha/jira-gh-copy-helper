document.addEventListener("keydown", (e) => {
  if (!e.metaKey || e.key !== "c") return;

  const selection = window.getSelection();
  if (selection && selection.toString().trim().length > 0) return;

  const data = getPageData();
  if (!data) return;

  e.preventDefault();

  const { label, url } = data;

  if (e.shiftKey) {
    const markdown = `[${label}](${url})`;
    navigator.clipboard.writeText(markdown).then(() => {
      showToast("Markdown", markdown);
    });
  } else {
    const html = `<a href="${url}">${label}</a>`;
    navigator.clipboard.write([
      new ClipboardItem({
        "text/html": new Blob([html], { type: "text/html" }),
        "text/plain": new Blob([label], { type: "text/plain" }),
      }),
    ]).then(() => {
      showToast("Rich link", label);
    });
  }
});

function getPageData() {
  const host = window.location.hostname;

  if (host.endsWith("atlassian.net")) return getJiraData();
  if (host === "github.com") return getGitHubData();

  return null;
}

// --- Jira ---

function getJiraData() {
  const key = getJiraKey();
  if (!key) return null;

  const summary = getJiraSummary();
  if (!summary) return null;

  return {
    label: `[${key}] ${summary}`,
    url: `${window.location.origin}/browse/${key}`,
  };
}

function getJiraKey() {
  const browseMatch = window.location.pathname.match(/\/browse\/([A-Z][A-Z0-9]+-\d+)/);
  if (browseMatch) return browseMatch[1];

  const searchParams = new URLSearchParams(window.location.search);
  const selectedIssue = searchParams.get("selectedIssue");
  if (selectedIssue && /^[A-Z][A-Z0-9]+-\d+$/.test(selectedIssue)) return selectedIssue;

  const breadcrumb = document.querySelector('[data-testid="issue.views.issue-base.foundation.breadcrumbs.current-issue.item"] a');
  if (breadcrumb) {
    const text = breadcrumb.textContent.trim();
    if (/^[A-Z][A-Z0-9]+-\d+$/.test(text)) return text;
  }

  return null;
}

function getJiraSummary() {
  const selectors = [
    '[data-testid="issue.views.issue-base.foundation.summary.heading"]',
    '[data-testid="issue.views.issue-details.header.summary"]',
    'h1[data-testid*="summary"]',
    '[data-testid="issue.views.issue-base.foundation.summary"] h1',
    '#summary-val',
    '.ghx-selected .ghx-summary',
  ];

  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (el) {
      const text = el.textContent.trim();
      if (text) return text;
    }
  }

  return null;
}

// --- GitHub ---

function getGitHubData() {
  // Match PR or Issue URL: /owner/repo/pull/123 or /owner/repo/issues/123
  const match = window.location.pathname.match(/\/[^/]+\/[^/]+\/(pull|issues)\/(\d+)/);
  if (!match) return null;

  const number = match[2];

  // Try DOM selectors first
  const titleEl =
    document.querySelector(".gh-header-title .js-issue-title") ||
    document.querySelector(".gh-header-title .markdown-title") ||
    document.querySelector("bdi.js-issue-title") ||
    document.querySelector("[data-testid='issue-title']") ||
    document.querySelector("h1.gh-header-title span") ||
    document.querySelector("h1 .markdown-title");

  if (titleEl) {
    const title = titleEl.textContent.trim();
    if (title) {
      return {
        label: `[#${number}] ${title}`,
        url: window.location.origin + window.location.pathname,
      };
    }
  }

  // Fallback: parse from <title> tag
  // Format: "Title by author · Pull Request #123 · org/repo"
  // or:     "Title · Issue #123 · org/repo"
  const pageTitle = document.title;
  const prMatch = pageTitle.match(/^(.+?)(?:\s+by\s+.+?)?\s+·\s+(?:Pull Request|Issue)\s+#\d+/);
  if (prMatch) {
    return {
      label: `[#${number}] ${prMatch[1].trim()}`,
      url: window.location.origin + window.location.pathname,
    };
  }

  return null;
}

// --- Toast ---

function showToast(mode, text) {
  const existing = document.getElementById("jira-copy-toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.id = "jira-copy-toast";
  toast.textContent = `${mode}: ${text}`;
  Object.assign(toast.style, {
    position: "fixed",
    bottom: "20px",
    right: "20px",
    background: "#1b2638",
    color: "#fff",
    padding: "12px 20px",
    borderRadius: "8px",
    fontSize: "13px",
    fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
    zIndex: "999999",
    maxWidth: "500px",
    wordBreak: "break-all",
    boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
    transition: "opacity 0.3s",
    opacity: "1",
  });

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

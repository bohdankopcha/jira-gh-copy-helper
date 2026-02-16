document.addEventListener("keydown", (e) => {
  if (!(e.metaKey && e.key === "c")) return;

  // Don't override if user has text selected
  const selection = window.getSelection();
  if (selection && selection.toString().trim().length > 0) return;

  const ticketData = getTicketData();
  if (!ticketData) return;

  e.preventDefault();

  const { key, summary, url } = ticketData;
  const markdown = `[[${key}] ${summary}](${url})`;

  navigator.clipboard.writeText(markdown).then(() => {
    showToast(markdown);
  });
});

function getTicketData() {
  // Try to get ticket key from the breadcrumb or URL
  const key = getTicketKey();
  if (!key) return null;

  const summary = getTicketSummary();
  if (!summary) return null;

  const url = `${window.location.origin}/browse/${key}`;

  return { key, summary, url };
}

function getTicketKey() {
  // 1. From URL: /browse/SPM-783 or /browse/SPM-783?...
  const browseMatch = window.location.pathname.match(/\/browse\/([A-Z][A-Z0-9]+-\d+)/);
  if (browseMatch) return browseMatch[1];

  // 2. From URL with selected issue in board/backlog view
  const searchParams = new URLSearchParams(window.location.search);
  const selectedIssue = searchParams.get("selectedIssue");
  if (selectedIssue && /^[A-Z][A-Z0-9]+-\d+$/.test(selectedIssue)) return selectedIssue;

  // 3. From breadcrumb link on the page
  const breadcrumb = document.querySelector('[data-testid="issue.views.issue-base.foundation.breadcrumbs.current-issue.item"] a');
  if (breadcrumb) {
    const text = breadcrumb.textContent.trim();
    if (/^[A-Z][A-Z0-9]+-\d+$/.test(text)) return text;
  }

  return null;
}

function getTicketSummary() {
  // Jira Cloud - main issue view
  const selectors = [
    '[data-testid="issue.views.issue-base.foundation.summary.heading"]',
    '[data-testid="issue.views.issue-details.header.summary"]',
    'h1[data-testid*="summary"]',
    // Side panel
    '[data-testid="issue.views.issue-base.foundation.summary"] h1',
    // Fallback: first h1 that looks like a title
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

function showToast(text) {
  const existing = document.getElementById("jira-copy-toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.id = "jira-copy-toast";
  toast.textContent = `Copied: ${text}`;
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

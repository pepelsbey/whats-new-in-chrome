// Minimal HTML fixtures modeled on real developer.chrome.com pages, trimmed to
// the tags the parser reads.

export const releaseNotesHtml = `<!doctype html>
<html><head>
<title>Chrome 150 &nbsp;|&nbsp; Release notes &nbsp;|&nbsp; Chrome for Developers</title>
<meta property="og:title" content="Chrome 150 &nbsp;|&nbsp; Release notes &nbsp;|&nbsp; Chrome for Developers">
<meta property="og:description" content="CSS text-fit property, background-clip border-area, Focusgroup, and more.">
<meta property="og:url" content="https://developer.chrome.com/release-notes/150">
<link rel="canonical" href="https://developer.chrome.com/release-notes/150">
</head><body>
<p>Some content with an ampersand &amp; a quote &#39;here&#39;.</p>
<footer>Last updated 2026-06-30 UTC.</footer>
</body></html>`;

export const blogHtml = `<!doctype html>
<html><head>
<meta property="og:title" content="New in Chrome 150 &nbsp;|&nbsp; Blog &nbsp;|&nbsp; Chrome for Developers">
<meta property="og:description" content="CSS text-fit property, Focusgroup declarative keyboard navigation &amp; more.">
<link rel="canonical" href="https://developer.chrome.com/blog/new-in-chrome-150">
</head><body>
<footer>Last updated 2026-06-30 UTC.</footer>
</body></html>`;

// A page that renders but lacks the data we require.
export const incompleteHtml = `<!doctype html>
<html><head><title>Whatever</title></head><body>No meta, no date.</body></html>`;

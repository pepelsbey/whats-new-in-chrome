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

export const chromestatusHtml = `<!doctype html>
<html><head>
<meta property="og:title" content="Chrome 155 Release Notes">
<meta property="og:description" content="Discover web platform features, deprecations, and developer updates shipped in Google Chrome 155.">
<link rel="canonical" href="https://chromestatus.com/release-notes/155">
</head><body>
<h1 id="page-title">Chrome 155 Release Notes</h1>
<p class="actionlinks release-date-subtitle">Scheduled Stable Release October 6, 2026</p>
<h3 class="feature-title">
<a class="feature-name" href="/feature/5201832664629248">Additional Windowing Controls</a>
</h3>
<h3 class="feature-title">
<a class="feature-name" href="/feature/5198951632470016">Algorithm Updates in WebCrypto</a>
</h3>
<h3 class="feature-title">
<a class="feature-name" href="/feature/1">CSS Symbols()</a>
</h3>
<h3 class="feature-title">
<a class="feature-name" href="/feature/2">Margin-trim &amp; more</a>
</h3>
</body></html>`;

// A page that renders but lacks the data we require.
export const incompleteHtml = `<!doctype html>
<html><head><title>Whatever</title></head><body>No meta, no date.</body></html>`;

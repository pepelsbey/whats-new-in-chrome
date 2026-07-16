# What’s new in Chrome

Generates an Atom feed that combines two sources into one:

- **Release notes** — every [Chrome release note](https://developer.chrome.com/release-notes) (e.g. [Chrome 150](https://developer.chrome.com/release-notes/150)).
- **Blog** — every ["New in Chrome"](https://developer.chrome.com/blog) stable release post (e.g. [New in Chrome 150](https://developer.chrome.com/blog/new-in-chrome-150)).

A GitHub Action rebuilds the feed daily and publishes it to GitHub Pages:

**https://pepelsbey.github.io/whats-new-in-chrome/feed.xml**

## Why not use the existing blog feed?

developer.chrome.com [publishes an RSS feed](https://developer.chrome.com/static/blog/feed.xml), but it lags behind — it can be weeks out of date and it mixes in every blog post. This project reads the pages directly instead.

## How it works

Both sources use predictable, version-numbered URLs (`/release-notes/150`, `/blog/new-in-chrome-150`), and the individual pages are server-rendered. So the generator:

1. **Discovers versions** by probing version numbers with cheap `HEAD` requests, scanning upward until it runs past the newest release. This needs no JavaScript rendering and no hardcoded "current version".
2. **Fetches** the most recent pages (forcing `?hl=en`, since the site otherwise serves localized variants at random) and reads their `og:title`, `og:description`, and "Last updated" date from the HTML.
3. **Builds** an Atom feed (newest first) and a small `index.html`, writing both to `public/`.

## Local development

```sh
npm test        # run the unit tests
npm run build   # generate public/feed.xml and public/index.html
```

`public/` is git-ignored; it’s produced fresh on every run.

## Deployment

The [`feed.yml`](.github/workflows/feed.yml) workflow runs the tests, generates the feed, and deploys `public/` to GitHub Pages on a daily schedule (and on manual dispatch or pushes to `main`).

## Configuration

Feed metadata, the version floor, the number of entries, and the source definitions all live in [`src/config.js`](src/config.js).

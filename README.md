# What’s new in Chrome

Generates an Atom feed that combines two sources into one:

- **Release notes** — every [Chrome release note](https://developer.chrome.com/release-notes).
- **Blog** — every [“New in Chrome”](https://developer.chrome.com/blog) stable release post.

A GitHub Action rebuilds the feed daily and publishes it to GitHub Pages:

https://pepelsbey.github.io/whats-new-in-chrome/feed.xml

There’s an [official RSS feed](https://developer.chrome.com/static/blog/feed.xml), but it can be weeks out of date and it mixes in every blog post.

## How it works

1. **Discovers versions** by probing version-numbered URLs, scanning upward until it runs past the newest release.
2. **Fetches** the most recent pages and reads the title, description, and last-updated date from each.
3. **Builds** an Atom feed and writes it to `feed.xml`.

## Local development

```sh
npm test      # run the unit tests
npm run build # generate feed.xml
```

## Deployment

The [`feed.yml`](.github/workflows/feed.yml) workflow runs the tests, generates the feed, and commits `feed.xml` when it changes on a daily schedule (and on manual dispatch or pushes to `main`). Pages is configured to deploy from the `main` branch root, so the commit is the deployment.

Committing also keeps the repository active: GitHub disables scheduled workflows after 60 days without commits. The push uses the default `GITHUB_TOKEN`, whose pushes don’t trigger workflows, so the `push` trigger doesn’t loop.

## Configuration

Feed metadata, the version floor, the number of entries, and the source definitions all live in [`src/config.js`](src/config.js).

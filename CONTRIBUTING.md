# Contributing

Thanks for helping improve Dynamic Wide Content.

## Development Setup

1. Install Node.js 20 or newer.
2. Run `npm install`.
3. Run `npm run dev` while testing inside an Obsidian vault.
4. Run `npm run build` before opening a pull request.

## Pull Request Guidelines

- Keep the plugin focused on selective widening of wide content without changing normal prose width.
- Prefer static CSS in `styles.css`; do not inject generated `<style>` elements from `main.js`.
- Avoid network access, analytics, background file writes, and any behavior that reads note content unnecessarily.
- Include a short manual test note or screenshot when changing CSS selectors.

## Release Checklist

- Update `manifest.json`, `package.json`, and `versions.json`.
- Run `npm run build`.
- Push a Git tag that exactly matches the manifest version, for example `1.0.1`.
- Let the release workflow build, attest, and upload `manifest.json`, `main.js`, and `styles.css`.

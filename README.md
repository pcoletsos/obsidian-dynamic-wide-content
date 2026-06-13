# Dynamic Wide Content

**Wide tables, diagrams, images, and code blocks without widening your prose.**

Dynamic Wide Content fixes a common Obsidian annoyance: wide material gets
squeezed, clipped, or forced into awkward wrapping by the readable line length.

The plugin keeps your prose exactly where it belongs: in Obsidian's comfortable
reading column. Only genuinely wide blocks break out into a wider scrollable
frame.

## What It Does

- Preserves Obsidian's normal readable prose width.
- Expands only wide Markdown tables, code blocks, Mermaid diagrams, PlantUML
  diagrams, and image embeds.
- Adds horizontal scrolling inside the widened block frame when content is too
  wide for the pane.
- Works in Reading view and Live Preview.
- Does not require disabling readable line length globally.

## Why This Exists

Readable line length is excellent for paragraphs, headings, lists, and normal
notes. It is painful for wide content:

- pipeline or comparison tables
- architecture diagrams
- generated Mermaid and PlantUML output
- screenshots and reference images
- long code or log blocks

Dynamic Wide Content makes those blocks usable without turning every note into
a full-width wall of text.

## Settings

- **Maximum wide content width**: Controls how far wide blocks may expand.
- **Viewport side margin**: Keeps widened blocks away from the edge of the
  Obsidian pane.
- **Widen tables**: Allows Markdown tables to break out of the prose column.
- **Widen diagrams**: Allows Mermaid and PlantUML diagrams to use a wider frame.
- **Widen images**: Allows embedded images to display wider than prose.
- **Widen code blocks**: Allows preformatted code blocks to use a wider frame.
- **Keep table cells on one line**: Prevents wide tables from turning into tall,
  wrapped rows.
- **Reading view support**: Applies widening in Reading view.
- **Live Preview support**: Applies widening in Live Preview rendered embeds.

## Manual Installation

1. Download `manifest.json`, `main.js`, and `styles.css` from a release.
2. Create this folder in your vault:

   ```text
   VaultFolder/.obsidian/plugins/dynamic-wide-content/
   ```

3. Copy the three files into that folder.
4. Reload Obsidian.
5. Enable **Dynamic Wide Content** in Community Plugins.

## Development

This repository follows the standard Obsidian plugin shape.

```bash
npm install
npm run dev
```

For release builds:

```bash
npm run build
```

Community plugin releases should include:

- `manifest.json`
- `main.js`
- `styles.css`

## Privacy

Dynamic Wide Content is a local UI plugin. It does not read note content,
contact any network service, collect analytics, or write files.

## License

MIT

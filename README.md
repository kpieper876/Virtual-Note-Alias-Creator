# Virtual Note (Alias) Creator

Create a lightweight virtual note from a note in Obsidian's File Explorer. The generated note contains only an embed of the source, so the same content can appear in another folder without duplicating it.

![Illustrative virtual-note workflow](docs/images/example.png)

> The image is an illustrative example of the workflow, not a screenshot of the plugin.

## Install

1. Copy this folder to <vault>/.obsidian/plugins/virtual-note-alias/.
2. Open Settings → Community plugins.
3. Enable Virtual Note (Alias) Creator.

This is a prebuilt plugin; no npm or build step is required.

## Usage

1. In the File Explorer, right-click a Markdown note.
2. Choose **Create Virtual Note**.
3. Pick the destination folder.
4. Obsidian creates a file named Source Basename (virtual).md containing an embed of the source.

If that filename exists, a numeric suffix is added. Existing virtual notes cannot be virtualized again, which prevents recursive chains.

## Limitations

- The plugin creates a normal Markdown file and adds no frontmatter.
- The source must be a Markdown file.
- The embed follows the source, so edits remain centralized in the original.

## License

MIT. See [LICENSE](LICENSE).


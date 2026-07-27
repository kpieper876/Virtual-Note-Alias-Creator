/*
Virtual Note (Alias) Creator
Right-click a note in the File Explorer and create a "virtual" note in a chosen folder.
The virtual note is named "<Source Basename> (virtual).md" and contains only an embedded link to the source: ![[Source Note]].
No other content or metadata is added.
*/

/* global app, require */
const { Plugin, TFile, TFolder, Notice, normalizePath, SuggestModal } = require('obsidian');

class FolderSuggestModal extends SuggestModal {
  constructor(app, folders) {
    super(app);
    this.setPlaceholder("Choose destination folder…");
    this.folders = folders.sort((a, b) => a.path.localeCompare(b.path));
    this.onChooseItem = null; // caller sets this
  }
  getSuggestions(query) {
    const q = query.toLowerCase();
    return this.folders.filter(f => f.path.toLowerCase().includes(q));
  }
  renderSuggestion(folder, el) {
    el.createEl("div", { text: folder.path });
  }
  onChooseSuggestion(folder) {
    if (this.onChooseItem) this.onChooseItem(folder);
  }
}

module.exports = class VirtualNoteAliasPlugin extends Plugin {
  async onload() {
    // Add context menu item on files (right-click in File Explorer)
    this.registerEvent(
      this.app.workspace.on('file-menu', (menu, file) => {
        if (file instanceof TFile && file.extension === 'md') {
          menu.addItem((item) => {
            item.setTitle('Create Virtual Note')
              .setIcon('copy')
              .onClick(async () => {
                await this.createVirtualNote(file);
              });
          });
        }
      })
    );
  }

  async createVirtualNote(sourceFile) {
    try {
      // Prevent recursive/chain calls: do not allow creating from a file already marked as (virtual)
      if (sourceFile.basename.endsWith(' (virtual)')) {
        new Notice('This file already looks like a virtual note. Aborting.');
        return;
      }

      const allFolders = this.getAllFolders();
      if (allFolders.length === 0) {
        new Notice('No folders found in vault.');
        return;
      }

      const pickedFolder = await this.pickFolder(allFolders);
      if (!pickedFolder) return; // cancelled

      const targetFolderPath = pickedFolder.path;
      const newBase = `${sourceFile.basename} (virtual)`;
      const targetPath = await this.getUniqueMdPath(targetFolderPath, newBase);

      // Build an embed link relative to the target folder
      const link = this.app.fileManager.generateMarkdownLink(sourceFile, targetFolderPath);
      const content = '!' + link + '\n';

      await this.app.vault.create(targetPath, content);

      // Optionally open the created file
      const created = this.app.vault.getAbstractFileByPath(targetPath);
      if (created instanceof TFile) {
        await this.app.workspace.getLeaf(true).openFile(created);
      }

      new Notice(`Virtual note created: ${targetPath}`);
    } catch (e) {
      console.error(e);
      new Notice('Failed to create virtual note. See console for details.');
    }
  }

  getAllFolders() {
    const folders = [];
    const walk = (folder) => {
      folders.push(folder);
      folder.children?.forEach((child) => {
        if (child instanceof TFolder) walk(child);
      });
    };
    walk(this.app.vault.getRoot());
    return folders;
  }

  pickFolder(folders) {
    return new Promise((resolve) => {
      const modal = new FolderSuggestModal(this.app, folders);
      modal.onChooseItem = (folder) => resolve(folder);
      // If closed without choosing, resolve undefined
      modal.onClose = () => resolve(undefined);
      modal.open();
    });
  }

  async getUniqueMdPath(folderPath, baseName) {
    const safeFolder = normalizePath(folderPath);
    let candidate = normalizePath(`${safeFolder}/${baseName}.md`);
    let i = 2;
    while (this.app.vault.getAbstractFileByPath(candidate)) {
      candidate = normalizePath(`${safeFolder}/${baseName} ${i}.md`);
      i++;
    }
    return candidate;
  }
};


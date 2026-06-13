import { App, Plugin, PluginSettingTab, Setting } from "obsidian";

interface DynamicWideContentSettings {
  maxWidth: number;
  viewportMargin: number;
  widenTables: boolean;
  widenCodeBlocks: boolean;
  widenDiagrams: boolean;
  widenImages: boolean;
  noWrapTableCells: boolean;
  readingView: boolean;
  livePreview: boolean;
}

const DEFAULT_SETTINGS: DynamicWideContentSettings = {
  maxWidth: 1600,
  viewportMargin: 64,
  widenTables: true,
  widenCodeBlocks: true,
  widenDiagrams: true,
  widenImages: true,
  noWrapTableCells: true,
  readingView: true,
  livePreview: true
};

export default class DynamicWideContentPlugin extends Plugin {
  settings: DynamicWideContentSettings;
  private styleEl: HTMLStyleElement | null = null;

  async onload() {
    await this.loadSettings();

    this.styleEl = document.createElement("style");
    this.styleEl.id = "dynamic-wide-content-styles";
    document.head.appendChild(this.styleEl);
    this.register(() => this.styleEl?.remove());

    this.updateStyles();

    this.addSettingTab(new DynamicWideContentSettingTab(this.app, this));
    this.addCommand({
      id: "refresh-dynamic-wide-content",
      name: "Refresh wide content styles",
      callback: () => this.updateStyles()
    });
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
    this.updateStyles();
  }

  updateStyles() {
    if (!this.styleEl) return;
    this.styleEl.textContent = buildCss(this.settings);
  }
}

class DynamicWideContentSettingTab extends PluginSettingTab {
  plugin: DynamicWideContentPlugin;

  constructor(app: App, plugin: DynamicWideContentPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "Dynamic Wide Content" });
    containerEl.createEl("p", {
      text: "Use wide tables, diagrams, images, and code blocks without widening normal prose."
    });

    new Setting(containerEl)
      .setName("Maximum wide content width")
      .setDesc("Controls how far wide blocks may expand while prose keeps Obsidian's readable width.")
      .addSlider((slider) => slider
        .setLimits(900, 2400, 50)
        .setValue(this.plugin.settings.maxWidth)
        .setDynamicTooltip()
        .onChange(async (value) => {
          this.plugin.settings.maxWidth = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName("Viewport side margin")
      .setDesc("Keeps widened blocks away from the edge of the Obsidian pane.")
      .addSlider((slider) => slider
        .setLimits(0, 160, 8)
        .setValue(this.plugin.settings.viewportMargin)
        .setDynamicTooltip()
        .onChange(async (value) => {
          this.plugin.settings.viewportMargin = value;
          await this.plugin.saveSettings();
        }));

    addToggle(containerEl, "Widen tables", "Allow Markdown tables to break out of the prose column.", this.plugin, "widenTables");
    addToggle(containerEl, "Widen diagrams", "Allow Mermaid and PlantUML diagrams to use a wider scrollable frame.", this.plugin, "widenDiagrams");
    addToggle(containerEl, "Widen images", "Allow embedded images to display wider than prose.", this.plugin, "widenImages");
    addToggle(containerEl, "Widen code blocks", "Allow preformatted code blocks to use a wider scrollable frame.", this.plugin, "widenCodeBlocks");
    addToggle(containerEl, "Keep table cells on one line", "Prevents wide tables from wrapping every cell into tall unreadable rows.", this.plugin, "noWrapTableCells");
    addToggle(containerEl, "Reading view support", "Apply selective widening in Reading view.", this.plugin, "readingView");
    addToggle(containerEl, "Live Preview support", "Apply selective widening to rendered embeds in Live Preview.", this.plugin, "livePreview");
  }
}

function addToggle(
  containerEl: HTMLElement,
  name: string,
  desc: string,
  plugin: DynamicWideContentPlugin,
  key: keyof Pick<DynamicWideContentSettings,
    "widenTables" |
    "widenCodeBlocks" |
    "widenDiagrams" |
    "widenImages" |
    "noWrapTableCells" |
    "readingView" |
    "livePreview">
) {
  new Setting(containerEl)
    .setName(name)
    .setDesc(desc)
    .addToggle((toggle) => toggle
      .setValue(plugin.settings[key])
      .onChange(async (value) => {
        plugin.settings[key] = value;
        await plugin.saveSettings();
      }));
}

function buildCss(settings: DynamicWideContentSettings): string {
  const readingBlocks: string[] = [];
  const innerBlocks: string[] = [];
  const livePreviewBlocks: string[] = [];
  const mediaContent: string[] = [];

  if (settings.widenTables) {
    readingBlocks.push(
      ".markdown-rendered .el-table",
      ".markdown-rendered .markdown-preview-sizer > div:has(> table)",
      ".markdown-rendered .markdown-preview-sizer > div:has(> .table-wrapper)"
    );
    innerBlocks.push(".markdown-rendered .table-wrapper");
    livePreviewBlocks.push(
      ".markdown-source-view.mod-cm6 .cm-embed-block:has(table)",
      ".markdown-source-view.mod-cm6 .cm-embed-block:has(.table-wrapper)"
    );
  }

  if (settings.widenCodeBlocks) {
    readingBlocks.push(
      ".markdown-rendered .el-pre",
      ".markdown-rendered .markdown-preview-sizer > div:has(> pre)"
    );
    innerBlocks.push(".markdown-rendered pre");
    livePreviewBlocks.push(".markdown-source-view.mod-cm6 .cm-embed-block:has(pre)");
  }

  if (settings.widenDiagrams) {
    readingBlocks.push(
      ".markdown-rendered .el-lang-mermaid",
      ".markdown-rendered .el-lang-plantuml",
      ".markdown-rendered .el-lang-plantuml-png",
      ".markdown-rendered .el-lang-plantuml-svg",
      ".markdown-rendered .el-lang-puml",
      ".markdown-rendered .el-lang-puml-png",
      ".markdown-rendered .el-lang-puml-svg",
      ".markdown-rendered .markdown-preview-sizer > div:has(> .mermaid)",
      ".markdown-rendered .markdown-preview-sizer > div:has(> .block-language-mermaid)",
      ".markdown-rendered .markdown-preview-sizer > div:has(> .block-language-plantuml)",
      ".markdown-rendered .markdown-preview-sizer > div:has(> .block-language-plantuml-png)",
      ".markdown-rendered .markdown-preview-sizer > div:has(> .block-language-plantuml-svg)",
      ".markdown-rendered .markdown-preview-sizer > div:has(> .block-language-puml)",
      ".markdown-rendered .markdown-preview-sizer > div:has(> .block-language-puml-png)",
      ".markdown-rendered .markdown-preview-sizer > div:has(> .block-language-puml-svg)"
    );
    innerBlocks.push(
      ".markdown-rendered .mermaid",
      ".markdown-rendered .block-language-mermaid",
      ".markdown-rendered .block-language-plantuml",
      ".markdown-rendered .block-language-plantuml-png",
      ".markdown-rendered .block-language-plantuml-svg",
      ".markdown-rendered .block-language-puml",
      ".markdown-rendered .block-language-puml-png",
      ".markdown-rendered .block-language-puml-svg",
      ".markdown-rendered .plantuml-preview-view"
    );
    livePreviewBlocks.push(
      ".markdown-source-view.mod-cm6 .cm-embed-block:has(.mermaid)",
      ".markdown-source-view.mod-cm6 .cm-embed-block:has(.block-language-mermaid)",
      ".markdown-source-view.mod-cm6 .cm-embed-block:has(.block-language-plantuml)",
      ".markdown-source-view.mod-cm6 .cm-embed-block:has(.block-language-puml)"
    );
    mediaContent.push(
      ".markdown-rendered .mermaid svg",
      ".markdown-rendered .block-language-mermaid svg",
      ".markdown-rendered .block-language-plantuml img",
      ".markdown-rendered .block-language-plantuml svg",
      ".markdown-rendered .block-language-plantuml-png img",
      ".markdown-rendered .block-language-plantuml-svg svg",
      ".markdown-rendered .block-language-puml img",
      ".markdown-rendered .block-language-puml svg",
      ".markdown-rendered .block-language-puml-png img",
      ".markdown-rendered .block-language-puml-svg svg",
      ".markdown-rendered .plantuml-preview-view img",
      ".markdown-rendered .plantuml-preview-view svg"
    );
  }

  if (settings.widenImages) {
    readingBlocks.push(
      ".markdown-rendered .el-embed-image",
      ".markdown-rendered .markdown-preview-sizer > div:has(> .internal-embed.image-embed)",
      ".markdown-rendered .markdown-preview-sizer > div:has(> .image-embed)",
      ".markdown-rendered .markdown-preview-sizer > div:has(img)"
    );
    innerBlocks.push(
      ".markdown-rendered .internal-embed.image-embed",
      ".markdown-rendered .image-embed"
    );
    livePreviewBlocks.push(
      ".markdown-source-view.mod-cm6 .cm-embed-block:has(.internal-embed.image-embed)",
      ".markdown-source-view.mod-cm6 .cm-embed-block:has(.image-embed)",
      ".markdown-source-view.mod-cm6 .cm-embed-block:has(img)"
    );
    mediaContent.push(
      ".markdown-rendered .internal-embed.image-embed img",
      ".markdown-rendered .image-embed img"
    );
  }

  const css: string[] = [
    `body {
  --dynamic-wide-content-max: min(${settings.maxWidth}px, calc(100vw - ${settings.viewportMargin}px));
}`
  ];

  if (settings.readingView) {
    css.push(`
.markdown-preview-view.is-readable-line-width .markdown-preview-sizer,
.markdown-reading-view.is-readable-line-width .markdown-preview-sizer,
.markdown-preview-view .markdown-preview-section,
.markdown-reading-view .markdown-preview-section {
  overflow: visible !important;
}`);

    if (readingBlocks.length > 0) {
      css.push(`
${readingBlocks.join(",\n")} {
  position: relative !important;
  left: 50% !important;
  width: max-content !important;
  max-width: var(--dynamic-wide-content-max) !important;
  margin-top: 0.75em !important;
  margin-bottom: 0.75em !important;
  overflow-x: auto !important;
  transform: translateX(-50%) !important;
}`);
    }

    if (innerBlocks.length > 0) {
      css.push(`
${innerBlocks.join(",\n")} {
  max-width: 100% !important;
  overflow-x: auto !important;
}`);
    }
  }

  if (settings.livePreview && livePreviewBlocks.length > 0) {
    css.push(`
.markdown-source-view.mod-cm6.is-readable-line-width .cm-contentContainer {
  overflow: visible !important;
}

${livePreviewBlocks.join(",\n")} {
  position: relative !important;
  left: 50% !important;
  width: max-content !important;
  max-width: var(--dynamic-wide-content-max) !important;
  overflow-x: auto !important;
  transform: translateX(-50%) !important;
}`);
  }

  if (settings.widenTables) {
    css.push(`
.markdown-rendered table {
  display: table !important;
  width: max-content !important;
  min-width: 100% !important;
  max-width: none !important;
}`);
  }

  if (settings.widenTables && settings.noWrapTableCells) {
    css.push(`
.markdown-rendered th,
.markdown-rendered td {
  white-space: nowrap !important;
}`);
  }

  if (settings.widenCodeBlocks) {
    css.push(`
.markdown-rendered pre > code {
  white-space: pre !important;
}`);
  }

  if (mediaContent.length > 0) {
    css.push(`
${mediaContent.join(",\n")} {
  width: auto !important;
  max-width: none !important;
  height: auto !important;
}`);
  }

  return css.join("\n");
}

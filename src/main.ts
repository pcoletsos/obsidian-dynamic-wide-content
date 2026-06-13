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

type ToggleSetting =
  | "widenTables"
  | "widenCodeBlocks"
  | "widenDiagrams"
  | "widenImages"
  | "noWrapTableCells"
  | "readingView"
  | "livePreview";

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

const BODY_CLASSES = [
  "dynamic-wide-content",
  "dynamic-wide-content-reading",
  "dynamic-wide-content-live-preview",
  "dynamic-wide-content-tables",
  "dynamic-wide-content-code",
  "dynamic-wide-content-diagrams",
  "dynamic-wide-content-images",
  "dynamic-wide-content-nowrap-tables"
];

export default class DynamicWideContentPlugin extends Plugin {
  settings: DynamicWideContentSettings = { ...DEFAULT_SETTINGS };

  async onload() {
    await this.loadSettings();
    this.applySettings();

    this.registerEvent(
      this.app.workspace.on("layout-change", () => this.applySettings())
    );
    this.register(() => this.clearSettings());

    this.addSettingTab(new DynamicWideContentSettingTab(this.app, this));
    this.addCommand({
      id: "refresh-styles",
      name: "Refresh wide content styles",
      callback: () => this.applySettings()
    });
  }

  async loadSettings() {
    const saved: unknown = await this.loadData();
    this.settings = normalizeSettings(saved);
  }

  async saveSettings() {
    await this.saveData(this.settings);
    this.applySettings();
  }

  applySettings() {
    const { body } = activeDocument;

    body.style.setProperty("--dynamic-wide-content-max-width", `${this.settings.maxWidth}px`);
    body.style.setProperty("--dynamic-wide-content-viewport-margin", `${this.settings.viewportMargin}px`);

    body.classList.add("dynamic-wide-content");
    body.classList.toggle("dynamic-wide-content-reading", this.settings.readingView);
    body.classList.toggle("dynamic-wide-content-live-preview", this.settings.livePreview);
    body.classList.toggle("dynamic-wide-content-tables", this.settings.widenTables);
    body.classList.toggle("dynamic-wide-content-code", this.settings.widenCodeBlocks);
    body.classList.toggle("dynamic-wide-content-diagrams", this.settings.widenDiagrams);
    body.classList.toggle("dynamic-wide-content-images", this.settings.widenImages);
    body.classList.toggle("dynamic-wide-content-nowrap-tables", this.settings.noWrapTableCells);
  }

  clearSettings() {
    const { body } = activeDocument;
    body.classList.remove(...BODY_CLASSES);
    body.style.removeProperty("--dynamic-wide-content-max-width");
    body.style.removeProperty("--dynamic-wide-content-viewport-margin");
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

    new Setting(containerEl).setName("Display").setHeading();
    containerEl.createEl("p", {
      text: "Use wide tables, diagrams, images, and code blocks without widening normal prose."
    });

    new Setting(containerEl)
      .setName("Maximum wide content width")
      .setDesc("Controls how far wide blocks may expand while prose keeps readable width.")
      .addSlider((slider) => slider
        .setLimits(900, 2400, 50)
        .setValue(this.plugin.settings.maxWidth)
        .onChange(async (value) => {
          this.plugin.settings.maxWidth = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName("Viewport side margin")
      .setDesc("Keeps widened blocks away from the edge of the pane.")
      .addSlider((slider) => slider
        .setLimits(0, 160, 8)
        .setValue(this.plugin.settings.viewportMargin)
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
  key: ToggleSetting
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

function normalizeSettings(saved: unknown): DynamicWideContentSettings {
  const value = isRecord(saved) ? saved : {};

  return {
    maxWidth: numberSetting(value.maxWidth, DEFAULT_SETTINGS.maxWidth),
    viewportMargin: numberSetting(value.viewportMargin, DEFAULT_SETTINGS.viewportMargin),
    widenTables: booleanSetting(value.widenTables, DEFAULT_SETTINGS.widenTables),
    widenCodeBlocks: booleanSetting(value.widenCodeBlocks, DEFAULT_SETTINGS.widenCodeBlocks),
    widenDiagrams: booleanSetting(value.widenDiagrams, DEFAULT_SETTINGS.widenDiagrams),
    widenImages: booleanSetting(value.widenImages, DEFAULT_SETTINGS.widenImages),
    noWrapTableCells: booleanSetting(value.noWrapTableCells, DEFAULT_SETTINGS.noWrapTableCells),
    readingView: booleanSetting(value.readingView, DEFAULT_SETTINGS.readingView),
    livePreview: booleanSetting(value.livePreview, DEFAULT_SETTINGS.livePreview)
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function numberSetting(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function booleanSetting(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

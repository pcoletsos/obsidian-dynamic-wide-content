import {
  App,
  MarkdownView,
  Plugin,
  PluginSettingTab,
  Setting,
  SettingDefinitionItem
} from "obsidian";

interface DynamicWideContentSettings {
  maxWidth: number;
  viewportMargin: number;
  widenTables: boolean;
  widenCodeBlocks: boolean;
  widenDiagrams: boolean;
  widenImages: boolean;
  widenTaskNotes: boolean;
  noWrapTableCells: boolean;
  readingView: boolean;
  livePreview: boolean;
}

type ToggleSetting =
  | "widenTables"
  | "widenCodeBlocks"
  | "widenDiagrams"
  | "widenImages"
  | "widenTaskNotes"
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
  widenTaskNotes: true,
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
  "dynamic-wide-content-tasknotes",
  "dynamic-wide-content-nowrap-tables"
];

const OVERFLOW_CLASS = "dynamic-wide-content-overflow-visible";
const WIDE_BLOCK_CLASS = "dynamic-wide-content-wide-block";
const WIDE_INNER_CLASS = "dynamic-wide-content-wide-inner";
const TABLE_BLOCK_CLASS = "dynamic-wide-content-table-block";
const TABLE_INNER_CLASS = "dynamic-wide-content-table-inner";
const TABLE_ELEMENT_CLASS = "dynamic-wide-content-table";
const CODE_BLOCK_CLASS = "dynamic-wide-content-code-block";
const CODE_INNER_CLASS = "dynamic-wide-content-code-inner";
const DIAGRAM_BLOCK_CLASS = "dynamic-wide-content-diagram-block";
const DIAGRAM_INNER_CLASS = "dynamic-wide-content-diagram-inner";
const IMAGE_BLOCK_CLASS = "dynamic-wide-content-image-block";
const IMAGE_INNER_CLASS = "dynamic-wide-content-image-inner";
const TASKNOTES_BLOCK_CLASS = "dynamic-wide-content-tasknotes-block";
const TASKNOTES_INNER_CLASS = "dynamic-wide-content-tasknotes-inner";
const MEDIA_CLASS = "dynamic-wide-content-media";

const MARKER_CLASSES = [
  OVERFLOW_CLASS,
  WIDE_BLOCK_CLASS,
  WIDE_INNER_CLASS,
  TABLE_BLOCK_CLASS,
  TABLE_INNER_CLASS,
  TABLE_ELEMENT_CLASS,
  CODE_BLOCK_CLASS,
  CODE_INNER_CLASS,
  DIAGRAM_BLOCK_CLASS,
  DIAGRAM_INNER_CLASS,
  IMAGE_BLOCK_CLASS,
  IMAGE_INNER_CLASS,
  TASKNOTES_BLOCK_CLASS,
  TASKNOTES_INNER_CLASS,
  MEDIA_CLASS
];

const OVERFLOW_CONTAINER_CLASSES = [
  "markdown-preview-sizer",
  "markdown-preview-section",
  "cm-contentContainer",
  "cm-content",
  "cm-sizer"
];

const TABLE_CONTAINER_CLASSES = ["el-table", "table-wrapper", "cm-table-widget"];
const CODE_CONTAINER_CLASSES = ["el-pre"];
const IMAGE_CONTAINER_CLASSES = ["el-embed-image", "internal-embed", "image-embed"];
const TASKNOTES_CONTAINER_CLASSES = [
  "tasknotes-relationships-widget",
  "task-card-note-widget",
  "tasknotes-task-card-note-widget"
];
const DIAGRAM_CONTAINER_CLASSES = [
  "el-lang-mermaid",
  "el-lang-plantuml",
  "el-lang-plantuml-png",
  "el-lang-plantuml-svg",
  "el-lang-puml",
  "el-lang-puml-png",
  "el-lang-puml-svg",
  "block-language-mermaid",
  "block-language-plantuml",
  "block-language-plantuml-png",
  "block-language-plantuml-svg",
  "block-language-puml",
  "block-language-puml-png",
  "block-language-puml-svg",
  "plantuml-preview-view"
];

const DIAGRAM_CONTENT_CLASSES = [
  "mermaid",
  "block-language-mermaid",
  "block-language-plantuml",
  "block-language-plantuml-png",
  "block-language-plantuml-svg",
  "block-language-puml",
  "block-language-puml-png",
  "block-language-puml-svg",
  "plantuml-preview-view",
  "plantuml-image",
  "plantuml-svg"
];

const MARKER_SELECTOR = MARKER_CLASSES.map((className) => `.${className}`).join(", ");
const DIAGRAM_CONTAINER_SELECTOR = DIAGRAM_CONTAINER_CLASSES.map((className) => `.${className}`).join(", ");
const DIAGRAM_CONTENT_SELECTOR = [
  ...DIAGRAM_CONTENT_CLASSES.map((className) => `.${className}`),
  "[data-type='plantuml']",
  "[data-type='puml']",
  "[data-type='mermaid']",
  "div[class*='plantuml']",
  "div[class*='puml']"
].join(", ");
const IMAGE_CONTAINER_SELECTOR = ".el-embed-image, .internal-embed.image-embed, .image-embed";
const TASKNOTES_SELECTOR = [
  ".tasknotes-relationships-widget",
  ".task-card-note-widget",
  ".tasknotes-task-card-note-widget",
  "[data-widget-type='relationships']"
].join(", ");

export default class DynamicWideContentPlugin extends Plugin {
  settings: DynamicWideContentSettings = { ...DEFAULT_SETTINGS };
  private observer: MutationObserver | null = null;

  async onload() {
    await this.loadSettings();
    this.applySettings();

    this.registerMarkdownPostProcessor((el) => {
      markWideContent(el);
    });

    this.registerEvent(
      this.app.workspace.on("layout-change", () => {
        this.applySettings();
        this.refreshVisibleContent();
      })
    );
    this.registerEvent(
      this.app.workspace.on("active-leaf-change", () => {
        this.applySettings();
        this.refreshVisibleContent();
      })
    );

    this.startObserver();
    this.register(() => {
      this.stopObserver();
      this.clearSettings();
    });

    this.addSettingTab(new DynamicWideContentSettingTab(this.app, this));
    this.addCommand({
      id: "refresh-styles",
      name: "Refresh wide content styles",
      callback: () => {
        this.applySettings();
        this.refreshVisibleContent();
      }
    });
  }

  async loadSettings() {
    const saved: unknown = await this.loadData();
    this.settings = normalizeSettings(saved);
  }

  override async saveData(data: unknown) {
    await super.saveData(data);
    this.settings = normalizeSettings(data);
    this.applySettings();
    this.refreshVisibleContent();
  }

  async saveSettings() {
    await this.saveData(this.settings);
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
    body.classList.toggle("dynamic-wide-content-tasknotes", this.settings.widenTaskNotes);
    body.classList.toggle("dynamic-wide-content-nowrap-tables", this.settings.noWrapTableCells);
  }

  clearSettings() {
    const { body } = activeDocument;
    body.classList.remove(...BODY_CLASSES);
    body.style.removeProperty("--dynamic-wide-content-max-width");
    body.style.removeProperty("--dynamic-wide-content-viewport-margin");
    clearWideContentMarkers(body);
  }

  private refreshVisibleContent() {
    for (const leaf of this.app.workspace.getLeavesOfType("markdown")) {
      if (leaf.view instanceof MarkdownView) {
        markWideContent(leaf.view.containerEl);
      }
    }

    markWideContent(activeDocument.body);
  }

  private startObserver() {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of Array.from(mutation.addedNodes)) {
          if (isHTMLElement(node)) {
            markWideContent(node);
          }
        }
      }
    });

    observer.observe(activeDocument.body, {
      childList: true,
      subtree: true
    });
    this.observer = observer;
  }

  private stopObserver() {
    this.observer?.disconnect();
    this.observer = null;
  }
}

class DynamicWideContentSettingTab extends PluginSettingTab {
  plugin: DynamicWideContentPlugin;

  constructor(app: App, plugin: DynamicWideContentPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  getSettingDefinitions(): SettingDefinitionItem[] {
    return [
      {
        type: "group",
        heading: "Display",
        items: [
          {
            name: "Maximum wide content width",
            desc: "Controls how far wide blocks may expand while normal note text stays readable.",
            control: {
              type: "slider",
              key: "maxWidth",
              min: 900,
              max: 2400,
              step: 50
            }
          },
          {
            name: "Viewport side margin",
            desc: "Keeps widened blocks away from the edge of the pane.",
            control: {
              type: "slider",
              key: "viewportMargin",
              min: 0,
              max: 160,
              step: 8
            }
          },
          {
            name: "Widen tables",
            desc: "Allow Markdown tables to break out of the normal reading column.",
            control: {
              type: "toggle",
              key: "widenTables"
            }
          },
          {
            name: "Widen diagrams",
            desc: "Allow Mermaid and PlantUML diagrams to use a wider scrollable frame.",
            control: {
              type: "toggle",
              key: "widenDiagrams"
            }
          },
          {
            name: "Widen images",
            desc: "Allow embedded images to display wider than normal note text.",
            control: {
              type: "toggle",
              key: "widenImages"
            }
          },
          {
            name: "Widen code blocks",
            desc: "Allow preformatted code blocks to use a wider scrollable frame.",
            control: {
              type: "toggle",
              key: "widenCodeBlocks"
            }
          },
          {
            name: "Widen TaskNotes widgets",
            desc: "Allow TaskNotes relationship boards and widgets to break out of the normal reading column.",
            control: {
              type: "toggle",
              key: "widenTaskNotes"
            }
          },
          {
            name: "Keep table cells on one line",
            desc: "Prevents wide tables from wrapping every cell into tall unreadable rows.",
            control: {
              type: "toggle",
              key: "noWrapTableCells"
            }
          },
          {
            name: "Reading view support",
            desc: "Apply selective widening in Reading view.",
            control: {
              type: "toggle",
              key: "readingView"
            }
          },
          {
            name: "Live Preview support",
            desc: "Apply selective widening to rendered embeds in Live Preview.",
            control: {
              type: "toggle",
              key: "livePreview"
            }
          }
        ]
      }
    ];
  }

  override getControlValue(key: string): unknown {
    return (this.plugin.settings as unknown as Record<string, unknown>)[key];
  }

  override async setControlValue(key: string, value: unknown): Promise<void> {
    (this.plugin.settings as unknown as Record<string, unknown>)[key] = value;
    await this.plugin.saveSettings();
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl).setName("Display").setHeading();
    containerEl.createEl("p", {
      text: "Use wide tables, diagrams, images, and code blocks without widening normal note text."
    });

    new Setting(containerEl)
      .setName("Maximum wide content width")
      .setDesc("Controls how far wide blocks may expand while normal note text stays readable.")
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

    addToggle(containerEl, "Widen tables", "Allow Markdown tables to break out of the normal reading column.", this.plugin, "widenTables");
    addToggle(containerEl, "Widen diagrams", "Allow Mermaid and PlantUML diagrams to use a wider scrollable frame.", this.plugin, "widenDiagrams");
    addToggle(containerEl, "Widen images", "Allow embedded images to display wider than normal note text.", this.plugin, "widenImages");
    addToggle(containerEl, "Widen code blocks", "Allow preformatted code blocks to use a wider scrollable frame.", this.plugin, "widenCodeBlocks");
    addToggle(containerEl, "Widen TaskNotes widgets", "Allow TaskNotes relationship boards and widgets to break out of the normal reading column.", this.plugin, "widenTaskNotes");
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
    widenTaskNotes: booleanSetting(value.widenTaskNotes, DEFAULT_SETTINGS.widenTaskNotes),
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

function markWideContent(root: HTMLElement) {
  markOverflowContainers(root);
  markTables(root);
  markCodeBlocks(root);
  markDiagrams(root);
  markImages(root);
  markTaskNotes(root);
}

function clearWideContentMarkers(root: HTMLElement) {
  forEachMatch(root, MARKER_SELECTOR, (element) => {
    element.classList.remove(...MARKER_CLASSES);
    if (element.tagName.toLowerCase() === "svg") {
      element.style.removeProperty("width");
    }
  });
}

function markOverflowContainers(root: HTMLElement) {
  forEachClassMatch(root, OVERFLOW_CONTAINER_CLASSES, (element) => {
    element.classList.add(OVERFLOW_CLASS);
  });
}

function markTables(root: HTMLElement) {
  forEachMatch(root, "table", (table) => {
    if (!isMarkdownContent(table)) return;

    table.classList.add(TABLE_ELEMENT_CLASS);
    const block = getWideBlock(table, TABLE_CONTAINER_CLASSES);
    markWideBlock(block, TABLE_BLOCK_CLASS);
  });
}

function markCodeBlocks(root: HTMLElement) {
  forEachMatch(root, "pre", (pre) => {
    if (!isMarkdownContent(pre)) return;

    const block = getWideBlock(pre, CODE_CONTAINER_CLASSES);
    markWideBlock(block, CODE_BLOCK_CLASS);
    markWideInner(pre, CODE_INNER_CLASS);
  });
}

function markDiagrams(root: HTMLElement) {
  forEachMatch(root, DIAGRAM_CONTAINER_SELECTOR, (element) => {
    if (!isMarkdownContent(element)) return;

    const block = getWideBlock(element, DIAGRAM_CONTAINER_CLASSES);
    markWideBlock(block, DIAGRAM_BLOCK_CLASS);
    markMediaChildren(element);
  });

  forEachMatch(root, DIAGRAM_CONTENT_SELECTOR, (element) => {
    if (!isMarkdownContent(element)) return;

    const block = getWideBlock(element, DIAGRAM_CONTAINER_CLASSES);
    markWideBlock(block, DIAGRAM_BLOCK_CLASS);
    markWideInner(element, DIAGRAM_INNER_CLASS);
    markMediaChildren(element);
  });
}

function markImages(root: HTMLElement) {
  forEachMatch(root, IMAGE_CONTAINER_SELECTOR, (element) => {
    if (!isMarkdownContent(element)) return;

    const block = getWideBlock(element, IMAGE_CONTAINER_CLASSES);
    markWideBlock(block, IMAGE_BLOCK_CLASS);
    markWideInner(element, IMAGE_INNER_CLASS);
    markMediaChildren(element);
  });

  forEachMatch(root, "img", (image) => {
    if (!isMarkdownContent(image) || isDiagramContent(image)) return;

    const block = getWideBlock(image, IMAGE_CONTAINER_CLASSES);
    markWideBlock(block, IMAGE_BLOCK_CLASS);
    markMedia(image);
  });
}

function markTaskNotes(root: HTMLElement) {
  forEachMatch(root, TASKNOTES_SELECTOR, (element) => {
    if (!isMarkdownContent(element)) return;

    const block = getWideBlock(element, TASKNOTES_CONTAINER_CLASSES);
    markWideBlock(block, TASKNOTES_BLOCK_CLASS);
    markWideInner(element, TASKNOTES_INNER_CLASS);
  });
}

function markWideBlock(element: HTMLElement, blockClass: string) {
  element.classList.add(WIDE_BLOCK_CLASS, blockClass);
  markOverflowAncestors(element);
}

function markWideInner(element: HTMLElement, innerClass: string) {
  element.classList.add(WIDE_INNER_CLASS, innerClass);
}

function markMediaChildren(element: HTMLElement) {
  forEachMatch(element, "img, svg", (media) => {
    markMedia(media);
  });
}

function markMedia(element: HTMLElement) {
  element.classList.add(MEDIA_CLASS);

  if (element.tagName.toLowerCase() === "img") {
    const img = element as HTMLImageElement;
    if (img.style.maxWidth === "100%") {
      img.style.removeProperty("max-width");
    }
  }

  if (element.tagName.toLowerCase() === "svg") {
    const svg = element as unknown as SVGSVGElement;
    let naturalWidth = 0;

    if (svg.viewBox && svg.viewBox.baseVal && svg.viewBox.baseVal.width > 0) {
      naturalWidth = svg.viewBox.baseVal.width;
    } else {
      const viewBoxAttr = svg.getAttribute("viewBox");
      if (viewBoxAttr) {
        const parts = viewBoxAttr.trim().split(/[\s,]+/);
        if (parts.length === 4) {
          const w = parseFloat(parts[2]);
          if (!isNaN(w) && w > 0) {
            naturalWidth = w;
          }
        }
      }
    }

    if (naturalWidth === 0) {
      const widthAttr = svg.getAttribute("width");
      if (widthAttr && !widthAttr.includes("%")) {
        const w = parseFloat(widthAttr);
        if (!isNaN(w) && w > 0) {
          naturalWidth = w;
        }
      }
    }

    if (naturalWidth > 0) {
      svg.style.width = `${Math.ceil(naturalWidth)}px`;
    }
  }
}

function markOverflowAncestors(element: HTMLElement) {
  let current = element.parentElement;
  while (current) {
    if (containsClass(current, OVERFLOW_CONTAINER_CLASSES)) {
      current.classList.add(OVERFLOW_CLASS);
    }

    current = current.parentElement;
  }
}

function getWideBlock(element: HTMLElement, containerClasses: readonly string[]): HTMLElement {
  let current: HTMLElement | null = element;
  let outermost: HTMLElement | null = null;
  const allTargetClasses = [...containerClasses, "cm-embed-block"];

  while (current && isHTMLElement(current)) {
    if (containsClass(current, allTargetClasses)) {
      outermost = current;
    }
    if (
      containsClass(current, [
        "markdown-rendered",
        "markdown-source-view",
        "cm-content",
        "markdown-preview-sizer",
        "cm-sizer"
      ])
    ) {
      break;
    }
    current = current.parentElement;
  }

  return outermost ?? element;
}

function isMarkdownContent(element: HTMLElement): boolean {
  return closestByClass(element, [
    "markdown-rendered",
    "markdown-source-view",
    "markdown-preview-section",
    "markdown-preview-sizer",
    "cm-embed-block",
    "cm-content",
    "cm-sizer"
  ]) !== null;
}

function isDiagramContent(element: HTMLElement): boolean {
  return closestByClass(element, [...DIAGRAM_CONTAINER_CLASSES, ...DIAGRAM_CONTENT_CLASSES]) !== null;
}

function forEachClassMatch(
  root: HTMLElement,
  classNames: readonly string[],
  callback: (element: HTMLElement) => void
) {
  forEachMatch(root, classNames.map((className) => `.${className}`).join(", "), callback);
}

function forEachMatch(
  root: HTMLElement,
  selector: string,
  callback: (element: HTMLElement) => void
) {
  if (root.matches(selector)) {
    callback(root);
  }

  root.querySelectorAll<HTMLElement>(selector).forEach((element) => {
    callback(element);
  });
}

function closestByClass(element: HTMLElement, classNames: readonly string[]): HTMLElement | null {
  let current: HTMLElement | null = element;

  while (current) {
    if (containsClass(current, classNames)) {
      return current;
    }

    current = current.parentElement;
  }

  return null;
}

function containsClass(element: HTMLElement, classNames: readonly string[]): boolean {
  return classNames.some((className) => element.classList.contains(className));
}

function isHTMLElement(node: Node): node is HTMLElement {
  return node.nodeType === Node.ELEMENT_NODE && "classList" in node;
}

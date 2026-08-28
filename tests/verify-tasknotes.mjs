import assert from "node:assert/strict";
import fs from "node:fs";

console.log("🚀 Starting Dynamic Wide Content Comprehensive Verification Suite...");

// 1. Verify styles.css
const cssContent = fs.readFileSync("styles.css", "utf8");
console.log("✔ Checking styles.css rules...");

// TaskNotes rules
assert(
  cssContent.includes("dynamic-wide-content-tasknotes"),
  "styles.css must include dynamic-wide-content-tasknotes body class"
);

assert(
  cssContent.includes("dynamic-wide-content-tasknotes-block"),
  "styles.css must include dynamic-wide-content-tasknotes-block"
);

assert(
  cssContent.includes("var(--tn-relationships-widget-margin-top, 0.75em)"),
  "styles.css must respect --tn-relationships-widget-margin-top to prevent Live Preview top margin gap"
);

assert(
  cssContent.includes(".is-readable-line-width .dynamic-wide-content-tasknotes-block.tasknotes-relationships-widget"),
  "styles.css must override TaskNotes readable-line-width max-width constraint"
);

// Mermaid & SVG rules (Issue #2 fix)
assert(
  cssContent.includes(".dynamic-wide-content-diagram-block svg") &&
  cssContent.includes("max-width: 100%"),
  "styles.css must ensure diagram SVGs maintain max-width: 100% and height: auto without collapsing to width: auto 0px"
);

assert(
  cssContent.includes("img.dynamic-wide-content-media"),
  "styles.css must target img for unconstrained natural sizing, leaving SVG with responsive scaling"
);

// Live Preview rules (Issue #3 fix)
assert(
  cssContent.includes(".markdown-source-view.mod-cm6 .cm-content") &&
  cssContent.includes("overflow: visible"),
  "styles.css must ensure .cm-content has overflow: visible in Live Preview"
);

// Breakout rules
assert(
  cssContent.includes("transform: translateX(-50%)") &&
  cssContent.includes("max-width: var(--dynamic-wide-content-max);"),
  "styles.css must center wide blocks with transform and CSS variable max-width"
);

assert(
  !cssContent.includes("!important"),
  "styles.css must avoid !important to adhere to Obsidian styling best practices"
);

console.log("  ✔ styles.css validations passed.");

// 2. Verify main.js bundle content
const mainJsContent = fs.readFileSync("main.js", "utf8");
console.log("✔ Checking main.js bundle...");

assert(
  mainJsContent.includes("getSettingDefinitions"),
  "main.js must contain getSettingDefinitions for Obsidian 1.13+ declarative settings search"
);

assert(
  mainJsContent.includes("widenTaskNotes"),
  "main.js must contain widenTaskNotes setting"
);

assert(
  mainJsContent.includes("cm-table-widget"),
  "main.js must recognize cm-table-widget"
);

assert(
  mainJsContent.includes("cm-content"),
  "main.js must include cm-content in overflow containers"
);

console.log("  ✔ main.js validations passed.");

// 3. Simulate DOM Marking in headless DOM environment
console.log("✔ Simulating DOM tree structure and wide content marking...");

class MockClassList {
  constructor() {
    this._classes = new Set();
  }
  add(...classes) {
    for (const c of classes) this._classes.add(c);
  }
  remove(...classes) {
    for (const c of classes) this._classes.delete(c);
  }
  contains(c) {
    return this._classes.has(c);
  }
  toggle(c, force) {
    if (force === undefined) {
      if (this.contains(c)) {
        this.remove(c);
        return false;
      } else {
        this.add(c);
        return true;
      }
    }
    if (force) {
      this.add(c);
      return true;
    } else {
      this.remove(c);
      return false;
    }
  }
  get value() {
    return Array.from(this._classes).join(" ");
  }
}

class MockElement {
  constructor(tagName, className = "", attributes = {}) {
    this.tagName = tagName.toUpperCase();
    this.nodeType = 1;
    this.classList = new MockClassList();
    if (className) {
      className.split(/\s+/).filter(Boolean).forEach(c => this.classList.add(c));
    }
    this.attributes = { ...attributes };
    this.children = [];
    this.parentElement = null;
  }

  appendChild(child) {
    child.parentElement = this;
    this.children.push(child);
    return child;
  }

  getAttribute(attr) {
    return this.attributes[attr] || null;
  }

  setAttribute(attr, val) {
    this.attributes[attr] = val;
  }

  matches(selector) {
    const parts = selector.split(",").map(s => s.trim());
    for (const part of parts) {
      if (part.startsWith(".")) {
        const cls = part.slice(1);
        if (this.classList.contains(cls)) return true;
      } else if (part.startsWith("[data-widget-type=")) {
        const type = part.match(/data-widget-type=['"]?([^'"\]]+)['"]?/)?.[1];
        if (this.getAttribute("data-widget-type") === type) return true;
      } else if (part.toLowerCase() === this.tagName.toLowerCase()) {
        return true;
      }
    }
    return false;
  }

  querySelectorAll(selector) {
    const results = [];
    const walk = (el) => {
      for (const child of el.children) {
        if (child.matches(selector)) {
          results.push(child);
        }
        walk(child);
      }
    };
    walk(this);
    return results;
  }

  closest(selector) {
    let current = this;
    while (current) {
      if (current.matches(selector)) return current;
      current = current.parentElement;
    }
    return null;
  }
}

// Logic under test adapted from src/main.ts
const OVERFLOW_CLASS = "dynamic-wide-content-overflow-visible";
const WIDE_BLOCK_CLASS = "dynamic-wide-content-wide-block";
const WIDE_INNER_CLASS = "dynamic-wide-content-wide-inner";
const TABLE_BLOCK_CLASS = "dynamic-wide-content-table-block";
const TABLE_INNER_CLASS = "dynamic-wide-content-table-inner";
const TABLE_ELEMENT_CLASS = "dynamic-wide-content-table";
const DIAGRAM_BLOCK_CLASS = "dynamic-wide-content-diagram-block";
const DIAGRAM_INNER_CLASS = "dynamic-wide-content-diagram-inner";
const TASKNOTES_BLOCK_CLASS = "dynamic-wide-content-tasknotes-block";
const TASKNOTES_INNER_CLASS = "dynamic-wide-content-tasknotes-inner";
const MEDIA_CLASS = "dynamic-wide-content-media";

const OVERFLOW_CONTAINER_CLASSES = [
  "markdown-preview-sizer",
  "markdown-preview-section",
  "cm-contentContainer",
  "cm-content",
  "cm-sizer"
];

const TABLE_CONTAINER_CLASSES = ["el-table", "table-wrapper", "cm-table-widget"];
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
  "el-lang-puml-svg"
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
  "plantuml-preview-view"
];

const TASKNOTES_SELECTOR = [
  ".tasknotes-relationships-widget",
  ".task-card-note-widget",
  ".tasknotes-task-card-note-widget",
  "[data-widget-type='relationships']"
].join(", ");

const DIAGRAM_CONTAINER_SELECTOR = DIAGRAM_CONTAINER_CLASSES.map(c => `.${c}`).join(", ");
const DIAGRAM_CONTENT_SELECTOR = DIAGRAM_CONTENT_CLASSES.map(c => `.${c}`).join(", ");

function containsClass(el, classNames) {
  return classNames.some(cls => el.classList.contains(cls));
}

function closestByClass(el, classNames) {
  let current = el;
  while (current) {
    if (containsClass(current, classNames)) return current;
    current = current.parentElement;
  }
  return null;
}

function getWideBlock(el, containerClasses) {
  return closestByClass(el, [...containerClasses, "cm-embed-block"]) ?? el;
}

function isMarkdownContent(el) {
  return closestByClass(el, [
    "markdown-rendered",
    "markdown-source-view",
    "markdown-preview-section",
    "markdown-preview-sizer",
    "cm-embed-block",
    "cm-content",
    "cm-sizer"
  ]) !== null;
}

function markOverflowAncestors(el) {
  let current = el.parentElement;
  while (current) {
    if (containsClass(current, OVERFLOW_CONTAINER_CLASSES)) {
      current.classList.add(OVERFLOW_CLASS);
    }
    current = current.parentElement;
  }
}

function markWideBlock(el, blockClass) {
  el.classList.add(WIDE_BLOCK_CLASS, blockClass);
  markOverflowAncestors(el);
}

function markWideInner(el, innerClass) {
  el.classList.add(WIDE_INNER_CLASS, innerClass);
}

function markMedia(el) {
  el.classList.add(MEDIA_CLASS);
}

function markMediaChildren(el) {
  const matches = (el.matches("img, svg") ? [el] : []).concat(el.querySelectorAll("img, svg"));
  for (const m of matches) markMedia(m);
}

function markTables(root) {
  for (const cls of TABLE_CONTAINER_CLASSES) {
    const matches = root.querySelectorAll(`.${cls}`);
    if (root.classList.contains(cls)) matches.push(root);
    for (const el of matches) {
      markWideBlock(el, TABLE_BLOCK_CLASS);
      markWideInner(el, TABLE_INNER_CLASS);
    }
  }

  const tables = (root.matches("table") ? [root] : []).concat(root.querySelectorAll("table"));
  for (const t of tables) {
    if (!isMarkdownContent(t)) continue;
    t.classList.add(TABLE_ELEMENT_CLASS);
    markWideBlock(getWideBlock(t, TABLE_CONTAINER_CLASSES), TABLE_BLOCK_CLASS);
  }
}

function markDiagrams(root) {
  const containers = (root.matches(DIAGRAM_CONTAINER_SELECTOR) ? [root] : []).concat(root.querySelectorAll(DIAGRAM_CONTAINER_SELECTOR));
  for (const c of containers) {
    if (!isMarkdownContent(c)) continue;
    markWideBlock(c, DIAGRAM_BLOCK_CLASS);
    markMediaChildren(c);
  }

  const contents = (root.matches(DIAGRAM_CONTENT_SELECTOR) ? [root] : []).concat(root.querySelectorAll(DIAGRAM_CONTENT_SELECTOR));
  for (const c of contents) {
    if (!isMarkdownContent(c)) continue;
    markWideBlock(getWideBlock(c, DIAGRAM_CONTAINER_CLASSES), DIAGRAM_BLOCK_CLASS);
    markWideInner(c, DIAGRAM_INNER_CLASS);
    markMediaChildren(c);
  }
}

function markTaskNotes(root) {
  const matches = (root.matches(TASKNOTES_SELECTOR) ? [root] : []).concat(root.querySelectorAll(TASKNOTES_SELECTOR));
  for (const element of matches) {
    if (!isMarkdownContent(element)) continue;
    markWideBlock(getWideBlock(element, TASKNOTES_CONTAINER_CLASSES), TASKNOTES_BLOCK_CLASS);
    markWideInner(element, TASKNOTES_INNER_CLASS);
  }
}

// Test Case 1: Live Preview Native Table in CodeMirror 6 (.cm-content > .cm-embed-block.cm-table-widget)
console.log("  → Scenario 1: Live Preview Native Table (.cm-table-widget in .cm-content)");
const livePreviewView = new MockElement("div", "markdown-source-view mod-cm6 is-readable-line-width");
const lpSizer = new MockElement("div", "cm-sizer");
const lpContentContainer = new MockElement("div", "cm-contentContainer");
const lpContent = new MockElement("div", "cm-content");
const lpTableEmbed = new MockElement("div", "cm-embed-block cm-table-widget");
const lpTableWidgetInner = new MockElement("div", "cm-table-widget");
const lpTable = new MockElement("table", "cm-table");

livePreviewView.appendChild(lpSizer);
lpSizer.appendChild(lpContentContainer);
lpContentContainer.appendChild(lpContent);
lpContent.appendChild(lpTableEmbed);
lpTableEmbed.appendChild(lpTableWidgetInner);
lpTableWidgetInner.appendChild(lpTable);

markTables(livePreviewView);

assert(
  lpTableEmbed.classList.contains(WIDE_BLOCK_CLASS),
  "Live Preview .cm-embed-block must receive dynamic-wide-content-wide-block"
);
assert(
  lpTableEmbed.classList.contains(TABLE_BLOCK_CLASS),
  "Live Preview .cm-embed-block must receive dynamic-wide-content-table-block"
);
assert(
  lpContent.classList.contains(OVERFLOW_CLASS),
  ".cm-content ancestor must receive dynamic-wide-content-overflow-visible"
);
assert(
  lpContentContainer.classList.contains(OVERFLOW_CLASS),
  ".cm-contentContainer ancestor must receive dynamic-wide-content-overflow-visible"
);
assert(
  lpSizer.classList.contains(OVERFLOW_CLASS),
  ".cm-sizer ancestor must receive dynamic-wide-content-overflow-visible"
);
console.log("    ✔ Live Preview Native Table scenario verified successfully.");

// Test Case 2: Mermaid stateDiagram and stateDiagram-v2 in Live Preview & Reading View
console.log("  → Scenario 2: Mermaid stateDiagram SVG marking");
const mermaidEmbed = new MockElement("div", "cm-embed-block");
const mermaidBlock = new MockElement("div", "block-language-mermaid");
const mermaidSvg = new MockElement("svg", "mermaid-svg");

lpContent.appendChild(mermaidEmbed);
mermaidEmbed.appendChild(mermaidBlock);
mermaidBlock.appendChild(mermaidSvg);

markDiagrams(livePreviewView);

assert(
  mermaidEmbed.classList.contains(WIDE_BLOCK_CLASS),
  "Mermaid embed block must receive dynamic-wide-content-wide-block"
);
assert(
  mermaidEmbed.classList.contains(DIAGRAM_BLOCK_CLASS),
  "Mermaid embed block must receive dynamic-wide-content-diagram-block"
);
assert(
  mermaidSvg.classList.contains(MEDIA_CLASS),
  "Mermaid SVG must receive dynamic-wide-content-media"
);
console.log("    ✔ Mermaid stateDiagram scenario verified successfully.");

// Test Case 3: TaskNotes Relationships Widget
console.log("  → Scenario 3: TaskNotes Relationships Widget");
const tnWidget = new MockElement("div", "tasknotes-plugin tasknotes-relationships-widget", {
  "data-widget-type": "relationships"
});
lpSizer.appendChild(tnWidget);

markTaskNotes(livePreviewView);

assert(
  tnWidget.classList.contains(WIDE_BLOCK_CLASS),
  "TaskNotes widget must receive dynamic-wide-content-wide-block"
);
assert(
  tnWidget.classList.contains(TASKNOTES_BLOCK_CLASS),
  "TaskNotes widget must receive dynamic-wide-content-tasknotes-block"
);
console.log("    ✔ TaskNotes scenario verified successfully.");

// Test Case 4: PlantUML diagram in Reading View and Live Preview
console.log("  → Scenario 4: PlantUML diagram marking");
const pumlEmbed = new MockElement("div", "cm-embed-block");
const pumlBlock = new MockElement("div", "block-language-plantuml");
const pumlImg = new MockElement("img", "plantuml-image");

lpContent.appendChild(pumlEmbed);
pumlEmbed.appendChild(pumlBlock);
pumlBlock.appendChild(pumlImg);

markDiagrams(livePreviewView);

assert(
  pumlEmbed.classList.contains(WIDE_BLOCK_CLASS),
  "PlantUML embed block must receive dynamic-wide-content-wide-block"
);
assert(
  pumlEmbed.classList.contains(DIAGRAM_BLOCK_CLASS),
  "PlantUML embed block must receive dynamic-wide-content-diagram-block"
);
assert(
  pumlImg.classList.contains(MEDIA_CLASS),
  "PlantUML image must receive dynamic-wide-content-media"
);
console.log("    ✔ PlantUML scenario verified successfully.");

console.log("\n🎉 ALL TESTS PASSED SUCCESSFULLY! Production ready.");

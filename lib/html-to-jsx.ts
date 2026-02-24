const ATTRIBUTE_MAP: Record<string, string> = {
  class: "className",
  for: "htmlFor",
  tabindex: "tabIndex",
  readonly: "readOnly",
  maxlength: "maxLength",
  cellpadding: "cellPadding",
  cellspacing: "cellSpacing",
  rowspan: "rowSpan",
  colspan: "colSpan",
  enctype: "encType",
  contenteditable: "contentEditable",
  crossorigin: "crossOrigin",
  accesskey: "accessKey",
  autocomplete: "autoComplete",
  autofocus: "autoFocus",
  autoplay: "autoPlay",
  novalidate: "noValidate",
  formaction: "formAction",
  formenctype: "formEncType",
  formmethod: "formMethod",
  formnovalidate: "formNoValidate",
  formtarget: "formTarget",
  frameborder: "frameBorder",
  hreflang: "hrefLang",
  inputmode: "inputMode",
  mediagroup: "mediaGroup",
  minlength: "minLength",
  nomodule: "noModule",
  playsinline: "playsInline",
  srcdoc: "srcDoc",
  srcset: "srcSet",
  srclang: "srcLang",
};

const EVENT_HANDLER_MAP: Record<string, string> = {
  onclick: "onClick",
  ondblclick: "onDoubleClick",
  onchange: "onChange",
  onsubmit: "onSubmit",
  oninput: "onInput",
  onkeydown: "onKeyDown",
  onkeyup: "onKeyUp",
  onkeypress: "onKeyPress",
  onmousedown: "onMouseDown",
  onmouseup: "onMouseUp",
  onmouseover: "onMouseOver",
  onmouseout: "onMouseOut",
  onmousemove: "onMouseMove",
  onmouseenter: "onMouseEnter",
  onmouseleave: "onMouseLeave",
  onfocus: "onFocus",
  onblur: "onBlur",
  onscroll: "onScroll",
  onload: "onLoad",
  onerror: "onError",
  ondrag: "onDrag",
  ondrop: "onDrop",
  ondragover: "onDragOver",
  ondragenter: "onDragEnter",
  ondragleave: "onDragLeave",
  ondragstart: "onDragStart",
  ondragend: "onDragEnd",
  ontouchstart: "onTouchStart",
  ontouchend: "onTouchEnd",
  ontouchmove: "onTouchMove",
  oncontextmenu: "onContextMenu",
};

const VOID_ELEMENTS = new Set([
  "area", "base", "br", "col", "embed", "hr", "img", "input",
  "link", "meta", "param", "source", "track", "wbr",
]);

function convertStyleString(style: string): string {
  const props = style.split(";").filter((s) => s.trim());
  const entries = props.map((prop) => {
    const colonIdx = prop.indexOf(":");
    if (colonIdx === -1) return null;
    const key = prop.slice(0, colonIdx).trim();
    const value = prop.slice(colonIdx + 1).trim();
    // Convert CSS property to camelCase
    const camelKey = key.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    // Keep numeric values as numbers if possible
    const numVal = parseFloat(value);
    if (!isNaN(numVal) && String(numVal) === value) {
      return `${camelKey}: ${numVal}`;
    }
    return `${camelKey}: "${value}"`;
  });
  return `{{ ${entries.filter(Boolean).join(", ")} }}`;
}

export function htmlToJsx(html: string): string {
  let jsx = html;

  // Convert HTML comments to JSX comments
  jsx = jsx.replace(/<!--([\s\S]*?)-->/g, "{/* $1 */}");

  // Convert style attributes
  jsx = jsx.replace(/style="([^"]*)"/g, (_, styleStr) => {
    return `style={${convertStyleString(styleStr)}}`;
  });
  jsx = jsx.replace(/style='([^']*)'/g, (_, styleStr) => {
    return `style={${convertStyleString(styleStr)}}`;
  });

  // Convert HTML attributes to JSX equivalents
  for (const [htmlAttr, jsxAttr] of Object.entries(ATTRIBUTE_MAP)) {
    // Match the attribute as a whole word in a tag context
    const regex = new RegExp(`(<[^>]*\\s)${htmlAttr}(=|\\s|>|/>)`, "gi");
    jsx = jsx.replace(regex, `$1${jsxAttr}$2`);
  }

  // Convert event handlers
  for (const [htmlEvent, jsxEvent] of Object.entries(EVENT_HANDLER_MAP)) {
    const regex = new RegExp(`(<[^>]*\\s)${htmlEvent}=`, "gi");
    jsx = jsx.replace(regex, `$1${jsxEvent}=`);
  }

  // Self-close void elements: <br> → <br />, <img ...> → <img ... />
  for (const tag of VOID_ELEMENTS) {
    // Match void elements that aren't already self-closed
    const regex = new RegExp(`<(${tag})(\\s[^>]*)?>(?!\\s*<\\/${tag}>)`, "gi");
    jsx = jsx.replace(regex, (match, tagName, attrs) => {
      // Already self-closed
      if (match.endsWith("/>")) return match;
      return `<${tagName}${attrs || ""} />`;
    });
  }

  return jsx;
}

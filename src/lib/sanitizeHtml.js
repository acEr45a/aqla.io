// src/lib/sanitizeHtml.js
// Dependency-free HTML sanitizer using the browser's DOMParser.
// Allowlists safe tags/attributes, blocks event handlers and non-http(s) URL schemes.

const ALLOWED_TAGS = new Set([
  'p', 'br', 'b', 'i', 'strong', 'em', 'u', 's', 'sub', 'sup',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li',
  'blockquote', 'code', 'pre',
  'span', 'div',
  'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption', 'colgroup', 'col',
  'a', 'img',
  'hr',
]);

const ALLOWED_ATTRS = new Set([
  'href', 'src', 'alt', 'title', 'target', 'rel',
  'class', 'id', 'style',
  'width', 'height',
  'colspan', 'rowspan', 'scope',
]);

const SAFE_URL_PROTOCOLS = /^(https?:|mailto:|tel:|#|\/)/i;

/**
 * Sanitize an HTML string by parsing it through the browser's DOMParser,
 * removing disallowed tags, stripping event-handler attributes and dangerous
 * URL schemes (javascript:, data:, vbscript:, etc.).
 *
 * @param {string} html - Raw HTML string to sanitize.
 * @returns {string} Sanitized HTML string safe for dangerouslySetInnerHTML.
 */
export function sanitizeHtml(html) {
  if (!html || typeof html !== 'string') return '';

  const doc = new DOMParser().parseFromString(html, 'text/html');
  sanitizeNode(doc.body);
  return doc.body.innerHTML;
}

export default sanitizeHtml;

/**
 * Recursively walk the DOM tree rooted at `node`, removing disallowed
 * elements and attributes in-place.
 */
function sanitizeNode(node) {
  // Walk children in reverse so removals don't shift indices
  const children = Array.from(node.childNodes);
  for (const child of children) {
    if (child.nodeType === Node.TEXT_NODE) {
      // Text nodes are always safe
      continue;
    }

    if (child.nodeType === Node.COMMENT_NODE) {
      // Strip HTML comments
      node.removeChild(child);
      continue;
    }

    if (child.nodeType !== Node.ELEMENT_NODE) {
      node.removeChild(child);
      continue;
    }

    const tagName = child.tagName.toLowerCase();

    if (!ALLOWED_TAGS.has(tagName)) {
      // For block-level disallowed tags, keep their text children but remove the element itself
      while (child.firstChild) {
        node.insertBefore(child.firstChild, child);
      }
      node.removeChild(child);
      continue;
    }

    // Strip disallowed attributes
    const attrs = Array.from(child.attributes);
    for (const attr of attrs) {
      const name = attr.name.toLowerCase();

      // Block all event handlers (on*)
      if (name.startsWith('on')) {
        child.removeAttribute(attr.name);
        continue;
      }

      if (!ALLOWED_ATTRS.has(name)) {
        child.removeAttribute(attr.name);
        continue;
      }

      // Validate URL attributes
      if (name === 'href' || name === 'src') {
        const value = attr.value.trim();
        if (value && !SAFE_URL_PROTOCOLS.test(value)) {
          child.removeAttribute(attr.name);
        }
      }

      // Sanitize style attribute — strip any expression() or url() with dangerous schemes
      if (name === 'style') {
        const styleValue = attr.value;
        if (/expression\s*\(/i.test(styleValue) || /javascript\s*:/i.test(styleValue)) {
          child.removeAttribute(attr.name);
        }
      }
    }

    // Force safe link behavior
    if (tagName === 'a') {
      child.setAttribute('rel', 'noopener noreferrer');
      if (!child.getAttribute('target')) {
        child.setAttribute('target', '_blank');
      }
    }

    // Recurse into children
    sanitizeNode(child);
  }
}

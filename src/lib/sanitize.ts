import sanitizeHtml from "sanitize-html";

const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [],
  allowedAttributes: {},
  disallowedTagsMode: "escape",
};

export function sanitizeText(input: string): string {
  return sanitizeHtml(input.trim(), SANITIZE_OPTIONS);
}

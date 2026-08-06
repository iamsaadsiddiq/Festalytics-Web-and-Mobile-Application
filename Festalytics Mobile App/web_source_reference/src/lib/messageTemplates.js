const STORAGE_PREFIX = "festalytics_message_templates_";

const DEFAULT_TEMPLATES = [
  { id: "tpl-default-1", title: "Thank you", body: "Thank you for booking!" },
  { id: "tpl-default-2", title: "Unavailable", body: "Unfortunately, we're not available." },
  { id: "tpl-default-3", title: "Call request", body: "Can we hop on a call?" },
  { id: "tpl-default-4", title: "Invoice sent", body: "I've sent the invoice over." },
  { id: "tpl-default-5", title: "Updated dates", body: "Please check the updated dates." },
];

function storageKey(venueSlug) {
  return `${STORAGE_PREFIX}${venueSlug || "default"}`;
}

export function loadMessageTemplates(venueSlug) {
  if (typeof window === "undefined") return [...DEFAULT_TEMPLATES];

  try {
    const raw = localStorage.getItem(storageKey(venueSlug));
    if (!raw) return [...DEFAULT_TEMPLATES];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return [...DEFAULT_TEMPLATES];
    return parsed.filter((t) => t?.body?.trim());
  } catch {
    return [...DEFAULT_TEMPLATES];
  }
}

export function saveMessageTemplates(venueSlug, templates) {
  if (typeof window === "undefined") return;
  localStorage.setItem(storageKey(venueSlug), JSON.stringify(templates));
}

export function addMessageTemplate(venueSlug, { title, body }) {
  const trimmed = String(body || "").trim();
  if (!trimmed) throw new Error("Template message cannot be empty.");

  const templates = loadMessageTemplates(venueSlug);
  const next = [
    ...templates,
    {
      id: `tpl-${Date.now()}`,
      title: String(title || "").trim() || `Template ${templates.length + 1}`,
      body: trimmed,
    },
  ];
  saveMessageTemplates(venueSlug, next);
  return next;
}

export function deleteMessageTemplate(venueSlug, templateId) {
  const templates = loadMessageTemplates(venueSlug).filter((t) => t.id !== templateId);
  saveMessageTemplates(venueSlug, templates);
  return templates;
}

/**
 * Normalize venue FAQ entries from Firestore / vendor My Services.
 */
export function normalizeVenueFaqs(faqs) {
  if (!Array.isArray(faqs)) return [];

  return faqs
    .map((entry, index) => {
      const question = String(entry?.question || entry?.q || "").trim();
      const answer = String(entry?.answer || entry?.a || "").trim();
      return {
        id: entry?.id || `faq-${index + 1}`,
        question,
        answer,
        active: entry?.active !== false,
      };
    })
    .filter((f) => f.active && f.question && f.answer);
}

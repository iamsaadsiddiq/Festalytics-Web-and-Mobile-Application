export const INBOX_FILTERS = {
  ALL: "all",
  UNREAD: "unread",
  PENDING: "pending",
  ARCHIVED: "archived",
};

export function filterInboxThreads(threads, filter) {
  const list = threads || [];

  switch (filter) {
    case INBOX_FILTERS.UNREAD:
      return list.filter((t) => t.unread && !t.archived);
    case INBOX_FILTERS.PENDING:
      return list.filter(
        (t) =>
          !t.archived &&
          (t.hasPendingCounterOffer ||
            (t.unread && t.lastSenderRole === "customer"))
      );
    case INBOX_FILTERS.ARCHIVED:
      return list.filter((t) => t.archived);
    case INBOX_FILTERS.ALL:
    default:
      return list.filter((t) => !t.archived);
  }
}

export function countThreadsByFilter(threads) {
  return {
    all: filterInboxThreads(threads, INBOX_FILTERS.ALL).length,
    unread: filterInboxThreads(threads, INBOX_FILTERS.UNREAD).length,
    pending: filterInboxThreads(threads, INBOX_FILTERS.PENDING).length,
    archived: filterInboxThreads(threads, INBOX_FILTERS.ARCHIVED).length,
  };
}

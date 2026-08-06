class InboxFilterOption {
  final String id;
  final String label;

  const InboxFilterOption({required this.id, required this.label});
}

class MessageInboxFilters {
  static const List<InboxFilterOption> statusFilters = [
    InboxFilterOption(id: 'all', label: 'All Messages'),
    InboxFilterOption(id: 'unread', label: 'Unread'),
    InboxFilterOption(id: 'read', label: 'Read'),
    InboxFilterOption(id: 'quotation', label: 'With Quotation'),
  ];

  static const List<InboxFilterOption> sortOptions = [
    InboxFilterOption(id: 'newest', label: 'Newest First'),
    InboxFilterOption(id: 'oldest', label: 'Oldest First'),
    InboxFilterOption(id: 'unread', label: 'Unread First'),
  ];

  static String getStatusLabel(String id) {
    try {
      return statusFilters.firstWhere((f) => f.id == id).label;
    } catch (_) {
      return id;
    }
  }

  static List<Map<String, dynamic>> applyStatusFilter(
      List<Map<String, dynamic>> chats, String filterId) {
    switch (filterId) {
      case 'unread':
        return chats.where((c) {
          final lastRead = c['lastReadByVendor'] as String? ?? '';
          final updatedAt = c['updatedAt'] as String? ?? '';
          return updatedAt.isNotEmpty && (lastRead.isEmpty || updatedAt.compareTo(lastRead) > 0);
        }).toList();
      case 'read':
        return chats.where((c) {
          final lastRead = c['lastReadByVendor'] as String? ?? '';
          final updatedAt = c['updatedAt'] as String? ?? '';
          return lastRead.isNotEmpty && updatedAt.compareTo(lastRead) <= 0;
        }).toList();
      case 'quotation':
        return chats.where((c) => c['hasQuotation'] == true).toList();
      case 'all':
      default:
        return chats;
    }
  }

  static List<Map<String, dynamic>> applySort(
      List<Map<String, dynamic>> chats, String sortId) {
    final sorted = List<Map<String, dynamic>>.from(chats);
    switch (sortId) {
      case 'oldest':
        sorted.sort((a, b) => (a['updatedAt'] ?? '').toString()
            .compareTo((b['updatedAt'] ?? '').toString()));
        break;
      case 'unread':
        sorted.sort((a, b) {
          final aUnread = _isUnread(a);
          final bUnread = _isUnread(b);
          if (aUnread && !bUnread) return -1;
          if (!aUnread && bUnread) return 1;
          return (b['updatedAt'] ?? '').toString()
              .compareTo((a['updatedAt'] ?? '').toString());
        });
        break;
      case 'newest':
      default:
        sorted.sort((a, b) => (b['updatedAt'] ?? '').toString()
            .compareTo((a['updatedAt'] ?? '').toString()));
        break;
    }
    return sorted;
  }

  static bool _isUnread(Map<String, dynamic> chat) {
    final lastRead = chat['lastReadByVendor'] as String? ?? '';
    final updatedAt = chat['updatedAt'] as String? ?? '';
    return updatedAt.isNotEmpty && (lastRead.isEmpty || updatedAt.compareTo(lastRead) > 0);
  }

  static List<Map<String, dynamic>> searchChats(
      List<Map<String, dynamic>> chats, String query) {
    if (query.isEmpty) return chats;
    final lower = query.toLowerCase();
    return chats.where((chat) {
      final name = (chat['customerName'] as String? ?? '').toLowerCase();
      final id = (chat['id'] as String? ?? '').toLowerCase();
      final venueName = (chat['venueName'] as String? ?? '').toLowerCase();
      return name.contains(lower) || id.contains(lower) || venueName.contains(lower);
    }).toList();
  }

  static Map<String, int> getChatCounts(List<Map<String, dynamic>> chats) {
    int unread = 0;
    int quoted = 0;
    for (final chat in chats) {
      if (_isUnread(chat)) unread++;
      if (chat['hasQuotation'] == true) quoted++;
    }
    return {'total': chats.length, 'unread': unread, 'quoted': quoted};
  }
}

class ChatIdBuilder {
  static String buildChatId(String customerId, String venueId) =>
      '${customerId}_$venueId';

  static ({String customerId, String venueId}) parseChatId(String chatId) {
    final parts = chatId.split('_');
    if (parts.length < 2) return (customerId: '', venueId: '');
    return (customerId: parts[0], venueId: parts.sublist(1).join('_'));
  }

  static String extractCustomerId(String chatId) => parseChatId(chatId).customerId;
  static String extractVenueId(String chatId) => parseChatId(chatId).venueId;

  static bool isValidChatId(String chatId) {
    if (chatId.isEmpty) return false;
    return chatId.contains('_');
  }
}

class MessageFormatter {
  static String truncate(String text, int maxLength) {
    if (text.length <= maxLength) return text;
    return '${text.substring(0, maxLength)}...';
  }

  static String formatTimestamp(String? createdAt) {
    if (createdAt == null || createdAt.isEmpty) return '';
    final dt = DateTime.tryParse(createdAt);
    if (dt == null) return createdAt;
    final now = DateTime.now();
    final diff = now.difference(dt);
    if (diff.inMinutes < 1) return 'Just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    if (diff.inDays < 7) return '${diff.inDays}d ago';
    return '${dt.day}/${dt.month}/${dt.year}';
  }

  static String formatMessagePreview(String text, int maxLength) {
    final cleaned = text.replaceAll(RegExp(r'\s+'), ' ').trim();
    return truncate(cleaned, maxLength);
  }

  static bool hasUnreadMessages(Map<String, dynamic> chat, String lastReadTimestamp) {
    final updatedAt = chat['updatedAt'] as String? ?? '';
    if (updatedAt.isEmpty) return false;
    if (lastReadTimestamp.isEmpty) return true;
    return updatedAt.compareTo(lastReadTimestamp) > 0;
  }

  static Map<String, dynamic> formatForDisplay(Map<String, dynamic> msg) {
    return {
      'id': msg['id'],
      'text': msg['text'] ?? '',
      'senderId': msg['senderId'] ?? '',
      'senderRole': msg['senderRole'] ?? '',
      'createdAt': msg['createdAt'] ?? '',
      'read': msg['read'] ?? false,
      'isMine': msg['senderRole'] == 'vendor',
      'imageUrl': msg['imageUrl'],
      'timeAgo': formatTimestamp(msg['createdAt'] as String?),
    };
  }

  static List<Map<String, dynamic>> formatChatList(List<Map<String, dynamic>> chats) {
    return chats.map((chat) {
      final lastMsg = chat['lastMessage'] as String? ?? '';
      final updatedAt = chat['updatedAt'] as String? ?? '';
      return {
        'id': chat['id'],
        'customerName': chat['customerName'] ?? 'Unknown',
        'customerId': chat['customerId'] ?? '',
        'venueId': chat['venueId'] ?? '',
        'venueName': chat['venueName'] ?? '',
        'lastMessage': formatMessagePreview(lastMsg, 60),
        'updatedAt': updatedAt,
        'timeAgo': formatTimestamp(updatedAt),
      };
    }).toList();
  }
}

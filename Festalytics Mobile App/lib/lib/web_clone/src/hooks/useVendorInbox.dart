import 'dart:async';
import 'package:cloud_firestore/cloud_firestore.dart';

class VendorInbox {
  static const String _chatsCollection = 'chats';

  static CollectionReference<Map<String, dynamic>> get _chatsRef =>
      FirebaseFirestore.instance.collection(_chatsCollection);

  static Stream<List<Map<String, dynamic>>> streamInbox(String venueId) {
    if (venueId.isEmpty) return const Stream.empty();
    return _chatsRef
        .where('venueId', isEqualTo: venueId)
        .snapshots()
        .map((snap) {
      final rows = snap.docs
          .map((d) => <String, dynamic>{'id': d.id, ...d.data()})
          .toList();
      rows.sort((a, b) => ((b['updatedAt'] ?? '') as String)
          .compareTo((a['updatedAt'] ?? '') as String));
      return rows;
    });
  }

  static Stream<int> streamUnreadCount(String venueId) {
    if (venueId.isEmpty) return const Stream.empty();
    return streamInbox(venueId).map((chats) {
      int count = 0;
      for (final chat in chats) {
        final lastRead = chat['lastReadByVendor'] as String? ?? '';
        final updatedAt = chat['updatedAt'] as String? ?? '';
        if (updatedAt.isNotEmpty && lastRead.isEmpty) {
          count++;
        } else if (updatedAt.compareTo(lastRead) > 0) {
          count++;
        }
      }
      return count;
    });
  }

  static Future<void> markInboxAsRead(String chatId) async {
    if (chatId.isEmpty) return;
    await _chatsRef.doc(chatId).set(
      {'lastReadByVendor': DateTime.now().toIso8601String()},
      SetOptions(merge: true),
    );
  }

  static StreamSubscription<List<Map<String, dynamic>>> listenToInbox(
    String venueId,
    Function(List<Map<String, dynamic>>) callback, {
    Function(Object)? onError,
  }) {
    return streamInbox(venueId).listen(callback, onError: onError);
  }

  static List<Map<String, dynamic>> filterBySearch(
    List<Map<String, dynamic>> chats,
    String query,
  ) {
    if (query.isEmpty) return chats;
    final lower = query.toLowerCase();
    return chats.where((chat) {
      final name = (chat['customerName'] as String? ?? '');
      final id = (chat['id'] as String? ?? '');
      return name.toLowerCase().contains(lower) ||
          id.toLowerCase().contains(lower);
    }).toList();
  }

  static Future<Map<String, dynamic>?> getChatPreview(String chatId) async {
    if (chatId.isEmpty) return null;
    try {
      final snap = await _chatsRef.doc(chatId).get();
      if (!snap.exists) return null;
      return {'id': snap.id, ...snap.data()!};
    } catch (_) {
      return null;
    }
  }
}

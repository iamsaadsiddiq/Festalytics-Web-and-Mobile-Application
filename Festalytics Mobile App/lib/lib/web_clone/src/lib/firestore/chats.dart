import 'dart:async';
import 'package:cloud_firestore/cloud_firestore.dart';

class FirestoreChats {
  static const String _collection = 'chats';

  static CollectionReference<Map<String, dynamic>> get _ref =>
      FirebaseFirestore.instance.collection(_collection);

  static String buildChatId(String customerId, String venueId) =>
      '${customerId}_$venueId';

  static Stream<List<Map<String, dynamic>>> streamInbox(String venueId) {
    if (venueId.isEmpty) return const Stream.empty();
    return _ref.where('venueId', isEqualTo: venueId).snapshots().map((snap) {
      final rows = snap.docs
          .map((d) => <String, dynamic>{'id': d.id, ...d.data()})
          .toList();
      rows.sort((a, b) => (b['updatedAt'] ?? '')
          .toString()
          .compareTo((a['updatedAt'] ?? '').toString()));
      return rows;
    });
  }

  static Stream<List<Map<String, dynamic>>> streamMessages(String chatId) {
    if (chatId.isEmpty) return const Stream.empty();
    return _ref
        .doc(chatId)
        .collection('messages')
        .orderBy('createdAt')
        .snapshots()
        .map((snap) => snap.docs
            .map((d) => <String, dynamic>{'id': d.id, ...d.data()})
            .toList());
  }

  static Future<String> ensureRoom({
    required String customerId,
    required String venueId,
    required String customerName,
    required String venueName,
  }) async {
    final id = buildChatId(customerId, venueId);
    await _ref.doc(id).set({
      'customerId': customerId,
      'venueId': venueId,
      'customerName': customerName,
      'venueName': venueName,
      'updatedAt': DateTime.now().toIso8601String(),
    }, SetOptions(merge: true));
    return id;
  }

  static Future<void> sendMessage({
    required String chatId,
    required String senderId,
    required String senderRole,
    required String text,
    String? imageUrl,
  }) async {
    final now = DateTime.now().toIso8601String();
    final msgPayload = <String, dynamic>{
      'senderId': senderId,
      'senderRole': senderRole,
      'text': text,
      'createdAt': now,
      'read': false,
      if (imageUrl != null) 'imageUrl': imageUrl,
    };
    await _ref.doc(chatId).collection('messages').add(msgPayload);
    await _ref.doc(chatId).set(
      {'lastMessage': text, 'updatedAt': now},
      SetOptions(merge: true),
    );
  }

  static Future<void> markAsRead(
      String chatId, String messageId) async {
    await _ref
        .doc(chatId)
        .collection('messages')
        .doc(messageId)
        .update({'read': true});
  }

  static Future<void> markAllAsRead(String chatId) async {
    final snapshot = await _ref
        .doc(chatId)
        .collection('messages')
        .where('read', isEqualTo: false)
        .get();
    final batch = FirebaseFirestore.instance.batch();
    for (final doc in snapshot.docs) {
      batch.update(doc.reference, {'read': true});
    }
    await batch.commit();
  }

  static Future<void> setLastReadByVendor(
      String chatId, String timestamp) async {
    await _ref.doc(chatId).set(
      {'lastReadByVendor': timestamp},
      SetOptions(merge: true),
    );
  }

  static Future<Map<String, dynamic>?> getChat(String chatId) async {
    if (chatId.isEmpty) return null;
    try {
      final snap = await _ref.doc(chatId).get();
      if (!snap.exists) return null;
      return {'id': snap.id, ...snap.data()!};
    } catch (_) {
      return null;
    }
  }

  static Future<int> getUnreadCount(String venueId) async {
    if (venueId.isEmpty) return 0;
    try {
      final chats = await _ref.where('venueId', isEqualTo: venueId).get();
      int count = 0;
      for (final doc in chats.docs) {
        final data = doc.data();
        final lastRead = data['lastReadByVendor'] as String? ?? '';
        final updatedAt = data['updatedAt'] as String? ?? '';
        if (updatedAt.isNotEmpty &&
            (lastRead.isEmpty || updatedAt.compareTo(lastRead) > 0)) {
          count++;
        }
      }
      return count;
    } catch (_) {
      return 0;
    }
  }
}

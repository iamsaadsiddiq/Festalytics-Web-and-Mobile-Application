import 'dart:async';
import 'package:cloud_firestore/cloud_firestore.dart';

class ChatMessages {
  static const String _chatsCollection = 'chats';

  static CollectionReference<Map<String, dynamic>> get _chatsRef =>
      FirebaseFirestore.instance.collection(_chatsCollection);

  static Stream<List<Map<String, dynamic>>> streamMessages(String chatId) {
    if (chatId.isEmpty) return const Stream.empty();
    return _chatsRef
        .doc(chatId)
        .collection('messages')
        .orderBy('createdAt', descending: false)
        .snapshots()
        .map((snap) => snap.docs
            .map((d) => <String, dynamic>{'id': d.id, ...d.data()})
            .toList());
  }

  static Future<void> sendMessage({
    required String chatId,
    required String senderId,
    required String senderRole,
    required String text,
    String? imageUrl,
  }) async {
    if (chatId.isEmpty || text.trim().isEmpty) return;
    final now = DateTime.now().toIso8601String();
    final messagePayload = <String, dynamic>{
      'senderId': senderId,
      'senderRole': senderRole,
      'text': text.trim(),
      'createdAt': now,
      'read': false,
      if (imageUrl != null) 'imageUrl': imageUrl,
    };
    await _chatsRef.doc(chatId).collection('messages').add(messagePayload);
    await _chatsRef.doc(chatId).set(
      {'lastMessage': text.trim(), 'updatedAt': now},
      SetOptions(merge: true),
    );
  }

  static Future<void> sendSystemMessage({
    required String chatId,
    required String text,
  }) async {
    await sendMessage(
      chatId: chatId,
      senderId: 'system',
      senderRole: 'system',
      text: text,
    );
  }

  static Future<void> markAsRead(String chatId, String messageId) async {
    if (chatId.isEmpty || messageId.isEmpty) return;
    await _chatsRef
        .doc(chatId)
        .collection('messages')
        .doc(messageId)
        .update({'read': true});
  }

  static Future<void> markAllAsRead(String chatId) async {
    if (chatId.isEmpty) return;
    final snap = await _chatsRef
        .doc(chatId)
        .collection('messages')
        .where('read', isEqualTo: false)
        .get();
    final batch = FirebaseFirestore.instance.batch();
    for (final doc in snap.docs) {
      batch.update(doc.reference, {'read': true});
    }
    await batch.commit();
  }

  static StreamSubscription<List<Map<String, dynamic>>> listenToMessages(
    String chatId,
    Function(List<Map<String, dynamic>>) callback, {
    Function(Object)? onError,
  }) {
    return streamMessages(chatId).listen(callback, onError: onError);
  }

  static List<Map<String, dynamic>> formatMessages(
      List<Map<String, dynamic>> messages) {
    return messages.map((msg) {
      final createdAt = msg['createdAt'] as String? ?? '';
      final text = msg['text'] as String? ?? '';
      final senderRole = msg['senderRole'] as String? ?? '';
      return {
        'id': msg['id'],
        'text': text,
        'senderRole': senderRole,
        'senderId': msg['senderId'],
        'createdAt': createdAt,
        'read': msg['read'] ?? false,
        'isMine': senderRole == 'vendor',
        'imageUrl': msg['imageUrl'],
        'timestamp': createdAt.isNotEmpty
            ? DateTime.tryParse(createdAt)
            : null,
      };
    }).toList();
  }
}

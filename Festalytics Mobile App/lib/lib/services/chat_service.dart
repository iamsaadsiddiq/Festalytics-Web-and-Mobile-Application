import 'package:cloud_firestore/cloud_firestore.dart';

class ChatService {
  static CollectionReference<Map<String, dynamic>> get _rooms =>
      FirebaseFirestore.instance.collection('chats');

  static String buildChatId(String customerId, String venueId) => '${customerId}_$venueId';

  static Stream<List<Map<String, dynamic>>> streamInbox(String venueId) {
    if (venueId.isEmpty) return const Stream<List<Map<String, dynamic>>>.empty();
    return _rooms.where('venueId', isEqualTo: venueId).snapshots().map((snap) {
      final rows = snap.docs.map((d) => {'id': d.id, ...d.data()}).toList();
      rows.sort((a, b) => (b['updatedAt'] ?? '').toString().compareTo((a['updatedAt'] ?? '').toString()));
      return rows;
    });
  }

  static Stream<List<Map<String, dynamic>>> streamMessages(String chatId) {
    if (chatId.isEmpty) return const Stream<List<Map<String, dynamic>>>.empty();
    return _rooms.doc(chatId).collection('messages').orderBy('createdAt').snapshots().map((snap) {
      return snap.docs.map((d) => {'id': d.id, ...d.data()}).toList();
    });
  }

  static Future<String> ensureRoom({
    required String customerId,
    required String venueId,
    required String customerName,
    required String venueName,
  }) async {
    final id = buildChatId(customerId, venueId);
    await _rooms.doc(id).set({
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
    Map<String, dynamic>? extraData,
  }) async {
    final now = DateTime.now().toIso8601String();
    final message = <String, dynamic>{
      'senderId': senderId,
      'senderRole': senderRole,
      'text': text,
      'createdAt': now,
      'read': false,
    };
    if (extraData != null) message['extraData'] = extraData;
    await _rooms.doc(chatId).collection('messages').add(message);
    await _rooms.doc(chatId).set({'lastMessage': text, 'updatedAt': now}, SetOptions(merge: true));
  }
}

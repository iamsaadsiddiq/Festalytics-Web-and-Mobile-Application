import 'package:cloud_firestore/cloud_firestore.dart';

class ChatMessage {
  final String id;
  final String senderId;
  final String senderName;
  final String content;
  final DateTime timestamp;
  final String? imageUrl;

  ChatMessage({
    required this.id,
    required this.senderId,
    required this.senderName,
    required this.content,
    required this.timestamp,
    this.imageUrl,
  });

  factory ChatMessage.fromFirestore(String docId, Map<String, dynamic> data) {
    DateTime ts;
    if (data['timestamp'] != null) {
      if (data['timestamp'] is Timestamp) {
        ts = (data['timestamp'] as Timestamp).toDate();
      } else {
        ts = DateTime.tryParse(data['timestamp'].toString()) ?? DateTime.now();
      }
    } else {
      ts = DateTime.now();
    }

    return ChatMessage(
      id: docId,
      senderId: data['senderId'] ?? '',
      senderName: data['senderName'] ?? '',
      content: data['content'] ?? '',
      timestamp: ts,
      imageUrl: data['imageUrl'] as String?,
    );
  }

  Map<String, dynamic> toFirestore() => {
        'senderId': senderId,
        'senderName': senderName,
        'content': content,
        'timestamp': timestamp.toIso8601String(),
        if (imageUrl != null) 'imageUrl': imageUrl,
      };
}

class ChatThread {
  final String id;
  final List<String> participantIds;
  final List<String> participantNames;
  final ChatMessage? lastMessage;
  final DateTime? lastActivity;
  final String? venueId;
  final String? bookingId;

  ChatThread({
    required this.id,
    required this.participantIds,
    required this.participantNames,
    this.lastMessage,
    this.lastActivity,
    this.venueId,
    this.bookingId,
  });

  factory ChatThread.fromFirestore(String docId, Map<String, dynamic> data) {
    DateTime? lastActivity;
    if (data['lastActivity'] != null) {
      if (data['lastActivity'] is Timestamp) {
        lastActivity = (data['lastActivity'] as Timestamp).toDate();
      } else {
        lastActivity = DateTime.tryParse(data['lastActivity'].toString());
      }
    }

    return ChatThread(
      id: docId,
      participantIds: List<String>.from(data['participantIds'] ?? []),
      participantNames: List<String>.from(data['participantNames'] ?? []),
      lastMessage: data['lastMessage'] != null
          ? ChatMessage(
              id: '',
              senderId: data['lastMessage']['senderId'] ?? '',
              senderName: data['lastMessage']['senderName'] ?? '',
              content: data['lastMessage']['content'] ?? '',
              timestamp: lastActivity ?? DateTime.now(),
            )
          : null,
      lastActivity: lastActivity,
      venueId: data['venueId'] as String?,
      bookingId: data['bookingId'] as String?,
    );
  }

  Map<String, dynamic> toFirestore() => {
        'participantIds': participantIds,
        'participantNames': participantNames,
        if (lastMessage != null)
          'lastMessage': {
            'senderId': lastMessage!.senderId,
            'senderName': lastMessage!.senderName,
            'content': lastMessage!.content,
          },
        'lastActivity': lastActivity?.toIso8601String(),
        if (venueId != null) 'venueId': venueId,
        if (bookingId != null) 'bookingId': bookingId,
      };
}

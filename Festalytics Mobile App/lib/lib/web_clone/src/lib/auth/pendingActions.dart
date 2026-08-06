import 'package:cloud_firestore/cloud_firestore.dart';

class PendingAction {
  final String id;
  final String uid;
  final String action;
  final Map<String, dynamic> payload;
  final String status;
  final DateTime createdAt;

  PendingAction({
    required this.id,
    required this.uid,
    required this.action,
    required this.payload,
    this.status = 'pending',
    DateTime? createdAt,
  }) : createdAt = createdAt ?? DateTime.now();

  factory PendingAction.fromFirestore(String docId, Map<String, dynamic> data) {
    DateTime? ts;
    if (data['createdAt'] != null) {
      if (data['createdAt'] is Timestamp) {
        ts = (data['createdAt'] as Timestamp).toDate();
      } else {
        ts = DateTime.tryParse(data['createdAt'].toString());
      }
    }
    return PendingAction(
      id: docId,
      uid: data['uid'] ?? '',
      action: data['action'] ?? '',
      payload: Map<String, dynamic>.from(data['payload'] ?? {}),
      status: data['status'] ?? 'pending',
      createdAt: ts ?? DateTime.now(),
    );
  }

  Map<String, dynamic> toFirestore() => {
    'uid': uid,
    'action': action,
    'payload': payload,
    'status': status,
    'createdAt': FieldValue.serverTimestamp(),
  };
}

class PendingActionsService {
  static const String _collection = 'pending_actions';

  static CollectionReference<Map<String, dynamic>> get _ref =>
      FirebaseFirestore.instance.collection(_collection);

  static Future<String> addPendingAction({
    required String uid,
    required String action,
    required Map<String, dynamic> payload,
  }) async {
    final record = PendingAction(
      id: '',
      uid: uid,
      action: action,
      payload: payload,
    );
    final doc = await _ref.add(record.toFirestore());
    await doc.update({'actionId': doc.id});
    return doc.id;
  }

  static Future<List<PendingAction>> getUserPendingActions(String uid) async {
    final snap = await _ref
        .where('uid', isEqualTo: uid)
        .where('status', isEqualTo: 'pending')
        .get();
    return snap.docs
        .map((d) => PendingAction.fromFirestore(d.id, d.data()))
        .toList();
  }

  static Future<void> completeAction(String actionId) async {
    await _ref.doc(actionId).update({'status': 'completed'});
  }

  static Future<void> failAction(String actionId, String error) async {
    await _ref.doc(actionId).update({
      'status': 'failed',
      'error': error,
    });
  }

  static Stream<List<PendingAction>> streamUserPendingActions(String uid) {
    return _ref
        .where('uid', isEqualTo: uid)
        .where('status', isEqualTo: 'pending')
        .snapshots()
        .map((snap) => snap.docs
            .map((d) => PendingAction.fromFirestore(d.id, d.data()))
            .toList());
  }
}

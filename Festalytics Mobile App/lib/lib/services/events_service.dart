import 'package:cloud_firestore/cloud_firestore.dart';

class EventsService {
  static CollectionReference<Map<String, dynamic>> get _ref =>
      FirebaseFirestore.instance.collection('events');

  static Stream<List<Map<String, dynamic>>> streamUserEvents(String uid) {
    return _ref.where('userId', isEqualTo: uid).snapshots().map((snap) {
      final rows = snap.docs.map((doc) => {'id': doc.id, ...doc.data()}).toList();
      rows.sort((a, b) => (b['updatedAt'] ?? b['createdAt'] ?? '').toString().compareTo((a['updatedAt'] ?? a['createdAt'] ?? '').toString()));
      return rows;
    });
  }

  static Future<Map<String, dynamic>?> getEvent(String id) async {
    final snap = await _ref.doc(id).get();
    if (!snap.exists) return null;
    return {'id': snap.id, ...snap.data()!};
  }

  static Future<String> saveEvent({String? id, required Map<String, dynamic> payload}) async {
    final record = {
      ...payload,
      'updatedAt': DateTime.now().toIso8601String(),
    };
    if (id == null || id.isEmpty) {
      final doc = await _ref.add({
        ...record,
        'createdAt': FieldValue.serverTimestamp(),
        'status': payload['status'] ?? 'draft',
      });
      return doc.id;
    }
    await _ref.doc(id).set(record, SetOptions(merge: true));
    return id;
  }

  static Future<void> deleteEvent(String id) => _ref.doc(id).delete();
}

import 'package:cloud_firestore/cloud_firestore.dart';

class MessageTemplate {
  final String id;
  final String title;
  final String body;
  final String category;
  final List<String> placeholders;
  final bool isActive;
  final DateTime createdAt;

  MessageTemplate({
    required this.id,
    required this.title,
    required this.body,
    this.category = 'general',
    this.placeholders = const [],
    this.isActive = true,
    DateTime? createdAt,
  }) : createdAt = createdAt ?? DateTime.now();

  factory MessageTemplate.fromFirestore(
      String docId, Map<String, dynamic> data) {
    DateTime? ts;
    if (data['createdAt'] != null) {
      if (data['createdAt'] is Timestamp) {
        ts = (data['createdAt'] as Timestamp).toDate();
      } else {
        ts = DateTime.tryParse(data['createdAt'].toString());
      }
    }
    return MessageTemplate(
      id: docId,
      title: data['title'] ?? '',
      body: data['body'] ?? '',
      category: data['category'] ?? 'general',
      placeholders: List<String>.from(data['placeholders'] ?? []),
      isActive: data['isActive'] ?? true,
      createdAt: ts ?? DateTime.now(),
    );
  }

  Map<String, dynamic> toFirestore() => {
    'title': title,
    'body': body,
    'category': category,
    'placeholders': placeholders,
    'isActive': isActive,
    'updatedAt': DateTime.now().toIso8601String(),
  };

  String render(Map<String, String> values) {
    var result = body;
    for (final ph in placeholders) {
      result = result.replaceAll('{{$ph}}', values[ph] ?? '[$ph]');
    }
    return result;
  }
}

class MessageTemplates {
  static const String _collection = 'message_templates';

  static CollectionReference<Map<String, dynamic>> get _ref =>
      FirebaseFirestore.instance.collection(_collection);

  static Future<List<MessageTemplate>> fetchAll() async {
    final snap = await _ref.get();
    return snap.docs
        .map((d) =>
            MessageTemplate.fromFirestore(d.id, d.data()))
        .toList();
  }

  static Future<List<MessageTemplate>> fetchActive() async {
    final snap =
        await _ref.where('isActive', isEqualTo: true).get();
    return snap.docs
        .map((d) =>
            MessageTemplate.fromFirestore(d.id, d.data()))
        .toList();
  }

  static Future<List<MessageTemplate>> fetchByCategory(String category) async {
    final snap = await _ref
        .where('category', isEqualTo: category)
        .where('isActive', isEqualTo: true)
        .get();
    return snap.docs
        .map((d) =>
            MessageTemplate.fromFirestore(d.id, d.data()))
        .toList();
  }

  static Future<String> saveTemplate(MessageTemplate template) async {
    final doc = await _ref.add(template.toFirestore());
    await doc.update({'templateId': doc.id, 'createdAt': FieldValue.serverTimestamp()});
    return doc.id;
  }

  static Future<void> updateTemplate(
      String templateId, MessageTemplate template) async {
    await _ref.doc(templateId).set(template.toFirestore(), SetOptions(merge: true));
  }

  static Future<void> deleteTemplate(String templateId) async {
    await _ref.doc(templateId).delete();
  }

  static String renderTemplate(String body, Map<String, String> values) {
    var result = body;
    for (final entry in values.entries) {
      result = result.replaceAll('{{${entry.key}}}', entry.value);
    }
    return result;
  }

  static List<String> extractPlaceholders(String body) {
    final regex = RegExp(r'\{\{(\w+)\}\}');
    return regex.allMatches(body).map((m) => m.group(1)!).toList();
  }

  static List<MessageTemplate> searchTemplates(
      List<MessageTemplate> templates, String query) {
    if (query.isEmpty) return templates;
    final lower = query.toLowerCase();
    return templates.where((t) {
      return t.title.toLowerCase().contains(lower) ||
          t.body.toLowerCase().contains(lower) ||
          t.category.toLowerCase().contains(lower);
    }).toList();
  }
}

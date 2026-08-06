import 'package:cloud_firestore/cloud_firestore.dart';

class VendorVenueResolver {
  static const String _venuesCollection = 'venues';
  static const String _usersCollection = 'users';

  static CollectionReference get _venuesRef =>
      FirebaseFirestore.instance.collection(_venuesCollection);

  static CollectionReference get _usersRef =>
      FirebaseFirestore.instance.collection(_usersCollection);

  static Future<String?> resolveVendorVenueId(
    String userId, {
    Map<String, dynamic>? userData,
  }) async {
    if (userId.isEmpty) return null;
    if (userData != null && userData['venueId'] != null) {
      final venueId = userData['venueId'] as String;
      if (venueId.isNotEmpty) return venueId;
    }
    try {
      final ownedSnap = await _venuesRef
          .where('ownerId', isEqualTo: userId)
          .limit(5)
          .get();
      if (ownedSnap.docs.isNotEmpty) {
        final slug = ownedSnap.docs.first.id;
        await _usersRef.doc(userId).set(
          {
            'venueId': slug,
            'onboardingComplete': true,
            'updatedAt': DateTime.now().toIso8601String(),
          },
          SetOptions(merge: true),
        );
        return slug;
      }
    } catch (_) {}
    return null;
  }

  static Future<Map<String, dynamic>?> fetchVenueData(String venueId) async {
    if (venueId.isEmpty) return null;
    try {
      final snap = await _venuesRef.doc(venueId).get();
      if (!snap.exists) return null;
      return {'id': snap.id, ...snap.data() as Map<String, dynamic>};
    } catch (_) {
      return null;
    }
  }

  static Stream<Map<String, dynamic>?> streamVenueData(String venueId) {
    return _venuesRef.doc(venueId).snapshots().map((snap) {
      if (!snap.exists) return null;
      return {'id': snap.id, ...snap.data() as Map<String, dynamic>};
    });
  }

  static Future<String?> getVenueIdFromUser(String userId) async {
    if (userId.isEmpty) return null;
    try {
      final snap = await _usersRef.doc(userId).get();
      if (!snap.exists) return null;
      final data = snap.data() as Map<String, dynamic>?;
      if (data == null) return null;
      return data['venueId'] as String?;
    } catch (_) {
      return null;
    }
  }

  static Future<bool> isVenueOwner(String userId, String venueId) async {
    if (userId.isEmpty || venueId.isEmpty) return false;
    try {
      final snap = await _venuesRef.doc(venueId).get();
      if (!snap.exists) return false;
      final data = snap.data() as Map<String, dynamic>;
      return data['ownerId'] == userId;
    } catch (_) {
      return false;
    }
  }
}

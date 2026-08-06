import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/user.dart';

class UsersService {
  static const String _collection = 'users';

  static CollectionReference get _ref =>
      FirebaseFirestore.instance.collection(_collection);

  static Future<AppUser?> getUserProfile(String uid) async {
    if (uid.isEmpty) return null;
    final snap = await _ref.doc(uid).get();
    if (!snap.exists) return null;
    return AppUser.fromFirestore(uid, (snap.data() as Map<String, dynamic>?) ?? {});
  }

  static Future<void> createUserProfile(
      String uid, Map<String, dynamic> data) async {
    final record = {
      'uid': uid,
      ...data,
      'createdAt': FieldValue.serverTimestamp(),
    };
    await _ref.doc(uid).set(record);
  }

  static Future<void> updateUserProfile(
      String uid, Map<String, dynamic> data) async {
    await _ref.doc(uid).set(
          {
            ...data,
            'updatedAt': DateTime.now().toIso8601String(),
          },
          SetOptions(merge: true),
        );
  }

  static Future<String?> getUserRole(String uid) async {
    final user = await getUserProfile(uid);
    return user?.role;
  }

  static Future<String?> getVenueId(String uid) async {
    final user = await getUserProfile(uid);
    return user?.venueId;
  }

  static Future<bool> isVendor(String uid) async {
    final role = await getUserRole(uid);
    return role == 'vendor';
  }

  static Future<String?> resolveVendorVenueId(String userId,
      {AppUser? userData}) async {
    if (userId.isEmpty) return null;
    if (userData?.venueId != null && userData!.venueId!.isNotEmpty) {
      return userData.venueId;
    }

    try {
      final venuesSnap = await FirebaseFirestore.instance
          .collection('venues')
          .where('ownerId', isEqualTo: userId)
          .limit(5)
          .get();

      if (venuesSnap.docs.isNotEmpty) {
        final slug = venuesSnap.docs.first.id;
        await _ref.doc(userId).set(
              {
                'venueId': slug,
                'onboardingComplete': true,
                'updatedAt': DateTime.now().toIso8601String(),
              },
              SetOptions(merge: true),
            );
        return slug;
      }
    } catch (e) {
      // Silently fail
    }

    return null;
  }

  static Stream<DocumentSnapshot<Map<String, dynamic>>> streamUserProfile(
      String uid) {
    return _ref.doc(uid).snapshots().cast<DocumentSnapshot<Map<String, dynamic>>>();
  }
}

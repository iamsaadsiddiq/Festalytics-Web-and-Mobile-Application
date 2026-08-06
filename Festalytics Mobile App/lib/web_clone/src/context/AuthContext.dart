import 'package:flutter/foundation.dart';
import 'package:firebase_auth/firebase_auth.dart' hide AuthProvider;
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

class AppUserData {
  final String uid;
  final String email;
  final String name;
  final String role;
  final String? venueId;
  final bool onboardingComplete;
  final String? phone;
  final String? photoUrl;

  AppUserData({
    required this.uid,
    required this.email,
    this.name = '',
    this.role = 'customer',
    this.venueId,
    this.onboardingComplete = false,
    this.phone,
    this.photoUrl,
  });

  factory AppUserData.fromFirestore(String uid, Map<String, dynamic> data) {
    return AppUserData(
      uid: uid,
      email: data['email'] ?? '',
      name: data['name'] ?? data['displayName'] ?? '',
      role: data['role'] ?? 'customer',
      venueId: data['venueId'] as String?,
      onboardingComplete: data['onboardingComplete'] ?? false,
      phone: data['phone'] as String?,
      photoUrl: data['photoUrl'] as String?,
    );
  }

  Map<String, dynamic> toFirestore() => {
    'email': email,
    'name': name,
    'role': role,
    'venueId': venueId,
    'onboardingComplete': onboardingComplete,
    'phone': phone,
    'photoUrl': photoUrl,
  };
}

class AuthContext extends ChangeNotifier {
  final FirebaseAuth _auth = FirebaseAuth.instance;

  AppUserData? _user;
  bool _isLoading = true;
  String? _error;

  AppUserData? get user => _user;
  bool get isLoading => _isLoading;
  bool get isLoggedIn => _user != null;
  bool get isVendor => _user?.role == 'vendor';
  String? get error => _error;
  String? get uid => _auth.currentUser?.uid;
  User? get firebaseUser => _auth.currentUser;

  AuthContext() {
    _auth.authStateChanges().listen(_onAuthStateChanged);
  }

  Future<void> _onAuthStateChanged(User? firebaseUser) async {
    _isLoading = true;
    notifyListeners();
    if (firebaseUser == null) {
      _user = null;
      _isLoading = false;
      notifyListeners();
      return;
    }
    try {
      final snap = await FirebaseFirestore.instance
          .collection('users')
          .doc(firebaseUser.uid)
          .get();
      if (snap.exists) {
        _user = AppUserData.fromFirestore(
          firebaseUser.uid,
          snap.data() as Map<String, dynamic>,
        );
      } else {
        _user = AppUserData(
          uid: firebaseUser.uid,
          email: firebaseUser.email ?? '',
          name: firebaseUser.displayName ?? '',
        );
      }
      _error = null;
    } catch (e) {
      _error = e.toString();
      _user = null;
    }
    _isLoading = false;
    notifyListeners();
  }

  Future<void> refresh() async {
    if (_auth.currentUser == null) return;
    try {
      final snap = await FirebaseFirestore.instance
          .collection('users')
          .doc(_auth.currentUser!.uid)
          .get();
      if (snap.exists) {
        _user = AppUserData.fromFirestore(
          _auth.currentUser!.uid,
          snap.data() as Map<String, dynamic>,
        );
      }
      notifyListeners();
    } catch (e) {
      _error = e.toString();
    }
  }

  Future<void> signOut() async {
    await _auth.signOut();
    _user = null;
    notifyListeners();
  }

  Future<String?> resolveVenueId() async {
    if (uid == null) return null;
    if (_user?.venueId != null && _user!.venueId!.isNotEmpty) {
      return _user!.venueId;
    }
    try {
      final venuesSnap = await FirebaseFirestore.instance
          .collection('venues')
          .where('ownerId', isEqualTo: uid)
          .limit(5)
          .get();
      if (venuesSnap.docs.isNotEmpty) {
        final slug = venuesSnap.docs.first.id;
        await FirebaseFirestore.instance.collection('users').doc(uid).set(
          {'venueId': slug, 'onboardingComplete': true, 'updatedAt': DateTime.now().toIso8601String()},
          SetOptions(merge: true),
        );
        await refresh();
        return slug;
      }
    } catch (_) {}
    return null;
  }

  Future<Map<String, dynamic>> sendMagicLink(String email) async {
    final baseUrl = dotenv.maybeGet('NEXT_PUBLIC_AI_BACKEND_URL') ?? 'http://10.0.2.2:8001';
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/auth/magic-link'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'email': email}),
      ).timeout(const Duration(seconds: 30));
      if (response.statusCode >= 200 && response.statusCode < 300) {
        return jsonDecode(response.body) as Map<String, dynamic>;
      }
      return {'error': 'Failed to send magic link'};
    } catch (e) {
      return {'error': e.toString()};
    }
  }
}

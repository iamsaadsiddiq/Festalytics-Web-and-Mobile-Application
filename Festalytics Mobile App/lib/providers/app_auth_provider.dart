import 'package:flutter/foundation.dart';
import 'package:firebase_auth/firebase_auth.dart' hide AuthProvider;
import '../models/user.dart';
import '../services/users_service.dart';

class AppAuthProvider extends ChangeNotifier {
  FirebaseAuth? _auth;
  AppUser? _currentUser;
  bool _isLoading = true;
  String? _error;

  FirebaseAuth get _firebaseAuth {
    if (_auth == null) _auth = FirebaseAuth.instance;
    return _auth!;
  }

  AppUser? get currentUser => _currentUser;
  bool get isLoading => _isLoading;
  bool get isLoggedIn => _currentUser != null;
  bool get isVendor => _currentUser?.role == 'vendor';
  String? get error => _error;
  String? get uid => _firebaseAuth.currentUser?.uid;
  User? get firebaseUser => _firebaseAuth.currentUser;

  AppAuthProvider() {
    try {
      _auth = FirebaseAuth.instance;
      _auth!.authStateChanges().listen(_onAuthStateChanged);
    } catch (_) {
      _isLoading = false;
    }
  }

  Future<void> _onAuthStateChanged(User? user) async {
    _isLoading = true;
    notifyListeners();

    if (user == null) {
      _currentUser = null;
      _isLoading = false;
      notifyListeners();
      return;
    }

    try {
      _currentUser = await UsersService.getUserProfile(user.uid);
    } catch (e) {
      _error = e.toString();
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<void> refresh() async {
    if (_firebaseAuth.currentUser == null) return;
    _currentUser = await UsersService.getUserProfile(_firebaseAuth.currentUser!.uid);
    notifyListeners();
  }

  Future<void> signOut() async {
    await _firebaseAuth.signOut();
    _currentUser = null;
    notifyListeners();
  }

  Future<String?> resolveVenueId() async {
    if (uid == null) return null;
    final venueId = await UsersService.resolveVendorVenueId(uid!, userData: _currentUser);
    if (venueId != null) {
      await refresh();
    }
    return venueId;
  }
}

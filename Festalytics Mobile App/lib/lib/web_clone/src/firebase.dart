import 'package:firebase_core/firebase_core.dart';
import '../../firebase_options.dart' show DefaultFirebaseOptions;

class WebCloneFirebase {
  static FirebaseApp? _app;

  static Future<FirebaseApp> initialize() async {
    if (_app != null) return _app!;
    _app = await Firebase.initializeApp(
      options: DefaultFirebaseOptions.currentPlatform,
    );
    return _app!;
  }

  static FirebaseApp? get app => _app;

  static bool get isInitialized => _app != null;

  static Future<void> reset() async {
    if (_app != null) {
      await _app!.delete();
      _app = null;
    }
  }
}

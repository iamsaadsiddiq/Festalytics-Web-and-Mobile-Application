import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:provider/provider.dart';

import 'core/routes/app_routes.dart';
import 'core/theme/app_theme.dart';
import 'firebase_options.dart';
import 'providers/app_auth_provider.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  try { await dotenv.load(fileName: '.env.local'); } catch (_) {}
  try { await dotenv.load(fileName: '.env'); } catch (_) {}
  try {
    await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
  } catch (e) {
    // ignore: avoid_print
    print('Firebase init with options failed: $e');
    try {
      await Firebase.initializeApp();
    } catch (e2) {
      // ignore: avoid_print
      print('Firebase init fallback failed: $e2');
    }
  }
  final firebaseReady = Firebase.apps.isNotEmpty;
  runApp(
    ChangeNotifierProvider(
      create: (_) => AppAuthProvider(),
      child: FestalyticsApp(firebaseReady: firebaseReady),
    ),
  );
}

class FestalyticsApp extends StatelessWidget {
  final bool firebaseReady;
  const FestalyticsApp({super.key, this.firebaseReady = true});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Festalytics',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light(),
      initialRoute: AppRoutes.home,
      onGenerateRoute: firebaseReady ? AppRoutes.onGenerateRoute : (_) {
        return MaterialPageRoute(builder: (_) => Scaffold(
          backgroundColor: const Color(0xFF080808),
          body: Center(
            child: Padding(
              padding: const EdgeInsets.all(32),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.error_outline, color: Colors.red, size: 64),
                  const SizedBox(height: 16),
                  const Text('Firebase initialization failed', style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w900)),
                  const SizedBox(height: 8),
                  const Text('Check google-services.json and Firebase project configuration.', style: TextStyle(color: Colors.white60)),
                  const SizedBox(height: 24),
                  ElevatedButton(onPressed: () => main(), child: const Text('Retry')),
                ],
              ),
            ),
          ),
        ));
      },
    );
  }
}

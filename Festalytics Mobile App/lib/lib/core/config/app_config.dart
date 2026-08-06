import 'package:flutter_dotenv/flutter_dotenv.dart';

class AppConfig {
  static const String defaultBackendUrl = 'http://10.0.2.2:8001';

  static Future<void> loadEnv() async {
    try {
      await dotenv.load(fileName: '.env.local');
    } catch (_) {
      try {
        await dotenv.load(fileName: '.env');
      } catch (_) {}
    }
  }

  static String get backendUrl {
    const fromDefine = String.fromEnvironment('MOBILE_BACKEND_URL');
    if (fromDefine.isNotEmpty) return _clean(fromDefine);
    final envValue = dotenv.maybeGet('NEXT_PUBLIC_AI_BACKEND_URL') ??
        dotenv.maybeGet('AI_BACKEND_URL') ??
        dotenv.maybeGet('PUBLIC_BASE_URL');
    if (envValue != null && envValue.trim().isNotEmpty) {
      return _clean(envValue);
    }
    return defaultBackendUrl;
  }

  static String _clean(String value) => value.trim().replaceAll(RegExp(r'/+$'), '');
}

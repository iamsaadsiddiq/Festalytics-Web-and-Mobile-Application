import 'package:flutter_dotenv/flutter_dotenv.dart';

class AiBackendUrl {
  static const String defaultBaseUrl = 'http://10.0.2.2:8001';

  static String get baseUrl {
    const fromDefine = String.fromEnvironment('MOBILE_BACKEND_URL');
    if (fromDefine.isNotEmpty) return _clean(fromDefine);
    final envValue = dotenv.maybeGet('NEXT_PUBLIC_AI_BACKEND_URL') ??
        dotenv.maybeGet('AI_BACKEND_URL') ??
        dotenv.maybeGet('PUBLIC_BASE_URL');
    if (envValue != null && envValue.trim().isNotEmpty) {
      return _clean(envValue);
    }
    return defaultBaseUrl;
  }

  static String _clean(String value) =>
      value.trim().replaceAll(RegExp(r'/+$'), '');

  static Uri uri(String path) {
    final cleanPath = path.startsWith('/') ? path : '/$path';
    return Uri.parse('$baseUrl$cleanPath');
  }

  static Uri ragChat() => uri('/api/rag/chat');
  static Uri clipMatch() => uri('/api/clip/match');
  static Uri initiateCall() => uri('/api/twilio/initiate-call');
  static Uri decorMatch() => uri('/api/clip/match');
  static Uri plannerChat() => uri('/api/rag/chat');

  static String buildUrl(String path) => uri(path).toString();
}

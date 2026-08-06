import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import '../core/config/app_config.dart';

String resolveHallImageUrl(String url) {
  if (url.isEmpty) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
  final base = AppConfig.backendUrl.replaceAll(RegExp(r'/$'), '');
  return '$base$url';
}

class AiBackendService {
  static Uri _uri(String path) => Uri.parse('${AppConfig.backendUrl}$path');

  static Future<Map<String, dynamic>> askPlanner(String prompt, {List<Map<String, dynamic>> history = const []}) async {
    final response = await http.post(
      _uri('/api/rag/chat'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'message': prompt,
        'prompt': prompt,
        'history': history,
      }),
    ).timeout(const Duration(seconds: 60));
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception('AI planner failed (${response.statusCode}): ${response.body}');
    }
    final decoded = jsonDecode(response.body);
    return decoded is Map<String, dynamic> ? decoded : {'reply': decoded.toString()};
  }

  static Future<Map<String, dynamic>> matchDecor(File image, {String style = '', String budget = ''}) async {
    final request = http.MultipartRequest('POST', _uri('/api/clip/match'));
    request.fields['style'] = style;
    request.fields['budget'] = budget;
    request.files.add(await http.MultipartFile.fromPath('image', image.path));
    final streamed = await request.send().timeout(const Duration(seconds: 90));
    final body = await streamed.stream.bytesToString();
    if (streamed.statusCode < 200 || streamed.statusCode >= 300) {
      throw Exception('Decor match failed (${streamed.statusCode}): $body');
    }
    final decoded = jsonDecode(body);
    return decoded is Map<String, dynamic> ? decoded : {'result': decoded};
  }

  static Future<Map<String, dynamic>> getBookingInfo(String bookingId) async {
    final response = await http.get(
      _uri('/api/twilio/booking-info?bookingId=$bookingId'),
    ).timeout(const Duration(seconds: 30));
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception('Booking info failed (${response.statusCode}): ${response.body}');
    }
    final decoded = jsonDecode(response.body);
    return decoded is Map<String, dynamic> ? decoded : {};
  }

  static Future<Map<String, dynamic>> initiateAiCall({
    required String bookingId,
    required String phoneNumber,
    String? customerName,
    Map<String, dynamic>? context,
  }) async {
    final response = await http.post(
      _uri('/api/twilio/initiate-call'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'bookingId': bookingId,
        'phoneNumber': phoneNumber,
        'customerName': customerName,
        'context': context ?? {},
      }),
    ).timeout(const Duration(seconds: 60));
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception('Call initiation failed (${response.statusCode}): ${response.body}');
    }
    final decoded = jsonDecode(response.body);
    return decoded is Map<String, dynamic> ? decoded : {'result': decoded};
  }
}

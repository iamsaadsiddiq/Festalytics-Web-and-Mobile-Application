import 'dart:io';
import '../../../../services/ai_backend_service.dart';

class DecorAIService {
  static Future<Map<String, dynamic>> matchDecorImage(File image, {String style = '', String budget = ''}) async {
    return AiBackendService.matchDecor(image, style: style, budget: budget);
  }

  static Future<List<Map<String, dynamic>>> extractMatches(Map<String, dynamic> result) async {
    final matches = result['matches'] as List<dynamic>? ?? [];
    return matches.map((m) => Map<String, dynamic>.from(m as Map)).toList();
  }

  static Map<String, dynamic> extractStyleInfo(Map<String, dynamic> result) {
    return {
      'style': result['style'] ?? result['predicted_style'] ?? 'Contemporary',
      'confidence': (result['confidence'] ?? 0).toDouble(),
      'color_palette': (result['color_palette'] as List<dynamic>?)?.map((c) => c.toString()).toList() ?? [],
      'tags': (result['tags'] as List<dynamic>?)?.map((t) => t.toString()).toList() ?? [],
    };
  }

  static String generatePrompt({required String style, String budget = '', String? occasion}) {
    final buffer = StringBuffer('Find decor vendors matching style: $style');
    if (budget.isNotEmpty) buffer.write(', budget: ₹$budget');
    if (occasion != null && occasion.isNotEmpty) buffer.write(', occasion: $occasion');
    return buffer.toString();
  }

  static Future<Map<String, dynamic>> reRankResults(Map<String, dynamic> result, {String preference = ''}) async {
    final matches = await extractMatches(result);
    if (preference.isEmpty || matches.isEmpty) return result;
    matches.sort((a, b) {
      final aScore = (a['score'] ?? 0).toDouble();
      final bScore = (b['score'] ?? 0).toDouble();
      return bScore.compareTo(aScore);
    });
    return {...result, 'matches': matches};
  }
}

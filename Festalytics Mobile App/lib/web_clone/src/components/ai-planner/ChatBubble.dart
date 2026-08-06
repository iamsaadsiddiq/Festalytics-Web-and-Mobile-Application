import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/widgets/markdown_message.dart';
import '../../../../services/ai_backend_service.dart' show resolveHallImageUrl;

class ChatBubbleWidget extends StatelessWidget {
  final String role;
  final String content;
  final List<Map<String, dynamic>>? halls;

  const ChatBubbleWidget({super.key, required this.role, required this.content, this.halls});

  @override
  Widget build(BuildContext context) {
    final mine = role == 'user';
    return Align(
      alignment: mine ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(14),
        constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * .88),
        decoration: BoxDecoration(
          color: mine ? AppColors.primary : Colors.white,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: mine ? AppColors.primary : AppColors.border),
        ),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          if (mine)
            Text(content, style: const TextStyle(color: Colors.white, height: 1.4, fontSize: 14))
          else ...[
            MarkdownMessage(text: content),
            if (halls != null && halls!.isNotEmpty) ...[
              const SizedBox(height: 12),
              const Divider(height: 1, color: AppColors.border),
              const SizedBox(height: 10),
              Text('Available venue photos', style: TextStyle(color: AppColors.muted, fontSize: 10, fontWeight: FontWeight.w800, letterSpacing: 1)),
              const SizedBox(height: 8),
              ...halls!.map((hall) => _hallCard(hall)),
            ],
          ],
        ]),
      ),
    );
  }

  Widget _hallCard(Map<String, dynamic> hall) {
    final images = (hall['images'] as List<dynamic>?) ?? [];
    if (images.isEmpty) return const SizedBox.shrink();
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(color: Colors.grey.shade50, borderRadius: BorderRadius.circular(16), border: Border.all(color: Colors.grey.shade200)),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Expanded(child: Text(hall['name']?.toString() ?? '', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 13))),
          if (hall['rating'] != null) Container(padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2), decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(99), border: Border.all(color: Colors.grey.shade200)), child: Text('Rating ${hall['rating']}', style: const TextStyle(fontSize: 9, fontWeight: FontWeight.w800))),
        ]),
        const SizedBox(height: 6),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 3, crossAxisSpacing: 6, mainAxisSpacing: 6, childAspectRatio: 1.3),
          itemCount: images.length > 3 ? 3 : images.length,
          itemBuilder: (_, i) {
            final img = images[i];
            final url = resolveHallImageUrl(img is Map ? (img['url']?.toString() ?? '') : img.toString());
            if (url.isEmpty) return const SizedBox.shrink();
            return ClipRRect(
              borderRadius: BorderRadius.circular(10),
              child: Image.network(url, fit: BoxFit.cover, errorBuilder: (_, __, ___) => Container(color: Colors.grey.shade200, child: const Icon(Icons.image, color: Colors.grey))),
            );
          },
        ),
      ]),
    );
  }
}

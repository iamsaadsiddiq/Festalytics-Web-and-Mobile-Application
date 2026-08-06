import 'dart:convert';
import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';

class AnalysisResultWidget extends StatelessWidget {
  final Map<String, dynamic> result;
  final VoidCallback? onVendorTap;

  const AnalysisResultWidget({super.key, required this.result, this.onVendorTap});

  @override
  Widget build(BuildContext context) {
    final error = result['error']?.toString();
    if (error != null) {
      return Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(color: AppColors.danger.withValues(alpha: .08), borderRadius: BorderRadius.circular(22), border: Border.all(color: AppColors.danger.withValues(alpha: .3))),
        child: Row(children: [
          const Icon(Icons.error_outline, color: AppColors.danger),
          const SizedBox(width: 10),
          Expanded(child: Text(error, style: const TextStyle(color: AppColors.danger))),
        ]),
      );
    }

    if (result['rejected'] == true) {
      final subject = result['subject']?.toString() ?? 'this image';
      final detail = result['detail']?.toString() ?? 'The image is not relevant to hall interiors.';
      final label = result['validation_label']?.toString() ?? '';
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.all(16),
        margin: const EdgeInsets.only(bottom: 12),
        decoration: BoxDecoration(color: AppColors.warning.withValues(alpha: .08), borderRadius: BorderRadius.circular(22), border: Border.all(color: AppColors.warning.withValues(alpha: .3))),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Icon(Icons.warning_amber_rounded, color: AppColors.warning),
            const SizedBox(width: 10),
            Expanded(child: Text('This is a picture of $subject.', style: const TextStyle(color: AppColors.warning, fontWeight: FontWeight.w800))),
          ]),
          const SizedBox(height: 6),
          Padding(
            padding: const EdgeInsets.only(left: 34),
            child: Text(detail, style: const TextStyle(color: AppColors.warning, fontSize: 13)),
          ),
          if (label.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(left: 34, top: 4),
              child: Text(label, style: const TextStyle(color: AppColors.warning, fontWeight: FontWeight.w700, fontSize: 12)),
            ),
        ]),
      );
    }

    final message = result['message']?.toString() ?? result['analysis']?.toString() ?? '';
    if (message.isNotEmpty) {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.all(16),
        margin: const EdgeInsets.only(bottom: 12),
        decoration: BoxDecoration(color: AppColors.warning.withValues(alpha: .08), borderRadius: BorderRadius.circular(22), border: Border.all(color: AppColors.warning.withValues(alpha: .3))),
        child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Icon(Icons.info_outline, color: AppColors.warning),
          const SizedBox(width: 10),
          Expanded(child: Text(message, style: const TextStyle(color: AppColors.warning))),
        ]),
      );
    }

    final results = result['results'] as List<dynamic>? ?? [];
    if (results.isEmpty && result['matches'] == null) {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(color: Colors.grey.shade50, borderRadius: BorderRadius.circular(22), border: Border.all(color: AppColors.border)),
        child: Column(children: [
          const Icon(Icons.image_search, size: 48, color: AppColors.muted),
          const SizedBox(height: 12),
          const Text('No matching halls found', style: TextStyle(fontWeight: FontWeight.w800)),
          const SizedBox(height: 4),
          const Text('Try uploading a different image of a hall interior.', style: TextStyle(color: AppColors.muted, fontSize: 13)),
        ]),
      );
    }
    final style = result['style']?.toString() ?? result['predicted_style']?.toString() ?? '';
    final confidence = (result['confidence'] ?? 0).toDouble();
    final palette = result['color_palette'] as List<dynamic>? ?? [];
    final tags = result['tags'] as List<dynamic>? ?? [];
    final topMatch = result['top_match'] as Map<String, dynamic>?;
    final totalHalls = result['total_halls'] ?? 0;

    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      if (topMatch != null)
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(16),
          margin: const EdgeInsets.only(bottom: 12),
          decoration: BoxDecoration(
            gradient: LinearGradient(colors: [AppColors.primary.withValues(alpha: .1), AppColors.secondary.withValues(alpha: .1)]),
            borderRadius: BorderRadius.circular(22),
            border: Border.all(color: AppColors.primary.withValues(alpha: .3)),
          ),
          child: Column(children: [
            Text('TOP MATCH', style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.w900, fontSize: 10, letterSpacing: 2)),
            const SizedBox(height: 4),
            Text(topMatch['hall_name']?.toString() ?? '', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 18)),
            if (topMatch['similarity'] != null)
              Container(
                margin: const EdgeInsets.only(top: 4),
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(99), border: Border.all(color: AppColors.primary.withValues(alpha: .3))),
                child: Text('${topMatch['similarity']}% match', style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.w800, fontSize: 12)),
              ),
          ]),
        ),

      if (style.isNotEmpty)
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(14),
          margin: const EdgeInsets.only(bottom: 12),
          decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(22), border: Border.all(color: AppColors.border)),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              const Icon(Icons.auto_awesome, color: AppColors.accent, size: 18),
              const SizedBox(width: 8),
              Text('Detected: $style', style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15)),
              const Spacer(),
              if (confidence > 0)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(color: AppColors.success.withValues(alpha: .12), borderRadius: BorderRadius.circular(99)),
                  child: Text('${(confidence * 100).toStringAsFixed(0)}%', style: const TextStyle(color: AppColors.success, fontSize: 11, fontWeight: FontWeight.w800)),
                ),
            ]),
            if (palette.isNotEmpty) ...[
              const SizedBox(height: 10),
              Wrap(spacing: 6, runSpacing: 6, children: palette.map((c) {
                Color color;
                try {
                  color = Color(int.parse(c.toString().replaceFirst('#', '0xFF')));
                } catch (_) {
                  color = Colors.grey;
                }
                return Container(width: 26, height: 26, decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(8), border: Border.all(color: AppColors.border)));
              }).toList()),
            ],
            if (tags.isNotEmpty) ...[
              const SizedBox(height: 8),
              Wrap(spacing: 6, runSpacing: 4, children: tags.map((t) => Container(padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3), decoration: BoxDecoration(color: AppColors.secondary, borderRadius: BorderRadius.circular(99)), child: Text(t.toString(), style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600)))).toList()),
            ],
          ]),
        ),

      if (results.isNotEmpty) ...[
        const SizedBox(height: 8),
        Row(children: [
          Text('Ranked Results', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800)),
          const Spacer(),
          Text('$totalHalls halls', style: TextStyle(color: AppColors.muted, fontSize: 12)),
        ]),
        const SizedBox(height: 8),
        ...results.asMap().entries.map((entry) {
          final item = entry.value is Map ? Map<String, dynamic>.from(entry.value as Map) : <String, dynamic>{};
          final rank = item['rank'] ?? (entry.key + 1);
          final hallName = item['hall_name']?.toString() ?? item['name']?.toString() ?? 'Hall $rank';
          final simScore = item['similarity']?.toString() ?? '';
          final images = item['images'] as List<dynamic>? ?? [];
          return Container(
            width: double.infinity,
            margin: const EdgeInsets.only(bottom: 10),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(18), border: Border.all(color: AppColors.border)),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [
                Container(width: 24, height: 24, decoration: BoxDecoration(color: AppColors.primary, borderRadius: BorderRadius.circular(99)), alignment: Alignment.center,
                  child: Text('$rank', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 12))),
                const SizedBox(width: 8),
                Expanded(child: Text(hallName, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14))),
                if (simScore.isNotEmpty)
                  Container(padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2), decoration: BoxDecoration(color: Colors.grey.shade100, borderRadius: BorderRadius.circular(99)),
                    child: Text('$simScore%', style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 11))),
              ]),
              if (images.isNotEmpty) ...[
                const SizedBox(height: 8),
                SizedBox(
                  height: 72,
                  child: ListView.separated(
                    scrollDirection: Axis.horizontal,
                    itemCount: images.length > 4 ? 4 : images.length,
                    separatorBuilder: (_, __) => const SizedBox(width: 6),
                    itemBuilder: (_, i) {
                      final imgStr = images[i].toString();
                      Widget imageWidget;
                      if (imgStr.startsWith('data:')) {
                        try {
                          final b64 = imgStr.contains(',') ? imgStr.split(',').last : imgStr;
                          final decoded = base64Decode(b64);
                          imageWidget = Image.memory(decoded, fit: BoxFit.cover, errorBuilder: (_, __, ___) => _imagePlaceholder());
                        } catch (_) {
                          imageWidget = _imagePlaceholder();
                        }
                      } else if (imgStr.startsWith('http://') || imgStr.startsWith('https://')) {
                        imageWidget = Image.network(imgStr, fit: BoxFit.cover, errorBuilder: (_, __, ___) => _imagePlaceholder());
                      } else {
                        try {
                          final decoded = base64Decode(imgStr.replaceAll(RegExp(r'\s'), ''));
                          imageWidget = Image.memory(decoded, fit: BoxFit.cover, errorBuilder: (_, __, ___) => _imagePlaceholder());
                        } catch (_) {
                          imageWidget = _imagePlaceholder();
                        }
                      }
                      return ClipRRect(
                        borderRadius: BorderRadius.circular(10),
                        child: SizedBox(width: 72, height: 72, child: imageWidget),
                      );
                    },
                  ),
                ),
              ],
            ]),
          );
        }),
      ],
    ]);
  }

  Widget _imagePlaceholder() => Container(color: Colors.grey.shade200, child: const Icon(Icons.image, color: Colors.grey));
}

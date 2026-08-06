import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';

class DecorAnalysisCardWidget extends StatelessWidget {
  final Map<String, dynamic> analysis;
  final VoidCallback? onTap;

  const DecorAnalysisCardWidget({super.key, required this.analysis, this.onTap});

  @override
  Widget build(BuildContext context) {
    final style = analysis['style']?.toString() ?? 'Contemporary';
    final confidence = (analysis['confidence'] ?? 0).toDouble();
    final palette = analysis['color_palette'] as List<dynamic>? ?? [];
    final tags = analysis['tags'] as List<dynamic>? ?? [];

    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: AppColors.border),
          boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 18, offset: const Offset(0, 8))],
        ),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            const Icon(Icons.auto_awesome, color: AppColors.accent, size: 20),
            const SizedBox(width: 8),
            Text('Decor Analysis', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800)),
            const Spacer(),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(color: AppColors.success.withValues(alpha: .12), borderRadius: BorderRadius.circular(99)),
              child: Text('${(confidence * 100).toStringAsFixed(0)}% match', style: const TextStyle(color: AppColors.success, fontSize: 12, fontWeight: FontWeight.w800)),
            ),
          ]),
          const SizedBox(height: 12),
          Row(children: [
            const Icon(Icons.palette_outlined, size: 16, color: AppColors.muted),
            const SizedBox(width: 6),
            Text('Style: $style', style: const TextStyle(fontWeight: FontWeight.w600)),
          ]),
          if (palette.isNotEmpty) ...[
            const SizedBox(height: 10),
            Wrap(spacing: 6, runSpacing: 6, children: palette.map((c) => Container(width: 28, height: 28, decoration: BoxDecoration(color: Color(int.parse(c.toString().replaceFirst('#', '0xFF'))), borderRadius: BorderRadius.circular(8), border: Border.all(color: AppColors.border)))).toList()),
          ],
          if (tags.isNotEmpty) ...[
            const SizedBox(height: 10),
            Wrap(spacing: 6, runSpacing: 4, children: tags.map((t) => Container(padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4), decoration: BoxDecoration(color: AppColors.secondary, borderRadius: BorderRadius.circular(99)), child: Text(t.toString(), style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)))).toList()),
          ],
        ]),
      ),
    );
  }
}

import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';

class LoaderWidget extends StatelessWidget {
  final String? label;
  final double size;

  const LoaderWidget({super.key, this.label, this.size = 40});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        SizedBox(
          width: size,
          height: size,
          child: CircularProgressIndicator(strokeWidth: size / 10, color: AppColors.primary),
        ),
        if (label != null) ...[
          const SizedBox(height: 14),
          Text(label!, style: const TextStyle(color: AppColors.muted, fontWeight: FontWeight.w600, fontSize: 14)),
          const SizedBox(height: 4),
          const SizedBox(
            width: 120,
            child: LinearProgressIndicator(backgroundColor: AppColors.border, color: AppColors.primary, minHeight: 3),
          ),
        ],
      ]),
    );
  }
}

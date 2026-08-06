import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';

class MoodboardButtonWidget extends StatelessWidget {
  final VoidCallback onTap;
  final bool compact;

  const MoodboardButtonWidget({super.key, required this.onTap, this.compact = false});

  @override
  Widget build(BuildContext context) {
    if (compact) {
      return IconButton.filled(
        onPressed: onTap,
        icon: const Icon(Icons.dashboard_customize, size: 20),
        style: IconButton.styleFrom(backgroundColor: AppColors.accent, foregroundColor: Colors.white),
      );
    }

    return SizedBox(
      width: double.infinity,
      child: ElevatedButton.icon(
        onPressed: onTap,
        icon: const Icon(Icons.dashboard_customize_outlined),
        label: const Text('Create Moodboard'),
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.accent,
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(vertical: 16),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(22)),
        ),
      ),
    );
  }
}

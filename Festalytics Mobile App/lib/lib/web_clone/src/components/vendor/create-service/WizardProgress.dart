import 'package:flutter/material.dart';
import '../../../../../core/theme/app_theme.dart';

class WizardProgress extends StatelessWidget {
  final int currentStep;
  final int totalSteps;
  final List<String> labels;
  const WizardProgress({super.key, required this.currentStep, required this.totalSteps, this.labels = const []});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: List.generate(totalSteps, (i) {
        final completed = i < currentStep;
        final active = i == currentStep;
        return Expanded(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 2),
            child: Column(
              children: [
                Row(children: [
                  Expanded(
                    child: Container(
                      height: 4,
                      decoration: BoxDecoration(
                        color: completed || active ? AppColors.primary : AppColors.border,
                        borderRadius: BorderRadius.circular(99),
                      ),
                    ),
                  ),
                ]),
                const SizedBox(height: 6),
                Text(
                  i < labels.length ? labels[i] : 'Step ${i + 1}',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: active ? FontWeight.w800 : FontWeight.w500,
                    color: active ? AppColors.primary : (completed ? AppColors.success : AppColors.muted),
                  ),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
        );
      }),
    );
  }
}

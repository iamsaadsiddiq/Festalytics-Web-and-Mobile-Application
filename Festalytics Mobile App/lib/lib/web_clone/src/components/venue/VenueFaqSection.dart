import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';

class VenueFaqSection extends StatefulWidget {
  final List<dynamic> faqs;

  const VenueFaqSection({super.key, required this.faqs});

  @override
  State<VenueFaqSection> createState() => _VenueFaqSectionState();
}

class _VenueFaqSectionState extends State<VenueFaqSection> {
  final Set<int> _open = {};

  @override
  Widget build(BuildContext context) {
    if (widget.faqs.isEmpty) {
      return const Padding(
        padding: EdgeInsets.all(16),
        child: Text(
          'No FAQs available.',
          style: TextStyle(color: AppColors.muted),
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Padding(
          padding: EdgeInsets.only(bottom: 12),
          child: Text(
            'Frequently Asked Questions',
            style: TextStyle(fontWeight: FontWeight.w800, fontSize: 18),
          ),
        ),
        ...List.generate(widget.faqs.length, (i) {
          final faq = widget.faqs[i];
          if (faq is! Map) return const SizedBox.shrink();
          final question = faq['question']?.toString() ?? '';
          final answer = faq['answer']?.toString() ?? '';
          final active = faq['active'] ?? true;
          if (active == false) return const SizedBox.shrink();

          final isOpen = _open.contains(i);
          return Container(
            margin: const EdgeInsets.only(bottom: 8),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.border),
            ),
            child: Column(
              children: [
                InkWell(
                  borderRadius: BorderRadius.circular(16),
                  onTap: () {
                    setState(() {
                      if (isOpen) {
                        _open.remove(i);
                      } else {
                        _open.add(i);
                      }
                    });
                  },
                  child: Padding(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 16, vertical: 14),
                    child: Row(
                      children: [
                        Expanded(
                          child: Text(
                            question,
                            style: const TextStyle(
                              fontWeight: FontWeight.w700,
                              fontSize: 14,
                            ),
                          ),
                        ),
                        Icon(
                          isOpen
                              ? Icons.keyboard_arrow_up
                              : Icons.keyboard_arrow_down,
                          color: AppColors.muted,
                        ),
                      ],
                    ),
                  ),
                ),
                AnimatedCrossFade(
                  firstChild: const SizedBox(width: double.infinity),
                  secondChild: Padding(
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 14),
                    child: Text(
                      answer,
                      style: const TextStyle(
                        color: AppColors.muted,
                        height: 1.5,
                        fontSize: 13,
                      ),
                    ),
                  ),
                  crossFadeState: isOpen
                      ? CrossFadeState.showSecond
                      : CrossFadeState.showFirst,
                  duration: const Duration(milliseconds: 200),
                ),
              ],
            ),
          );
        }),
      ],
    );
  }
}

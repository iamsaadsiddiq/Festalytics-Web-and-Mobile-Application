import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';

class Pagination extends StatelessWidget {
  final int currentPage;
  final int totalPages;
  final ValueChanged<int> onPageChanged;
  const Pagination({super.key, required this.currentPage, required this.totalPages, required this.onPageChanged});

  @override
  Widget build(BuildContext context) {
    if (totalPages <= 1) return const SizedBox.shrink();
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        IconButton(
          icon: const Icon(Icons.chevron_left),
          onPressed: currentPage > 0 ? () => onPageChanged(currentPage - 1) : null,
          style: IconButton.styleFrom(shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12), side: BorderSide(color: AppColors.border))),
        ),
        const SizedBox(width: 8),
        ...List.generate(totalPages > 5 ? 5 : totalPages, (i) {
          final page = currentPage <= 2 ? i : (currentPage + i - 2).clamp(0, totalPages - 1);
          final active = page == currentPage;
          return Padding(
            padding: const EdgeInsets.symmetric(horizontal: 3),
            child: Material(
              color: active ? AppColors.primary : Colors.white,
              borderRadius: BorderRadius.circular(10),
              child: InkWell(
                borderRadius: BorderRadius.circular(10),
                onTap: () => onPageChanged(page),
                child: Container(
                  width: 38, height: 38,
                  alignment: Alignment.center,
                  child: Text('${page + 1}', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14, color: active ? Colors.white : AppColors.text)),
                ),
              ),
            ),
          );
        }),
        const SizedBox(width: 8),
        IconButton(
          icon: const Icon(Icons.chevron_right),
          onPressed: currentPage < totalPages - 1 ? () => onPageChanged(currentPage + 1) : null,
          style: IconButton.styleFrom(shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12), side: BorderSide(color: AppColors.border))),
        ),
      ],
    );
  }
}

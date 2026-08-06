import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';

class ServiceFilters extends StatelessWidget {
  final String? selectedCategory;
  final ValueChanged<String?> onChanged;
  final List<Map<String, String>> categories;
  const ServiceFilters({super.key, this.selectedCategory, required this.onChanged, required this.categories});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: 18),
      child: Row(
        children: [
          _chip('All', null, selectedCategory == null),
          ...categories.map((c) => _chip(c['label'] ?? c['id'] ?? '', c['id'], selectedCategory == c['id'])),
        ],
      ),
    );
  }

  Widget _chip(String label, String? value, bool selected) {
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: FilterChip(
        label: Text(label, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: selected ? Colors.white : AppColors.text)),
        selected: selected,
        onSelected: (_) => onChanged(value),
        selectedColor: AppColors.primary,
        checkmarkColor: Colors.white,
        backgroundColor: Colors.white,
        side: BorderSide(color: selected ? AppColors.primary : AppColors.border),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(99)),
        padding: const EdgeInsets.symmetric(horizontal: 4),
      ),
    );
  }
}

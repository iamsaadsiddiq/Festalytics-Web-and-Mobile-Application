import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';

class DecorVendorCardWidget extends StatelessWidget {
  final Map<String, dynamic> vendor;
  final double matchScore;
  final VoidCallback? onTap;

  const DecorVendorCardWidget({super.key, required this.vendor, this.matchScore = 0, this.onTap});

  @override
  Widget build(BuildContext context) {
    final name = vendor['name']?.toString() ?? vendor['hall_name']?.toString() ?? 'Vendor';
    final description = vendor['description']?.toString() ?? vendor['details']?.toString() ?? '';
    final imageUrl = vendor['image']?.toString() ?? vendor['image_url']?.toString() ?? '';
    final location = vendor['location']?.toString() ?? vendor['area']?.toString() ?? '';
    final price = vendor['price']?.toString() ?? vendor['estimated_cost']?.toString() ?? '';

    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: double.infinity,
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(22),
          border: Border.all(color: AppColors.border),
          boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 14, offset: const Offset(0, 6))],
        ),
        child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Container(
            width: 72,
            height: 72,
            decoration: BoxDecoration(
              color: AppColors.secondary,
              borderRadius: BorderRadius.circular(16),
              image: imageUrl.isNotEmpty ? DecorationImage(image: NetworkImage(imageUrl), fit: BoxFit.cover) : null,
            ),
            child: imageUrl.isEmpty ? const Icon(Icons.inventory_2_outlined, color: AppColors.primary, size: 32) : null,
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(name, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15)),
              if (description.isNotEmpty) ...[
                const SizedBox(height: 3),
                Text(description, style: const TextStyle(color: AppColors.muted, fontSize: 12), maxLines: 2, overflow: TextOverflow.ellipsis),
              ],
              const SizedBox(height: 4),
              Row(children: [
                if (location.isNotEmpty) ...[
                  const Icon(Icons.location_on_outlined, size: 14, color: AppColors.muted),
                  const SizedBox(width: 4),
                  Expanded(child: Text(location, style: const TextStyle(color: AppColors.muted, fontSize: 12), maxLines: 1, overflow: TextOverflow.ellipsis)),
                ],
                if (matchScore > 0) ...[
                  const Spacer(),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(color: AppColors.success.withValues(alpha: .12), borderRadius: BorderRadius.circular(99)),
                    child: Text('${(matchScore * 100).toStringAsFixed(0)}% match', style: const TextStyle(color: AppColors.success, fontSize: 11, fontWeight: FontWeight.w800)),
                  ),
                ],
              ]),
              if (price.isNotEmpty) ...[
                const SizedBox(height: 4),
                Text('₹$price', style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.w800, fontSize: 14)),
              ],
            ]),
          ),
          const Icon(Icons.chevron_right, color: AppColors.muted),
        ]),
      ),
    );
  }
}

import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../models/venue.dart';

class VendorCardWidget extends StatelessWidget {
  final Venue venue;
  final double matchScore;
  final VoidCallback? onTap;

  const VendorCardWidget({super.key, required this.venue, this.matchScore = 0, this.onTap});

  @override
  Widget build(BuildContext context) {
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
              image: venue.images.isNotEmpty
                  ? DecorationImage(image: NetworkImage(venue.images.first.toString()), fit: BoxFit.cover)
                  : null,
            ),
            child: venue.images.isEmpty ? const Icon(Icons.business, color: AppColors.primary, size: 32) : null,
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(venue.hallName.isNotEmpty ? venue.hallName : venue.name, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15)),
              const SizedBox(height: 3),
              Row(children: [
                const Icon(Icons.location_on_outlined, size: 14, color: AppColors.muted),
                const SizedBox(width: 4),
                Expanded(child: Text('${venue.city}, ${venue.streetAddress}', style: const TextStyle(color: AppColors.muted, fontSize: 12), maxLines: 1, overflow: TextOverflow.ellipsis)),
              ]),
              const SizedBox(height: 4),
              Row(children: [
                const Icon(Icons.people_outline, size: 14, color: AppColors.muted),
                const SizedBox(width: 4),
                Text('${venue.capacity} guests', style: const TextStyle(color: AppColors.muted, fontSize: 12)),
                if (matchScore > 0) ...[
                  const Spacer(),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(color: AppColors.success.withValues(alpha: .12), borderRadius: BorderRadius.circular(99)),
                    child: Text('${(matchScore * 100).toStringAsFixed(0)}%', style: const TextStyle(color: AppColors.success, fontSize: 11, fontWeight: FontWeight.w800)),
                  ),
                ],
              ]),
            ]),
          ),
          const Icon(Icons.chevron_right, color: AppColors.muted),
        ]),
      ),
    );
  }
}

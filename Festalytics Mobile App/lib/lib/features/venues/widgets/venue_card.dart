import 'package:flutter/material.dart';
import '../../../core/routes/app_routes.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/widgets/app_widgets.dart';
import '../../../models/venue.dart';

class VenueCard extends StatelessWidget {
  final Venue venue;
  final bool compact;
  const VenueCard({super.key, required this.venue, this.compact = false});

  String get _image {
    if (venue.images.isNotEmpty) {
      final first = venue.images.first;
      if (first is Map && first['url'] != null) return first['url'].toString();
      return first.toString();
    }
    return 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&q=80';
  }

  @override
  Widget build(BuildContext context) {
    return CandyCard(
      padding: EdgeInsets.zero,
      onTap: () => Navigator.pushNamed(context, AppRoutes.venue, arguments: venue.id),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        ClipRRect(
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
          child: AspectRatio(
            aspectRatio: compact ? 2.2 : 1.8,
            child: Image.network(_image, fit: BoxFit.cover, errorBuilder: (_, __, ___) => Container(color: AppColors.secondary, child: const Icon(Icons.image, color: AppColors.primary, size: 42))),
          ),
        ),
        Padding(
          padding: const EdgeInsets.all(14),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Expanded(child: Text(venue.name.isNotEmpty ? venue.name : cleanTitle(venue.id), style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w900))),
              if (venue.serviceActive) const StatusChip('Active'),
            ]),
            const SizedBox(height: 6),
            Row(children: [const Icon(Icons.location_on_outlined, size: 16, color: AppColors.muted), const SizedBox(width: 4), Expanded(child: Text(venue.city.isNotEmpty ? venue.city : venue.profile.area, style: const TextStyle(color: AppColors.muted)))]),
            const SizedBox(height: 8),
            Wrap(spacing: 8, runSpacing: 8, children: [
              _pill(Icons.groups_outlined, '${venue.capacity} guests'),
              _pill(Icons.payments_outlined, formatMoney(venue.pricing.hallRent)),
              if (venue.venueType.isNotEmpty) _pill(Icons.category_outlined, venue.venueType),
            ]),
          ]),
        ),
      ]),
    );
  }

  Widget _pill(IconData icon, String label) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 6),
    decoration: BoxDecoration(color: AppColors.background, borderRadius: BorderRadius.circular(99)),
    child: Row(mainAxisSize: MainAxisSize.min, children: [Icon(icon, size: 14, color: AppColors.primary), const SizedBox(width: 4), Text(label, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700))]),
  );
}

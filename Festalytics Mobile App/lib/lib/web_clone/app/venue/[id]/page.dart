// Auto-generated mobile mirror for web source: app/venue/[id]/page.jsx
// Web lines: 8. This file is kept to preserve the web project structure in Flutter.
import 'package:flutter/material.dart';
import '../../../../features/venues/venue_details_screen.dart';

class WebCloneAppVenueIdPage extends StatelessWidget {
  const WebCloneAppVenueIdPage({super.key});
  @override
  Widget build(BuildContext context) {
    final venueId = ModalRoute.of(context)?.settings.arguments as String? ?? '';
    return VenueDetailsScreen(venueId: venueId);
  }
}

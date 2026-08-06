import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/widgets/app_widgets.dart';
import '../../providers/app_auth_provider.dart' as app;
import '../../web_clone/src/components/vendor/availability/VenueAvailabilityCalendar.dart';

class VendorAvailabilityScreen extends StatelessWidget {
  const VendorAvailabilityScreen({super.key});
  @override
  Widget build(BuildContext context) {
    final venueId = context.watch<app.AppAuthProvider>().currentUser?.venueId ?? '';
    return Scaffold(
      appBar: AppBar(title: const Text('Availability Calendar')),
      body: venueId.isEmpty
          ? const EmptyState(icon: Icons.calendar_month, title: 'No venue linked', subtitle: 'Calendar requires a venue.')
          : VenueAvailabilityCalendar(venueId: venueId),
    );
  }
}

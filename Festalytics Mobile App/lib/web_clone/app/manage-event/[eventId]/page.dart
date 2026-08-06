// Auto-generated mobile mirror for web source: app/manage-event/[eventId]/page.jsx
// Web lines: 13. This file is kept to preserve the web project structure in Flutter.
import 'package:flutter/material.dart';
import '../../../../features/events/manage_event_screen.dart';

class WebCloneAppManageEventEventIdPage extends StatelessWidget {
  const WebCloneAppManageEventEventIdPage({super.key});
  @override
  Widget build(BuildContext context) {
    final eventId = ModalRoute.of(context)?.settings.arguments as String? ?? '';
    return ManageEventScreen(eventId: eventId);
  }
}

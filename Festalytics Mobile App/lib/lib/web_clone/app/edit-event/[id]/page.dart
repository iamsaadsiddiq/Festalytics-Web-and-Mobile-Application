// Auto-generated mobile mirror for web source: app/edit-event/[id]/page.jsx
// Web lines: 13. This file is kept to preserve the web project structure in Flutter.
import 'package:flutter/material.dart';
import '../../../../features/events/create_event_screen.dart';

class WebCloneAppEditEventIdPage extends StatelessWidget {
  const WebCloneAppEditEventIdPage({super.key});
  @override
  Widget build(BuildContext context) {
    final eventId = ModalRoute.of(context)?.settings.arguments as String?;
    return CreateEventScreen(eventId: eventId);
  }
}

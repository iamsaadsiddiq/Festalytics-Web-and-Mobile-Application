import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../providers/app_auth_provider.dart' as app;
import '../../../features/public/landing_screen.dart';
import '../../src/components/ai-planner/AIPlanner.dart';

class WebCloneAppAiPlannerPage extends StatelessWidget {
  const WebCloneAppAiPlannerPage({super.key});
  @override
  Widget build(BuildContext context) {
    final auth = context.watch<app.AppAuthProvider>();
    if (!auth.isLoggedIn) return const LandingScreen();
    return Scaffold(
      appBar: AppBar(title: const Text('AI Event Planner')),
      body: const AIPlannerWidget(),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/app_auth_provider.dart' as app;
import '../../core/widgets/app_widgets.dart';
import '../public/landing_screen.dart';
import '../user/user_dashboard_screen.dart';
import '../vendor/vendor_shell.dart';
import '../vendor/vendor_dashboard_screen.dart';
import '../../web_clone/src/components/ProtectedRoute.dart' as wc;

class AuthGate extends StatelessWidget {
  const AuthGate({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<app.AppAuthProvider>();
    if (auth.isLoading) return const Scaffold(body: LoadingView(label: 'Loading Festalytics...'));
    if (!auth.isLoggedIn) return const LandingScreen();
    return const wc.ProtectedRoute(
      child: _GateContent(),
    );
  }
}

class _GateContent extends StatelessWidget {
  const _GateContent();
  @override
  Widget build(BuildContext context) {
    final auth = context.watch<app.AppAuthProvider>();
    if (auth.isVendor) return const VendorShell(child: VendorDashboardScreen());
    return const UserDashboardScreen();
  }
}

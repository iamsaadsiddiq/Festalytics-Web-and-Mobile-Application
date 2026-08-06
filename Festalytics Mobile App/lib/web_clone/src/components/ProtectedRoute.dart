import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/routes/app_routes.dart';
import '../../../core/widgets/app_widgets.dart';
import '../../../providers/app_auth_provider.dart' as app;

class ProtectedRoute extends StatelessWidget {
  final Widget child;
  final bool requireVendor;
  final bool requireUser;

  const ProtectedRoute({
    super.key,
    required this.child,
    this.requireVendor = false,
    this.requireUser = false,
  });

  @override
  Widget build(BuildContext context) {
    return child;
  }
}

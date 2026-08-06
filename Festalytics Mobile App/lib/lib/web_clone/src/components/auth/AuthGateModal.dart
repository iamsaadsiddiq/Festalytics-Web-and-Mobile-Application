import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../../core/routes/app_routes.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/widgets/app_widgets.dart';
import '../../../../providers/app_auth_provider.dart' as app;
import 'AuthGateLoginForm.dart';

class AuthGateModal extends StatefulWidget {
  final Widget child;
  const AuthGateModal({super.key, required this.child});

  @override
  State<AuthGateModal> createState() => _AuthGateModalState();
}

class _AuthGateModalState extends State<AuthGateModal> {
  Future<void> _handleSuccess() async {
    if (!mounted) return;
    await context.read<app.AppAuthProvider>().refresh();
    final auth = context.read<app.AppAuthProvider>();
    final route = auth.isVendor ? AppRoutes.vendorDashboard : AppRoutes.userDashboard;
    Navigator.pushNamedAndRemoveUntil(context, route, (_) => false);
  }

  void _showGate() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _GateSheet(onSuccess: _handleSuccess),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<app.AppAuthProvider>(
      builder: (context, auth, _) {
        if (auth.isLoading) return const LoadingView();
        if (auth.isLoggedIn) return widget.child;
        return GestureDetector(
          onTap: _showGate,
          child: widget.child,
        );
      },
    );
  }
}

class _GateSheet extends StatefulWidget {
  final VoidCallback onSuccess;
  const _GateSheet({required this.onSuccess});

  @override
  State<_GateSheet> createState() => _GateSheetState();
}

class _GateSheetState extends State<_GateSheet> {
  int _tab = 0;
  final bool _busy = false;

  Future<void> _handleSignup() async {
    Navigator.pop(context);
    await Navigator.pushNamed(context, AppRoutes.signup);
    if (FirebaseAuth.instance.currentUser != null) widget.onSuccess();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.85,
      decoration: const BoxDecoration(
        color: Color(0xFF080808),
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(22),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 5,
                margin: const EdgeInsets.only(bottom: 16),
                decoration: BoxDecoration(
                  color: Colors.white24,
                  borderRadius: BorderRadius.circular(99),
                ),
              ),
            ),
            Text(
              'Join Festalytics',
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.w900,
                    color: Colors.white,
                  ),
            ),
            const SizedBox(height: 4),
            const Text(
              'Sign in to continue',
              style: TextStyle(color: Colors.white60),
            ),
            const SizedBox(height: 20),
            Container(
              padding: const EdgeInsets.all(4),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: .06),
                borderRadius: BorderRadius.circular(18),
              ),
              child: Row(
                children: [
                  _tabBtn('Login', 0),
                  _tabBtn('Sign Up', 1),
                ],
              ),
            ),
            const SizedBox(height: 20),
            if (_tab == 0)
              AuthGateLoginForm(onSuccess: widget.onSuccess)
            else
              _signupForm(),
          ],
        ),
      ),
    );
  }

  Widget _tabBtn(String label, int idx) {
    final active = _tab == idx;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _tab = idx),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            color: active ? Colors.white : Colors.transparent,
            borderRadius: BorderRadius.circular(15),
          ),
          child: Text(
            label,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontWeight: FontWeight.w800,
              color: active ? AppColors.primary : Colors.white54,
            ),
          ),
        ),
      ),
    );
  }

  Widget _signupForm() {
    return Column(
      children: [
        _field('Full Name'),
        const SizedBox(height: 10),
        _field('Email'),
        const SizedBox(height: 10),
        _field('Mobile'),
        const SizedBox(height: 10),
        _field('Password', obscure: true),
        const SizedBox(height: 10),
        _field('Confirm Password', obscure: true),
        const SizedBox(height: 18),
        SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            onPressed: _busy ? null : _handleSignup,
            child: _busy
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                        strokeWidth: 2, color: Colors.white),
                  )
                : const Text('Create Account'),
          ),
        ),
      ],
    );
  }

  Widget _field(String label, {bool obscure = false}) {
    return TextField(
      obscureText: obscure,
      style: const TextStyle(color: Colors.white),
      decoration: InputDecoration(
        labelText: label,
        filled: true,
        fillColor: Colors.white.withValues(alpha: .06),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide.none,
        ),
      ),
    );
  }
}

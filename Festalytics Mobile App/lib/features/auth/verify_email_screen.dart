import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import '../../core/routes/app_routes.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/app_widgets.dart';
import '../../services/users_service.dart';
import '../../services/venues_service.dart';

class VerifyEmailScreen extends StatefulWidget {
  const VerifyEmailScreen({super.key});
  @override
  State<VerifyEmailScreen> createState() => _VerifyEmailScreenState();
}

class _VerifyEmailScreenState extends State<VerifyEmailScreen> {
  bool _busy = false;
  String _message = '';

  Future<void> _check() async {
    setState(() => _busy = true);
    try {
      final user = FirebaseAuth.instance.currentUser;
      await user?.reload();
      final fresh = FirebaseAuth.instance.currentUser;
      if (fresh?.emailVerified == true) {
        final userRef = FirebaseFirestore.instance.collection('users').doc(fresh!.uid);
        final userSnap = await userRef.get();
        final userData = userSnap.data() ?? <String, dynamic>{};

        await userRef.set({
          'emailVerified': true,
          'updatedAt': FieldValue.serverTimestamp(),
        }, SetOptions(merge: true));

        if (userData['role'] == 'vendor' &&
            (userData['venueId'] == null || userData['venueId'].toString().isEmpty) &&
            userData['pendingVendorOnboarding'] is Map) {
          final pending = Map<String, dynamic>.from(userData['pendingVendorOnboarding'] as Map);
          await VenuesService.provisionVendorVenue(fresh.uid, pending);
          await userRef.set({
            'pendingVendorOnboarding': FieldValue.delete(),
            'onboardingComplete': true,
            'emailVerified': true,
            'updatedAt': FieldValue.serverTimestamp(),
          }, SetOptions(merge: true));
        }

        final profile = await UsersService.getUserProfile(fresh.uid);
        if (!mounted) return;
        Navigator.pushNamedAndRemoveUntil(
          context,
          profile?.role == 'vendor' ? AppRoutes.vendorDashboard : AppRoutes.userDashboard,
          (_) => false,
        );
      } else {
        setState(() => _message = 'Email is not verified yet. Please check your inbox/spam and try again.');
      }
    } catch (e) {
      setState(() => _message = e.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _resend() async {
    await FirebaseAuth.instance.currentUser?.sendEmailVerification();
    setState(() => _message = 'Verification email resent.');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: CandyCard(
            child: Column(mainAxisSize: MainAxisSize.min, children: [
              Icon(Icons.mark_email_unread_outlined, size: 82, color: AppColors.primary.withValues(alpha: .75)),
              const SizedBox(height: 18),
              Text('Verify your email', style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w900)),
              const SizedBox(height: 8),
              const Text('Vendor accounts must verify email before the venue is created and linked, matching the web app flow.', textAlign: TextAlign.center, style: TextStyle(color: AppColors.muted)),
              if (_message.isNotEmpty) ...[const SizedBox(height: 14), Text(_message, textAlign: TextAlign.center)],
              const SizedBox(height: 20),
              SizedBox(width: double.infinity, child: ElevatedButton(onPressed: _busy ? null : _check, child: _busy ? const CircularProgressIndicator(color: Colors.white) : const Text('Check verification'))),
              TextButton(onPressed: _busy ? null : _resend, child: const Text('Resend verification email')),
              TextButton(onPressed: () => Navigator.pushNamedAndRemoveUntil(context, AppRoutes.home, (_) => false), child: const Text('Back to landing')),
            ]),
          ),
        ),
      ),
    );
  }
}

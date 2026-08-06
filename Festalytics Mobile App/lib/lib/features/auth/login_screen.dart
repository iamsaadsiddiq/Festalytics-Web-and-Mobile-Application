import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:provider/provider.dart';
import '../../core/routes/app_routes.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/app_widgets.dart';
import '../../providers/app_auth_provider.dart' as app;
import '../../services/users_service.dart';

enum LoginRole { user, vendor }

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});
  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _email = TextEditingController();
  final _password = TextEditingController();
  LoginRole? _loginRole;
  bool _rememberMe = false;
  bool _obscure = true;
  bool _busy = false;

  bool get _vendorMode => _loginRole == LoginRole.vendor;

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _login() async {
    if (_loginRole == null) {
      _toast('Please choose User Login or Vendor Login first.');
      return;
    }
    if (_email.text.trim().isEmpty || _password.text.isEmpty) {
      _toast('Please enter email and password.');
      return;
    }
    setState(() => _busy = true);
    try {
      await FirebaseAuth.instance.signInWithEmailAndPassword(
        email: _email.text.trim(),
        password: _password.text,
      );
      final user = FirebaseAuth.instance.currentUser;
      if (user == null) throw Exception('Login failed.');

      final profile = await UsersService.getUserProfile(user.uid);
      if (profile == null) {
        await FirebaseAuth.instance.signOut();
        throw Exception('Account not found in Firestore users collection.');
      }
      if (_vendorMode && profile.role != 'vendor') {
        await FirebaseAuth.instance.signOut();
        throw Exception('This account is registered as a User. Please use the User Login.');
      }
      if (!_vendorMode && profile.role == 'vendor') {
        await FirebaseAuth.instance.signOut();
        throw Exception('This account is registered as a Vendor. Please use the Vendor Login.');
      }

      if (_vendorMode) {
        await user.reload();
        final fresh = FirebaseAuth.instance.currentUser ?? user;
        final hasLinkedVenue = profile.venueId != null && profile.venueId!.isNotEmpty;
        if (!fresh.emailVerified && !hasLinkedVenue) {
          if (!mounted) return;
          await context.read<app.AppAuthProvider>().refresh();
          Navigator.pushNamedAndRemoveUntil(context, AppRoutes.verifyEmail, (_) => false);
          return;
        }
      }

      if (!mounted) return;
      await context.read<app.AppAuthProvider>().refresh();
      Navigator.pushNamedAndRemoveUntil(
        context,
        profile.role == 'vendor' ? AppRoutes.vendorDashboard : AppRoutes.userDashboard,
        (_) => false,
      );
    } on FirebaseAuthException catch (e) {
      _toast(_friendly(e.code));
    } catch (e) {
      _toast(e.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _googleSignIn() async {
    if (_loginRole == null) {
      _toast('Please choose User Login or Vendor Login first.');
      return;
    }
    setState(() => _busy = true);
    try {
      final googleUser = await GoogleSignIn().signIn();
      if (googleUser == null) { setState(() => _busy = false); return; }
      final googleAuth = await googleUser.authentication;
      final credential = GoogleAuthProvider.credential(
        accessToken: googleAuth.accessToken,
        idToken: googleAuth.idToken,
      );
      final userCred = await FirebaseAuth.instance.signInWithCredential(credential);
      final user = userCred.user!;

      final profile = await UsersService.getUserProfile(user.uid);
      if (profile != null) {
        if (_vendorMode && profile.role != 'vendor') {
          await FirebaseAuth.instance.signOut();
          throw Exception('This Google account is registered as a User. Please use User Login.');
        }
        if (!_vendorMode && profile.role == 'vendor') {
          await FirebaseAuth.instance.signOut();
          throw Exception('This Google account is registered as a Vendor. Please use Vendor Login.');
        }
      } else {
        final payload = <String, dynamic>{
          'uid': user.uid,
          'firstName': user.displayName?.split(' ').firstOrNull ?? '',
          'lastName': user.displayName?.split(' ').skip(1).join(' ') ?? '',
          'fullName': user.displayName ?? '',
          'email': user.email ?? '',
          'mobile': user.phoneNumber ?? '',
          'mobileNumber': user.phoneNumber ?? '',
          'gender': '',
          'birthday': '',
          'role': _vendorMode ? 'vendor' : 'user',
          'authProvider': 'google.com',
          'emailVerified': user.emailVerified,
          'isActive': true,
        };
        await UsersService.createUserProfile(user.uid, payload);
        if (_vendorMode) {
          if (!mounted) return;
          Navigator.pushNamedAndRemoveUntil(context, AppRoutes.signup, (_) => false);
          return;
        }
      }

      if (!mounted) return;
      await context.read<app.AppAuthProvider>().refresh();
      final role = (profile?.role ?? (_vendorMode ? 'vendor' : 'user'));
      Navigator.pushNamedAndRemoveUntil(
        context,
        role == 'vendor' ? AppRoutes.vendorDashboard : AppRoutes.userDashboard,
        (_) => false,
      );
    } catch (e) {
      _toast(e.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _forgot() async {
    if (_email.text.trim().isEmpty) {
      _toast('Enter your email first.');
      return;
    }
    await FirebaseAuth.instance.sendPasswordResetEmail(email: _email.text.trim());
    _toast('Password reset email sent.', success: true);
  }

  String _friendly(String code) {
    switch (code) {
      case 'invalid-email': return 'Please enter a valid email address.';
      case 'invalid-credential': return 'Invalid email or password.';
      case 'user-disabled': return 'This account has been disabled.';
      case 'too-many-requests': return 'Too many attempts. Try later.';
      default: return 'Login failed. Please check your credentials.';
    }
  }

  void _toast(String message, {bool success = false}) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(message),
      backgroundColor: success ? AppColors.success : AppColors.danger,
      behavior: SnackBarBehavior.floating,
    ));
  }

  InputDecoration _inputDeco(String label, {String? hint, Widget? prefixIcon, Widget? suffixIcon}) {
    return InputDecoration(
      labelText: label,
      hintText: hint,
      prefixIcon: prefixIcon,
      suffixIcon: suffixIcon,
      labelStyle: const TextStyle(color: Colors.white70),
      hintStyle: const TextStyle(color: Colors.white30),
      filled: true,
      fillColor: Colors.white.withValues(alpha: 0.08),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.2))),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.2))),
      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: const BorderSide(color: AppColors.primary, width: 1.5)),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF080808),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(22),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              IconButton(
                onPressed: () => Navigator.pushNamedAndRemoveUntil(context, AppRoutes.home, (_) => false),
                icon: const Icon(Icons.arrow_back, color: Colors.white),
              ),
              const Text('Festalytics', style: TextStyle(color: Colors.white70, fontWeight: FontWeight.w700)),
            ]),
            const SizedBox(height: 20),
            Text('Welcome to Festalytics', style: Theme.of(context).textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.w900, color: Colors.white)),
            const SizedBox(height: 6),
            const Text('Choose your login type', style: TextStyle(color: Colors.white60)),
            const SizedBox(height: 24),
            CandyCard(
              color: Colors.white.withValues(alpha: .06),
              child: _loginRole == null ? _roleChooser() : _loginForm(),
            ),
          ]),
        ),
      ),
    );
  }

  Widget _roleChooser() => Column(children: [
    _choiceCard(
      title: 'Log in as Vendor',
      subtitle: 'Manage your services, bookings, inventory and analytics',
      icon: Icons.storefront,
      onTap: () => setState(() => _loginRole = LoginRole.vendor),
    ),
    const SizedBox(height: 14),
    _choiceCard(
      title: 'Log in as User',
      subtitle: 'Plan and manage your events',
      icon: Icons.person,
      onTap: () => setState(() => _loginRole = LoginRole.user),
    ),
    const SizedBox(height: 18),
    TextButton(
      onPressed: () => Navigator.pushReplacementNamed(context, AppRoutes.signup),
      child: const Text('New here? Create an account', style: TextStyle(color: Colors.white70)),
    ),
  ]);

  Widget _loginForm() => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    Row(children: [
      TextButton.icon(
        onPressed: _busy ? null : () => setState(() { _loginRole = null; _email.clear(); _password.clear(); }),
        icon: const Icon(Icons.arrow_back, color: Colors.white70),
        label: const Text('Back', style: TextStyle(color: Colors.white70)),
      ),
      const Spacer(),
      Icon(_vendorMode ? Icons.storefront : Icons.person, color: AppColors.primary),
      const SizedBox(width: 8),
      Text(_vendorMode ? 'Vendor Login' : 'User Login', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 18)),
    ]),
    const SizedBox(height: 18),
    TextField(
      controller: _email,
      keyboardType: TextInputType.emailAddress,
      style: const TextStyle(color: Colors.white),
      decoration: _inputDeco('Email', hint: _vendorMode ? 'vendor@festalytics.com' : 'user@example.com', prefixIcon: const Icon(Icons.email_outlined, color: Colors.white54)),
    ),
    const SizedBox(height: 12),
    TextField(
      controller: _password,
      obscureText: _obscure,
      style: const TextStyle(color: Colors.white),
      decoration: _inputDeco('Password', prefixIcon: const Icon(Icons.lock_outline, color: Colors.white54), suffixIcon: IconButton(icon: Icon(_obscure ? Icons.visibility_off : Icons.visibility, color: Colors.white54), onPressed: () => setState(() => _obscure = !_obscure))),
    ),
    const SizedBox(height: 8),
    Row(children: [
      Checkbox(value: _rememberMe, onChanged: (v) => setState(() => _rememberMe = v ?? false), activeColor: AppColors.primary, checkColor: Colors.white),
      const Text('Remember me', style: TextStyle(color: Colors.white70)),
      const Spacer(),
      TextButton(onPressed: _forgot, child: const Text('Forgot password?', style: TextStyle(color: AppColors.primary))),
    ]),
    SizedBox(
      width: double.infinity,
      child: ElevatedButton(
        onPressed: _busy ? null : _login,
        style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary, foregroundColor: Colors.white, padding: const EdgeInsets.symmetric(vertical: 14), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16))),
        child: _busy ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Text('Log In', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
      ),
    ),
    const SizedBox(height: 14),
    Row(children: [
      Expanded(child: Divider(color: Colors.white.withValues(alpha: 0.15))),
      Padding(padding: const EdgeInsets.symmetric(horizontal: 12), child: Text('or continue with', style: TextStyle(color: Colors.white38, fontSize: 12))),
      Expanded(child: Divider(color: Colors.white.withValues(alpha: 0.15))),
    ]),
    const SizedBox(height: 14),
    SizedBox(
      width: double.infinity,
      child: OutlinedButton.icon(
        onPressed: _busy ? null : _googleSignIn,
        icon: const Icon(Icons.g_mobiledata, color: Colors.white),
        label: const Text('Sign in with Google', style: TextStyle(color: Colors.white)),
        style: OutlinedButton.styleFrom(
          side: BorderSide(color: Colors.white.withValues(alpha: 0.2)),
          padding: const EdgeInsets.symmetric(vertical: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        ),
      ),
    ),
    const SizedBox(height: 12),
    Center(child: TextButton(onPressed: () => Navigator.pushReplacementNamed(context, AppRoutes.signup), child: const Text('Don\'t have an account? Sign up', style: TextStyle(color: Colors.white70)))),
  ]);

  Widget _choiceCard({required String title, required String subtitle, required IconData icon, required VoidCallback onTap}) => InkWell(
    borderRadius: BorderRadius.circular(22),
    onTap: onTap,
    child: Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: .06),
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: Colors.white.withValues(alpha: .12)),
      ),
      child: Column(children: [
        Icon(icon, color: AppColors.primary, size: 46),
        const SizedBox(height: 10),
        Text(title, textAlign: TextAlign.center, style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w900)),
        const SizedBox(height: 4),
        Text(subtitle, textAlign: TextAlign.center, style: const TextStyle(color: Colors.white60)),
      ]),
    ),
  );
}

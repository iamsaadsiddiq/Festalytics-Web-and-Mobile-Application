import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../routes/app_routes.dart';
import '../theme/app_theme.dart';
import '../../providers/app_auth_provider.dart' as app;

const _actionCopy = {
  'ai': 'Sign in to chat with AI Planner',
  'decor': 'Sign in to analyze your decor',
  'quote': 'Sign in to request a quote',
  'chat': 'Sign in to message the venue',
  'login': 'Welcome back',
};

const _actionBody = {
  'ai': 'Get personalized venue, budget, and timeline suggestions with a free account.',
  'decor': 'Upload inspiration photos after signing in — we\'ll match colors, style, and vendors.',
  'quote': 'Create a free account or log in to send your quotation to the venue.',
  'chat': 'Log in to send inquiries and respond to offers from this venue.',
  'login': 'Log in to continue planning your event on Festalytics.',
};

class AuthGateModal extends StatefulWidget {
  final String action;
  final VoidCallback onSuccess;
  final VoidCallback onClose;
  const AuthGateModal({super.key, required this.action, required this.onSuccess, required this.onClose});

  @override
  State<AuthGateModal> createState() => _AuthGateModalState();
}

class _AuthGateModalState extends State<AuthGateModal> with SingleTickerProviderStateMixin {
  int _tab = 0;
  late AnimationController _anim;
  late Animation<double> _fade;

  @override
  void initState() {
    super.initState();
    _anim = AnimationController(vsync: this, duration: const Duration(milliseconds: 250));
    _fade = CurvedAnimation(parent: _anim, curve: Curves.easeOut);
    _anim.forward();
  }

  @override
  void dispose() {
    _anim.dispose();
    super.dispose();
  }

  void _dismiss() {
    _anim.reverse().then((_) { if (mounted) widget.onClose(); });
  }

  @override
  Widget build(BuildContext context) {
    final title = _actionCopy[widget.action] ?? _actionCopy['login']!;
    final body = _actionBody[widget.action] ?? _actionBody['login']!;

    return FadeTransition(
      opacity: _fade,
      child: GestureDetector(
        onTap: _dismiss,
        child: Container(
          color: Colors.black54,
          child: Center(
            child: GestureDetector(
              onTap: () {},
              child: Container(
                margin: const EdgeInsets.symmetric(horizontal: 20),
                decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(28)),
                child: Column(mainAxisSize: MainAxisSize.min, children: [
                  Padding(padding: const EdgeInsets.fromLTRB(24, 24, 24, 16), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Row(children: [
                      Expanded(child: Text('FESTALYTICS', style: TextStyle(color: AppColors.primary, fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 2))),
                      IconButton(onPressed: _dismiss, icon: const Icon(Icons.close), visualDensity: VisualDensity.compact),
                    ]),
                    const SizedBox(height: 10),
                    Text(title, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900)),
                    const SizedBox(height: 6),
                    Text(body, style: const TextStyle(color: AppColors.muted, fontSize: 13)),
                  ])),
                  Container(
                    margin: const EdgeInsets.symmetric(horizontal: 24),
                    padding: const EdgeInsets.all(4),
                    decoration: BoxDecoration(color: Colors.grey.shade100, borderRadius: BorderRadius.circular(14)),
                    child: Row(children: [
                      _tabBtn('Log in', 0),
                      _tabBtn('Sign up', 1),
                    ]),
                  ),
                  if (_tab == 0) _loginTab() else _signupTab(),
                ]),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _tabBtn(String label, int idx) => Expanded(child: GestureDetector(
    onTap: () => setState(() => _tab = idx),
    child: AnimatedContainer(
      duration: const Duration(milliseconds: 180),
      padding: const EdgeInsets.symmetric(vertical: 12),
      decoration: BoxDecoration(color: _tab == idx ? Colors.white : Colors.transparent, borderRadius: BorderRadius.circular(12)),
      child: Text(label, textAlign: TextAlign.center, style: TextStyle(fontWeight: FontWeight.w700, color: _tab == idx ? AppColors.primary : AppColors.muted, fontSize: 13)),
    ),
  ));

  Widget _loginTab() {
    final email = TextEditingController();
    final pass = TextEditingController();
    bool obscure = true;
    bool busy = false;

    return StatefulBuilder(builder: (context, setInner) => Padding(
      padding: const EdgeInsets.fromLTRB(24, 16, 24, 24),
      child: Column(children: [
        TextField(controller: email, keyboardType: TextInputType.emailAddress, decoration: const InputDecoration(labelText: 'Email', prefixIcon: Icon(Icons.email_outlined)), style: const TextStyle(color: Colors.black)),
        const SizedBox(height: 10),
        TextField(controller: pass, obscureText: obscure, decoration: InputDecoration(labelText: 'Password', prefixIcon: const Icon(Icons.lock_outline), suffixIcon: IconButton(icon: Icon(obscure ? Icons.visibility_off : Icons.visibility), onPressed: () => setInner(() => obscure = !obscure))), style: const TextStyle(color: Colors.black)),
        const SizedBox(height: 16),
        SizedBox(width: double.infinity, child: ElevatedButton(
          onPressed: busy ? null : () async {
            setInner(() => busy = true);
            try {
              await FirebaseAuth.instance.signInWithEmailAndPassword(email: email.text.trim(), password: pass.text);
              if (mounted) {
                await context.read<app.AppAuthProvider>().refresh();
                widget.onSuccess();
              }
            } catch (e) {
              if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Login failed: $e'), backgroundColor: AppColors.danger));
            } finally { if (mounted) setInner(() => busy = false); }
          },
          child: busy ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Text('Log In'),
        )),
        const SizedBox(height: 8),
        TextButton(onPressed: () { _dismiss(); Navigator.pushNamed(context, AppRoutes.signup); }, child: const Text('Don\'t have an account? Sign up')),
      ]),
    ));
  }

  Widget _signupTab() => Padding(
    padding: const EdgeInsets.fromLTRB(24, 16, 24, 24),
    child: Column(children: [
      const Text('Create a free Festalytics account to save quotes, chat with venues, and plan your event.', style: TextStyle(color: AppColors.muted, fontSize: 13)),
      const SizedBox(height: 16),
      SizedBox(width: double.infinity, child: ElevatedButton(
        onPressed: () { _dismiss(); Navigator.pushNamed(context, AppRoutes.signup); },
        child: const Text('Continue to Sign up'),
      )),
      const SizedBox(height: 8),
      const Text('After signing up you\'ll return here to finish what you started.', style: TextStyle(color: AppColors.muted, fontSize: 12)),
    ]),
  );
}

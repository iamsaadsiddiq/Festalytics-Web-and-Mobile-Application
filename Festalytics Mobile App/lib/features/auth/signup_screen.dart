import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:google_sign_in/google_sign_in.dart';
import '../../core/routes/app_routes.dart';
import '../../core/theme/app_theme.dart';

class SignupScreen extends StatefulWidget {
  const SignupScreen({super.key});
  @override
  State<SignupScreen> createState() => _SignupScreenState();
}

class _SignupScreenState extends State<SignupScreen> {
  bool _vendor = false;
  bool _busy = false;
  bool _obscure = true;
  bool _obscureConfirm = true;
  final _first = TextEditingController();
  final _last = TextEditingController();
  final _mobile = TextEditingController();
  final _email = TextEditingController();
  final _password = TextEditingController();
  final _confirm = TextEditingController();
  String _gender = '';
  DateTime? _birthday;
  final _cnic = TextEditingController();
  final _businessPhone = TextEditingController();
  final _hallName = TextEditingController();
  final _area = TextEditingController();
  final _address = TextEditingController();
  final _capacity = TextEditingController(text: '500');
  final _description = TextEditingController();

  @override
  void dispose() {
    for (final c in [_first, _last, _mobile, _email, _password, _confirm, _cnic, _businessPhone, _hallName, _area, _address, _capacity, _description]) { c.dispose(); }
    super.dispose();
  }

  void _cnicFormat(String value) {
    final digits = value.replaceAll(RegExp(r'\D'), '');
    final buf = StringBuffer();
    for (int i = 0; i < digits.length && i < 13; i++) {
      if (i == 5 || i == 12) buf.write('-');
      buf.write(digits[i]);
    }
    _cnic.value = TextEditingValue(text: buf.toString(), selection: TextSelection.collapsed(offset: buf.length));
  }

  String? _validate() {
    if (_first.text.trim().isEmpty) return 'First name is required.';
    if (_last.text.trim().isEmpty) return 'Last name is required.';
    if (_mobile.text.trim().isEmpty) return 'Mobile number is required.';
    if (_gender.isEmpty) return 'Please select your gender.';
    if (_birthday == null) return 'Please select your birthday.';
    if (!_email.text.contains('@')) return 'Valid email is required.';
    if (_password.text.length < 6) return 'Password must be at least 6 characters.';
    if (_password.text != _confirm.text) return 'Passwords do not match.';
    if (_vendor) {
      if (_cnic.text.trim().length < 13) return 'CNIC must be 13 digits.';
      if (_hallName.text.trim().isEmpty) return 'Business / hall name is required.';
      if (_area.text.trim().isEmpty) return 'Area is required.';
      if (_address.text.trim().isEmpty) return 'Business address is required.';
    }
    return null;
  }

  Future<void> _signup() async {
    final error = _validate();
    if (error != null) return _toast(error);
    setState(() => _busy = true);
    try {
      final cred = await FirebaseAuth.instance.createUserWithEmailAndPassword(email: _email.text.trim(), password: _password.text);
      final uid = cred.user!.uid;
      await cred.user!.updateDisplayName('${_first.text.trim()} ${_last.text.trim()}');
      await cred.user!.sendEmailVerification();
      final bday = _birthday != null ? '${_birthday!.year}-${_birthday!.month.toString().padLeft(2, '0')}-${_birthday!.day.toString().padLeft(2, '0')}' : '';
      final userPayload = <String, dynamic>{
        'uid': uid,
        'firstName': _first.text.trim(),
        'lastName': _last.text.trim(),
        'fullName': '${_first.text.trim()} ${_last.text.trim()}',
        'mobile': _mobile.text.trim(),
        'mobileNumber': _mobile.text.trim(),
        'email': _email.text.trim(),
        'gender': _gender,
        'birthday': bday,
        'role': _vendor ? 'vendor' : 'user',
        'cnic': _vendor ? _cnic.text.trim() : null,
        'isActive': true,
        'emailVerified': false,
        'authProvider': 'password',
        'createdAt': FieldValue.serverTimestamp(),
        'updatedAt': FieldValue.serverTimestamp(),
        if (_vendor) ...{
          'pendingVendorOnboarding': {
            'hallName': _hallName.text.trim(),
            'area': _area.text.trim(),
            'address': _address.text.trim(),
            'capacity': _capacity.text.trim(),
            'businessPhone': _mobile.text.trim(),
            'mobileNumber': _mobile.text.trim(),
            'description': _description.text.trim(),
          },
          'onboardingComplete': false,
          'venueId': null,
        },
      };
      try {
        await FirebaseFirestore.instance.collection('users').doc(uid).set(userPayload);
      } catch (_) {
        await cred.user!.delete();
        rethrow;
      }
      if (!mounted) return;
      Navigator.pushNamedAndRemoveUntil(
        context,
        _vendor ? AppRoutes.verifyEmail : AppRoutes.userDashboard,
        (_) => false,
      );
    } on FirebaseAuthException catch (e) {
      _toast(e.message ?? 'Signup failed.');
    } catch (e) {
      _toast(e.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _googleSignup() async {
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

      final existingDoc = await FirebaseFirestore.instance.collection('users').doc(user.uid).get();
      if (existingDoc.exists) {
        final role = existingDoc.data()?['role'] ?? 'user';
        if (!mounted) return;
        Navigator.pushNamedAndRemoveUntil(
          context,
          role == 'vendor' ? AppRoutes.vendorDashboard : AppRoutes.userDashboard,
          (_) => false,
        );
        return;
      }

      await FirebaseFirestore.instance.collection('users').doc(user.uid).set({
        'uid': user.uid,
        'firstName': user.displayName?.split(' ').firstOrNull ?? '',
        'lastName': user.displayName?.split(' ').skip(1).join(' ') ?? '',
        'fullName': user.displayName ?? '',
        'email': user.email ?? '',
        'mobile': user.phoneNumber ?? '',
        'mobileNumber': user.phoneNumber ?? '',
        'gender': '',
        'birthday': '',
        'role': _vendor ? 'vendor' : 'user',
        'authProvider': 'google.com',
        'emailVerified': user.emailVerified,
        'isActive': true,
        'createdAt': FieldValue.serverTimestamp(),
      });

      if (!mounted) return;
      if (_vendor) {
        Navigator.pushNamedAndRemoveUntil(context, AppRoutes.signup, (_) => false);
      } else {
        Navigator.pushNamedAndRemoveUntil(context, AppRoutes.userDashboard, (_) => false);
      }
    } catch (e) {
      _toast('Google signup failed: $e');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _pickDate() async {
    final d = await showDatePicker(
      context: context,
      firstDate: DateTime(1950),
      lastDate: DateTime.now(),
      initialDate: _birthday ?? DateTime(2000),
    );
    if (d != null) setState(() => _birthday = d);
  }

  void _toast(String message) => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message), backgroundColor: AppColors.danger, behavior: SnackBarBehavior.floating));

  Widget _label(String text) => Padding(padding: const EdgeInsets.only(left: 4, bottom: 4), child: Text(text, style: const TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.w600)));

  InputDecoration _inputDeco(String hint) {
    return InputDecoration(
      hintText: hint,
      hintStyle: const TextStyle(color: Colors.white30),
      filled: true,
      fillColor: Colors.white.withValues(alpha: 0.08),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.15))),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.15))),
      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: AppColors.primary, width: 1.5)),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
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
              IconButton(onPressed: () => Navigator.pushNamedAndRemoveUntil(context, AppRoutes.home, (_) => false), icon: const Icon(Icons.arrow_back, color: Colors.white)),
              const Text('Festalytics', style: TextStyle(color: Colors.white70, fontWeight: FontWeight.w700)),
            ]),
            const SizedBox(height: 16),
            Text('Create your account', style: const TextStyle(color: Colors.white, fontSize: 26, fontWeight: FontWeight.w900)),
            const SizedBox(height: 4),
            const Text('Sign up to get started', style: TextStyle(color: Colors.white60)),
            const SizedBox(height: 20),
            ClipRRect(
              borderRadius: BorderRadius.circular(24),
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.06),
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
                ),
                child: Column(children: [
                  Container(
                    padding: const EdgeInsets.all(4),
                    decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.08), borderRadius: BorderRadius.circular(16)),
                    child: Row(children: [
                      _roleTab('User Signup', !_vendor, () => setState(() => _vendor = false)),
                      _roleTab('Vendor Signup', _vendor, () => setState(() => _vendor = true)),
                    ]),
                  ),
                  const SizedBox(height: 20),
                  _rowField(_first, 'First name', _last, 'Last name'),
                  const SizedBox(height: 14),
                  _rowField2(_mobile, 'Mobile number'),
                  const SizedBox(height: 14),
                  _row(
                    Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      _label('Gender'),
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.08),
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: Colors.white.withValues(alpha: 0.15)),
                        ),
                        child: DropdownButtonHideUnderline(
                          child: DropdownButton<String>(
                            value: _gender.isEmpty ? null : _gender,
                            hint: const Text('Select gender', style: TextStyle(color: Colors.white30)),
                            dropdownColor: const Color(0xFF1A1A2E),
                            isExpanded: true,
                            items: ['Male', 'Female', 'Other'].map((g) => DropdownMenuItem(value: g, child: Text(g, style: const TextStyle(color: Colors.white)))).toList(),
                            onChanged: (v) => setState(() => _gender = v ?? ''),
                          ),
                        ),
                      ),
                    ]),
                    Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      _label('Birthday'),
                      GestureDetector(
                        onTap: _pickDate,
                        child: Container(
                          width: double.infinity,
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.08),
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(color: Colors.white.withValues(alpha: 0.15)),
                          ),
                          child: Row(children: [
                            Expanded(child: Text(_birthday == null ? 'Select date' : '${_birthday!.year}-${_birthday!.month.toString().padLeft(2, '0')}-${_birthday!.day.toString().padLeft(2, '0')}', style: TextStyle(color: _birthday == null ? Colors.white30 : Colors.white))),
                            const Icon(Icons.calendar_today, color: Colors.white38, size: 16),
                          ]),
                        ),
                      ),
                    ]),
                  ),
                  const SizedBox(height: 14),
                  _field(_email, 'Email', hint: 'user@example.com'),
                  const SizedBox(height: 14),
                  TextField(
                    controller: _password,
                    obscureText: _obscure,
                    style: const TextStyle(color: Colors.white),
                    decoration: _inputDeco('Create password').copyWith(prefixIcon: const Icon(Icons.lock_outline, color: Colors.white38), suffixIcon: IconButton(icon: Icon(_obscure ? Icons.visibility_off : Icons.visibility, color: Colors.white38), onPressed: () => setState(() => _obscure = !_obscure))),
                  ),
                  const SizedBox(height: 14),
                  TextField(
                    controller: _confirm,
                    obscureText: _obscureConfirm,
                    style: const TextStyle(color: Colors.white),
                    decoration: _inputDeco('Confirm password').copyWith(prefixIcon: const Icon(Icons.lock_reset, color: Colors.white38), suffixIcon: IconButton(icon: Icon(_obscureConfirm ? Icons.visibility_off : Icons.visibility, color: Colors.white38), onPressed: () => setState(() => _obscureConfirm = !_obscureConfirm))),
                  ),
                  if (_vendor) ...[
                    const SizedBox(height: 20),
                    Container(height: 1, color: Colors.white.withValues(alpha: 0.1)),
                    const SizedBox(height: 16),
                    const Text('Your venue / hall', style: TextStyle(color: AppColors.primary, fontSize: 11, fontWeight: FontWeight.w900, letterSpacing: 1)),
                    const SizedBox(height: 14),
                    _field(_hallName, 'Hall / Business name', hint: 'e.g. Royal Garden Banquet'),
                    const SizedBox(height: 14),
                    _rowField2(_cnic, 'CNIC', onChanged: _cnicFormat, hint: '42101-1234567-1'),
                    const SizedBox(height: 14),
                    _rowField2(_businessPhone, 'Business phone (optional)', hint: 'Same as mobile or hall line'),
                    const SizedBox(height: 14),
                    _rowField(_area, 'City / Area', _capacity, 'Capacity (guests)'),
                    const SizedBox(height: 14),
                    _field(_address, 'Street address', hint: 'Plot 12, Block A, Main Road'),
                    const SizedBox(height: 14),
                    TextField(
                      controller: _description,
                      maxLines: 3,
                      style: const TextStyle(color: Colors.white),
                      decoration: _inputDeco('Short description (optional)').copyWith(prefixIcon: const Padding(padding: EdgeInsets.only(bottom: 40), child: Icon(Icons.description, color: Colors.white38))),
                    ),
                  ],
                  const SizedBox(height: 20),
                  SizedBox(width: double.infinity, child: ElevatedButton(
                    onPressed: _busy ? null : _signup,
                    style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary, foregroundColor: Colors.white, padding: const EdgeInsets.symmetric(vertical: 14), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16))),
                    child: _busy ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : Text(_vendor ? 'Create Vendor Account' : 'Create User Account', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
                  )),
                  if (!_vendor) ...[
                    const SizedBox(height: 14),
                    Row(children: [
                      Expanded(child: Container(height: 1, color: Colors.white.withValues(alpha: 0.1))),
                      Padding(padding: const EdgeInsets.symmetric(horizontal: 10), child: Text('Or continue with', style: TextStyle(color: Colors.white38, fontSize: 11))),
                      Expanded(child: Container(height: 1, color: Colors.white.withValues(alpha: 0.1))),
                    ]),
                    const SizedBox(height: 14),
                    SizedBox(
                      width: double.infinity,
                      child: OutlinedButton.icon(
                        onPressed: _busy ? null : _googleSignup,
                        icon: const Icon(Icons.g_mobiledata, color: Colors.white),
                        label: const Text('Sign up with Google', style: TextStyle(color: Colors.white)),
                        style: OutlinedButton.styleFrom(
                          side: BorderSide(color: Colors.white.withValues(alpha: 0.2)),
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        ),
                      ),
                    ),
                  ],
                  const SizedBox(height: 12),
                  Center(child: TextButton(onPressed: () => Navigator.pushReplacementNamed(context, AppRoutes.login), child: const Text('Already have an account? Log in', style: TextStyle(color: Colors.white70)))),
                ]),
              ),
            ),
          ]),
        ),
      ),
    );
  }

  Widget _field(TextEditingController c, String label, {TextInputType? keyboardType, int maxLines = 1, String? hint, void Function(String)? onChanged}) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      _label(label),
      TextField(
        controller: c,
        keyboardType: keyboardType,
        maxLines: maxLines,
        style: const TextStyle(color: Colors.white),
        decoration: _inputDeco(hint ?? label),
        onChanged: onChanged,
      ),
    ]);
  }

  Widget _rowField(TextEditingController c1, String l1, TextEditingController c2, String l2) {
    return Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [_label(l1), TextField(controller: c1, style: const TextStyle(color: Colors.white), decoration: _inputDeco(l1))])),
      const SizedBox(width: 10),
      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [_label(l2), TextField(controller: c2, style: const TextStyle(color: Colors.white), decoration: _inputDeco(l2))])),
    ]);
  }

  Widget _rowField2(TextEditingController c, String label, {String? hint, void Function(String)? onChanged}) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      _label(label),
      TextField(controller: c, style: const TextStyle(color: Colors.white), decoration: _inputDeco(hint ?? label), onChanged: onChanged),
    ]);
  }

  Widget _row(Widget left, Widget right) {
    return Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Expanded(child: left),
      const SizedBox(width: 10),
      Expanded(child: right),
    ]);
  }

  Expanded _roleTab(String text, bool selected, VoidCallback onTap) => Expanded(child: GestureDetector(onTap: onTap, child: AnimatedContainer(
    duration: const Duration(milliseconds: 180),
    padding: const EdgeInsets.symmetric(vertical: 12),
    decoration: BoxDecoration(color: selected ? AppColors.primary : Colors.transparent, borderRadius: BorderRadius.circular(13)),
    child: Text(text, textAlign: TextAlign.center, style: TextStyle(fontWeight: FontWeight.w800, color: selected ? Colors.white : Colors.white60, fontSize: 13)),
  )));
}

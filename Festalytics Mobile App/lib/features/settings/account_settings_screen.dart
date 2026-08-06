import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/widgets/app_widgets.dart';
import '../../providers/app_auth_provider.dart' as app;
import '../../services/users_service.dart';

class AccountSettingsScreen extends StatefulWidget {
  const AccountSettingsScreen({super.key});
  @override
  State<AccountSettingsScreen> createState() => _AccountSettingsScreenState();
}

class _AccountSettingsScreenState extends State<AccountSettingsScreen> {
  final _first = TextEditingController();
  final _last = TextEditingController();
  final _phone = TextEditingController();
  bool _loaded = false;
  bool _busy = false;
  @override
  void dispose() { _first.dispose(); _last.dispose(); _phone.dispose(); super.dispose(); }
  void _load(app.AppAuthProvider auth) { if (_loaded) return; final u = auth.currentUser; if (u == null) return; _first.text = u.firstName; _last.text = u.lastName; _phone.text = u.mobileNumber; _loaded = true; }
  Future<void> _save(app.AppAuthProvider auth) async { final uid = FirebaseAuth.instance.currentUser?.uid; if (uid == null) return; setState(() => _busy = true); await UsersService.updateUserProfile(uid, {'firstName': _first.text.trim(), 'lastName': _last.text.trim(), 'fullName': '${_first.text.trim()} ${_last.text.trim()}', 'mobile': _phone.text.trim(), 'mobileNumber': _phone.text.trim()}); await auth.refresh(); if (mounted) setState(() => _busy = false); }
  @override
  Widget build(BuildContext context) { final auth = context.watch<app.AppAuthProvider>(); _load(auth); return Scaffold(appBar: AppBar(title: const Text('Account Settings')), body: ListView(padding: const EdgeInsets.all(18), children: [const SectionTitle('Account profile', subtitle: 'Same users collection fields as web account settings.'), CandyCard(child: Column(children: [TextField(controller: _first, decoration: const InputDecoration(labelText: 'First name')), const SizedBox(height: 10), TextField(controller: _last, decoration: const InputDecoration(labelText: 'Last name')), const SizedBox(height: 10), TextField(controller: _phone, decoration: const InputDecoration(labelText: 'Phone')), const SizedBox(height: 14), SizedBox(width: double.infinity, child: ElevatedButton(onPressed: _busy ? null : () => _save(auth), child: Text(_busy ? 'Saving...' : 'Save account')))]))])); }
}

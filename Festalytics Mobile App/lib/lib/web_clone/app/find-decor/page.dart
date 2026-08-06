import 'dart:io';
import 'package:flutter/material.dart';
import '../../../core/widgets/app_widgets.dart';
import '../../../services/ai_backend_service.dart';
import '../../src/components/find-my-decor/FileUpload.dart';
import '../../src/components/find-my-decor/Loader.dart';
import '../../src/components/find-my-decor/AnalysisResult.dart';
import '../../src/components/find-my-decor/VendorCard.dart';

class WebCloneAppFindDecorPage extends StatefulWidget {
  const WebCloneAppFindDecorPage({super.key});
  @override
  State<WebCloneAppFindDecorPage> createState() => _WebCloneAppFindDecorPageState();
}

class _WebCloneAppFindDecorPageState extends State<WebCloneAppFindDecorPage> {
  File? _image;
  bool _busy = false;
  Map<String, dynamic>? _result;
  final _style = TextEditingController(text: 'Modern luxury');
  final _budget = TextEditingController();

  @override
  void dispose() { _style.dispose(); _budget.dispose(); super.dispose(); }

  Future<void> _match() async {
    if (_image == null) return;
    setState(() { _busy = true; _result = null; });
    try {
      final res = await AiBackendService.matchDecor(_image!, style: _style.text, budget: _budget.text);
      if (mounted) setState(() => _result = res);
    } catch (e) {
      if (mounted) setState(() => _result = {'error': e.toString()});
    } finally { if (mounted) setState(() => _busy = false); }
  }

  List<Map<String, dynamic>> _vendorList() {
    if (_result == null) return [];
    return ((_result!['matches'] as List<dynamic>?) ?? [])
        .map((e) => e is Map ? Map<String, dynamic>.from(e) : <String, dynamic>{})
        .toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Find My Decor')),
      body: ListView(padding: const EdgeInsets.all(18), children: [
        const SectionTitle('Decor Matcher', subtitle: 'Find vendors matching your decor inspiration.'),
        CandyCard(child: Column(children: [
          FileUploadWidget(image: _image, onImagePicked: (f) => setState(() => _image = f)),
          const SizedBox(height: 12),
          TextField(controller: _style, decoration: const InputDecoration(labelText: 'Preferred style')),
          const SizedBox(height: 10),
          TextField(controller: _budget, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Budget optional')),
          const SizedBox(height: 14),
          SizedBox(width: double.infinity, child: ElevatedButton.icon(onPressed: _busy ? null : _match, icon: const Icon(Icons.auto_awesome), label: Text(_busy ? 'Analyzing...' : 'Find matches'))),
        ])),
        if (_busy) ...[const SizedBox(height: 24), const LoaderWidget(label: 'Analyzing your decor inspiration...')],
        if (_result != null && !_busy) ...[
          const SizedBox(height: 18),
          const SectionTitle('Analysis Result'),
          AnalysisResultWidget(result: _result!),
          if (_vendorList().isNotEmpty) ...[
            const SizedBox(height: 18),
            const SectionTitle('Ranked Vendors'),
            ...List.generate(_vendorList().length, (i) {
              final v = _vendorList()[i];
              final score = (v['score'] ?? 0).toDouble();
              return DecorVendorCardWidget(vendor: v, matchScore: score);
            }),
          ],
        ],
      ]),
    );
  }
}

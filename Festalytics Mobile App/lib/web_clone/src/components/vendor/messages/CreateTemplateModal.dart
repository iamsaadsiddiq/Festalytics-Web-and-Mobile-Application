import 'package:flutter/material.dart';
import '../../../../../core/theme/app_theme.dart';

class CreateTemplateModal extends StatefulWidget {
  final Function(String name, String content) onSave;
  final String? initialName;
  final String? initialContent;
  const CreateTemplateModal({super.key, required this.onSave, this.initialName, this.initialContent});

  @override
  State<CreateTemplateModal> createState() => _CreateTemplateModalState();
}

class _CreateTemplateModalState extends State<CreateTemplateModal> {
  late TextEditingController _nameCtrl;
  late TextEditingController _contentCtrl;

  @override
  void initState() {
    super.initState();
    _nameCtrl = TextEditingController(text: widget.initialName ?? '');
    _contentCtrl = TextEditingController(text: widget.initialContent ?? '');
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _contentCtrl.dispose();
    super.dispose();
  }

  void _save() {
    final name = _nameCtrl.text.trim();
    final content = _contentCtrl.text.trim();
    if (name.isEmpty || content.isEmpty) return;
    widget.onSave(name, content);
    Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(widget.initialName != null ? 'Edit Template' : 'Create Template', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 20)),
            const SizedBox(height: 6),
            const Text('Save a reusable message template.', style: TextStyle(color: AppColors.muted, fontSize: 14)),
            const SizedBox(height: 20),
            TextField(
              controller: _nameCtrl,
              decoration: const InputDecoration(labelText: 'Template Name *', hintText: 'e.g. Welcome Message'),
            ),
            const SizedBox(height: 14),
            TextField(
              controller: _contentCtrl,
              maxLines: 4,
              decoration: const InputDecoration(labelText: 'Message Content *', hintText: 'Type your template message...'),
            ),
            const SizedBox(height: 20),
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
                const SizedBox(width: 8),
                ElevatedButton(onPressed: _save, child: const Text('Save Template')),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

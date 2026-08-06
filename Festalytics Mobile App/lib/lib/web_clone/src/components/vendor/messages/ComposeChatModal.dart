import 'package:flutter/material.dart';
import '../../../../../core/theme/app_theme.dart';
import '../../../../../services/chat_service.dart';

class ComposeChatModal extends StatefulWidget {
  final String venueId;
  final String venueName;
  const ComposeChatModal({super.key, required this.venueId, required this.venueName});

  @override
  State<ComposeChatModal> createState() => _ComposeChatModalState();
}

class _ComposeChatModalState extends State<ComposeChatModal> {
  final _nameCtrl = TextEditingController();
  final _msgCtrl = TextEditingController();
  bool _busy = false;

  @override
  void dispose() {
    _nameCtrl.dispose();
    _msgCtrl.dispose();
    super.dispose();
  }

  Future<void> _send() async {
    final name = _nameCtrl.text.trim();
    final msg = _msgCtrl.text.trim();
    if (name.isEmpty || msg.isEmpty) return;

    setState(() => _busy = true);
    try {
      final customerId = 'customer-${DateTime.now().millisecondsSinceEpoch}';
      final chatId = await ChatService.ensureRoom(
        customerId: customerId,
        venueId: widget.venueId,
        customerName: name,
        venueName: widget.venueName,
      );
      await ChatService.sendMessage(
        chatId: chatId,
        senderId: 'vendor',
        senderRole: 'vendor',
        text: msg,
      );
      if (mounted) Navigator.pop(context, chatId);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e'), backgroundColor: AppColors.danger));
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
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
            const Text('New Conversation', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 20)),
            const SizedBox(height: 6),
            const Text('Start a new chat with a customer.', style: TextStyle(color: AppColors.muted, fontSize: 14)),
            const SizedBox(height: 20),
            TextField(
              controller: _nameCtrl,
              decoration: const InputDecoration(labelText: 'Customer Name *'),
            ),
            const SizedBox(height: 14),
            TextField(
              controller: _msgCtrl,
              maxLines: 4,
              decoration: const InputDecoration(labelText: 'Your Message *'),
            ),
            const SizedBox(height: 20),
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
                const SizedBox(width: 8),
                ElevatedButton(
                  onPressed: _busy ? null : _send,
                  child: Text(_busy ? 'Sending...' : 'Send'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

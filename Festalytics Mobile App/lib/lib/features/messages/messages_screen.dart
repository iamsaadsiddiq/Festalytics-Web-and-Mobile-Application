import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/app_widgets.dart';
import '../../providers/app_auth_provider.dart' as app;
import '../../services/chat_service.dart';
import '../../web_clone/src/components/chat/CounterOfferCard.dart';
import '../../web_clone/src/components/vendor/messages/ChatQuickReplies.dart';

class MessagesScreen extends StatefulWidget {
  const MessagesScreen({super.key});
  @override
  State<MessagesScreen> createState() => _MessagesScreenState();
}

class _MessagesScreenState extends State<MessagesScreen> {
  String? _activeChat;
  final _message = TextEditingController();
  @override
  void dispose() { _message.dispose(); super.dispose(); }
  @override
  Widget build(BuildContext context) {
    final venueId = context.watch<app.AppAuthProvider>().currentUser?.venueId ?? '';
    return Scaffold(
      appBar: AppBar(
        title: const Text('Messages'),
        actions: _activeChat != null
            ? [
                IconButton(
                  icon: const Icon(Icons.quickreply),
                  tooltip: 'Quick replies',
                  onPressed: () => _showQuickReplies(context),
                ),
              ]
            : null,
      ),
      body: venueId.isEmpty ? const EmptyState(icon: Icons.chat_bubble_outline, title: 'No venue linked', subtitle: 'Vendor inbox needs a venue.') : _activeChat == null ? _inbox(venueId) : _thread(),
    );
  }

  Widget _inbox(String venueId) => StreamBuilder<List<Map<String, dynamic>>>(
    stream: ChatService.streamInbox(venueId),
    builder: (_, snap) {
      if (!snap.hasData) return const LoadingView();
      final rows = snap.data!;
      if (rows.isEmpty) return const EmptyState(icon: Icons.inbox_outlined, title: 'No conversations', subtitle: 'Customer chats started from venue pages will appear here.');
      return ListView.builder(padding: const EdgeInsets.all(18), itemCount: rows.length, itemBuilder: (_, i) => Padding(padding: const EdgeInsets.only(bottom: 10), child: CandyCard(onTap: () => setState(() => _activeChat = rows[i]['id'].toString()), child: Row(children: [const CircleAvatar(child: Icon(Icons.person)), const SizedBox(width: 12), Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text((rows[i]['customerName'] ?? 'Customer').toString(), style: const TextStyle(fontWeight: FontWeight.w900)), Text((rows[i]['lastMessage'] ?? '').toString(), maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(color: AppColors.muted))])), const Icon(Icons.chevron_right)]))));
    },
  );

  Widget _thread() => Column(children: [
    Material(color: Colors.white, child: ListTile(
      leading: IconButton(icon: const Icon(Icons.arrow_back), onPressed: () => setState(() => _activeChat = null)),
      title: Text(_activeChat ?? 'Chat'),
    )),
    Expanded(child: StreamBuilder<List<Map<String, dynamic>>>(stream: ChatService.streamMessages(_activeChat!), builder: (_, snap) {
      if (!snap.hasData) return const LoadingView();
      final rows = snap.data!;
      return ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: rows.length,
        itemBuilder: (_, i) {
          final msg = rows[i];
          final mine = msg['senderRole'] == 'vendor';
          if (msg['text'] != null && msg['text'] is String && msg['text'].toString().trim().isNotEmpty) {
            return Align(
              alignment: mine ? Alignment.centerRight : Alignment.centerLeft,
              child: Container(
                margin: const EdgeInsets.only(bottom: 8),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(color: mine ? AppColors.primary : Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.border)),
                child: Text((msg['text'] ?? '').toString(), style: TextStyle(color: mine ? Colors.white : AppColors.text)),
              ),
            );
          }
          final offerData = msg['counterOffer'] is Map ? Map<String, dynamic>.from(msg['counterOffer']) : null;
          if (offerData != null) {
            return CounterOfferCard(
              offer: offerData,
              onAccept: () => _respondCounterOffer('accepted'),
              onDecline: () => _respondCounterOffer('declined'),
              onCounter: () => _showCounterDialog(offerData),
            );
          }
          final extra = msg['extraData'] is Map ? Map<String, dynamic>.from(msg['extraData']) : null;
          if (extra != null && extra['type'] == 'counter_offer' && extra['offer'] is Map) {
            return CounterOfferCard(
              offer: Map<String, dynamic>.from(extra['offer']),
              onAccept: () => _respondCounterOffer('accepted'),
              onDecline: () => _respondCounterOffer('declined'),
              onCounter: () => _showCounterDialog(Map<String, dynamic>.from(extra['offer'])),
            );
          }
          return const SizedBox.shrink();
        },
      );
    })),
    SafeArea(top: false, child: Padding(padding: const EdgeInsets.all(10), child: Row(children: [
      Expanded(child: TextField(controller: _message, decoration: const InputDecoration(hintText: 'Type reply...'))),
      const SizedBox(width: 8),
      IconButton.filled(onPressed: () async { final text = _message.text.trim(); if (text.isEmpty) return; _message.clear(); await ChatService.sendMessage(chatId: _activeChat!, senderId: FirebaseAuth.instance.currentUser?.uid ?? 'vendor', senderRole: 'vendor', text: text); }, icon: const Icon(Icons.send)),
      const SizedBox(width: 4),
      IconButton(
        icon: const Icon(Icons.quickreply),
        onPressed: () => _showQuickReplies(context),
      ),
    ]))),
  ]);

  Future<void> _respondCounterOffer(String status) async {
    await ChatService.sendMessage(
      chatId: _activeChat!,
      senderId: FirebaseAuth.instance.currentUser?.uid ?? 'vendor',
      senderRole: 'vendor',
      text: 'Counter-offer $status',
      extraData: {'counterOfferResponse': status},
    );
  }

  void _showCounterDialog(Map<String, dynamic> currentOffer) {
    final perPlateCtrl = TextEditingController(text: currentOffer['perPlatePrice']?.toString() ?? '');
    final guestsCtrl = TextEditingController(text: currentOffer['guestCount']?.toString() ?? '');
    final notesCtrl = TextEditingController();
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (_) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            const Text('Edit Counter Offer', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 18)),
            const SizedBox(height: 16),
            TextField(controller: perPlateCtrl, decoration: const InputDecoration(labelText: 'Per Plate Price'), keyboardType: TextInputType.number),
            const SizedBox(height: 12),
            TextField(controller: guestsCtrl, decoration: const InputDecoration(labelText: 'Guest Count'), keyboardType: TextInputType.number),
            const SizedBox(height: 12),
            TextField(controller: notesCtrl, decoration: const InputDecoration(labelText: 'Notes'), maxLines: 3),
            const SizedBox(height: 16),
            SizedBox(width: double.infinity, child: ElevatedButton(onPressed: () async {
              final offer = <String, dynamic>{
                'perPlatePrice': int.tryParse(perPlateCtrl.text) ?? 0,
                'guestCount': int.tryParse(guestsCtrl.text) ?? 0,
                'notes': notesCtrl.text,
                'status': 'pending',
              };
              await ChatService.sendMessage(
                chatId: _activeChat!,
                senderId: FirebaseAuth.instance.currentUser?.uid ?? 'vendor',
                senderRole: 'vendor',
                text: 'New counter offer submitted',
                extraData: {'type': 'counter_offer', 'offer': offer},
              );
              if (mounted) Navigator.pop(context);
            }, child: const Text('Submit Counter Offer'))),
          ]),
        ),
      ),
    );
  }

  void _showQuickReplies(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (_) => ChatQuickReplies(
        onSelect: (reply) async {
          Navigator.pop(context);
          await ChatService.sendMessage(
            chatId: _activeChat!,
            senderId: FirebaseAuth.instance.currentUser?.uid ?? 'vendor',
            senderRole: 'vendor',
            text: reply,
          );
        },
        onManageTemplates: () {
          Navigator.pop(context);
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Template management coming soon')));
        },
      ),
    );
  }
}

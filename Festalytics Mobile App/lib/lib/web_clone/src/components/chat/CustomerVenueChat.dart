import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/widgets/app_widgets.dart';
import '../../../../providers/app_auth_provider.dart' as app;
import '../../../../services/chat_service.dart';

class CustomerVenueChat extends StatefulWidget {
  final String venueId;
  final String venueName;

  const CustomerVenueChat({
    super.key,
    required this.venueId,
    required this.venueName,
  });

  @override
  State<CustomerVenueChat> createState() => _CustomerVenueChatState();
}

class _CustomerVenueChatState extends State<CustomerVenueChat> {
  final _message = TextEditingController();
  final _scroll = ScrollController();
  String? _chatId;

  @override
  void initState() {
    super.initState();
    _initChat();
  }

  Future<void> _initChat() async {
    final auth = context.read<app.AppAuthProvider>();
    final uid = auth.uid;
    if (uid == null) return;
    final name = auth.currentUser?.fullName.isNotEmpty == true
        ? auth.currentUser!.fullName
        : auth.firebaseUser?.displayName ?? 'Customer';
    final id = await ChatService.ensureRoom(
      customerId: uid,
      venueId: widget.venueId,
      customerName: name,
      venueName: widget.venueName,
    );
    if (mounted) setState(() => _chatId = id);
  }

  @override
  void dispose() {
    _message.dispose();
    _scroll.dispose();
    super.dispose();
  }

  Future<void> _send() async {
    final text = _message.text.trim();
    if (text.isEmpty || _chatId == null) return;
    _message.clear();
    final uid = context.read<app.AppAuthProvider>().uid ?? 'customer';
    await ChatService.sendMessage(
      chatId: _chatId!,
      senderId: uid,
      senderRole: 'customer',
      text: text,
    );
    Future.delayed(const Duration(milliseconds: 100), () {
      if (_scroll.hasClients) {
        _scroll.animateTo(
          _scroll.position.maxScrollExtent,
          duration: const Duration(milliseconds: 200),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_chatId == null) {
      return const LoadingView(label: 'Starting chat...');
    }

    return Column(
      children: [
        Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: BoxDecoration(
            color: Colors.white,
            border: Border(bottom: BorderSide(color: AppColors.border)),
          ),
          child: Row(
            children: [
              const Icon(Icons.chat_bubble_outline, color: AppColors.primary),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Chat with vendor',
                        style: TextStyle(
                            fontWeight: FontWeight.w800, fontSize: 15)),
                    Text(widget.venueName,
                        style: const TextStyle(
                            color: AppColors.muted, fontSize: 12)),
                  ],
                ),
              ),
            ],
          ),
        ),
        Expanded(
          child: StreamBuilder<List<Map<String, dynamic>>>(
            stream: ChatService.streamMessages(_chatId!),
            builder: (_, snap) {
              if (!snap.hasData) {
                return const LoadingView(label: 'Loading messages...');
              }
              final messages = snap.data!;
              if (messages.isEmpty) {
                return const EmptyState(
                  icon: Icons.chat_bubble_outline,
                  title: 'No messages yet',
                  subtitle: 'Send a message to start the conversation.',
                );
              }
              return ListView.builder(
                controller: _scroll,
                padding: const EdgeInsets.all(16),
                itemCount: messages.length,
                itemBuilder: (_, i) {
                  final msg = messages[i];
                  final mine = msg['senderRole'] == 'customer';
                  return Align(
                    alignment:
                        mine ? Alignment.centerRight : Alignment.centerLeft,
                    child: Container(
                      margin: const EdgeInsets.only(bottom: 8),
                      padding: const EdgeInsets.all(12),
                      constraints:
                          BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.75),
                      decoration: BoxDecoration(
                        color: mine ? AppColors.primary : Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        border: mine
                            ? null
                            : Border.all(color: AppColors.border),
                      ),
                      child: Text(
                        (msg['text'] ?? '').toString(),
                        style: TextStyle(
                          color: mine ? Colors.white : AppColors.text,
                        ),
                      ),
                    ),
                  );
                },
              );
            },
          ),
        ),
        SafeArea(
          top: false,
          child: Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: Colors.white,
              border: Border(top: BorderSide(color: AppColors.border)),
            ),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _message,
                    decoration: const InputDecoration(
                      hintText: 'Type a message...',
                      contentPadding:
                          EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.all(Radius.circular(24)),
                      ),
                    ),
                    onSubmitted: (_) => _send(),
                  ),
                ),
                const SizedBox(width: 8),
                IconButton.filled(
                  onPressed: _send,
                  icon: const Icon(Icons.send),
                  style: IconButton.styleFrom(
                    backgroundColor: AppColors.primary,
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

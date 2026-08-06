import 'dart:async';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import '../../../../../core/theme/app_theme.dart';
import '../../../../../core/widgets/app_widgets.dart';
import '../../../../../services/chat_service.dart';

class ChatThread extends StatefulWidget {
  final String chatId;
  final String venueId;
  final VoidCallback onBack;
  final VoidCallback? onShowQuickReplies;
  const ChatThread({super.key, required this.chatId, required this.venueId, required this.onBack, this.onShowQuickReplies});

  @override
  State<ChatThread> createState() => _ChatThreadState();
}

class _ChatThreadState extends State<ChatThread> {
  final _msgCtrl = TextEditingController();
  final _scrollCtrl = ScrollController();
  List<Map<String, dynamic>>? _messages;
  StreamSubscription? _sub;

  @override
  void initState() {
    super.initState();
    _sub = ChatService.streamMessages(widget.chatId).listen((msgs) {
      if (mounted) {
        setState(() => _messages = msgs);
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (_scrollCtrl.hasClients) _scrollCtrl.animateTo(_scrollCtrl.position.maxScrollExtent, duration: const Duration(milliseconds: 200), curve: Curves.easeOut);
        });
      }
    });
  }

  @override
  void didUpdateWidget(ChatThread oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.chatId != widget.chatId) {
      _sub?.cancel();
      _messages = null;
      _sub = ChatService.streamMessages(widget.chatId).listen((msgs) {
        if (mounted) {
          setState(() => _messages = msgs);
          WidgetsBinding.instance.addPostFrameCallback((_) {
            if (_scrollCtrl.hasClients) _scrollCtrl.animateTo(_scrollCtrl.position.maxScrollExtent, duration: const Duration(milliseconds: 200), curve: Curves.easeOut);
          });
        }
      });
    }
  }

  @override
  void dispose() {
    _sub?.cancel();
    _msgCtrl.dispose();
    _scrollCtrl.dispose();
    super.dispose();
  }

  Future<void> _send() async {
    final text = _msgCtrl.text.trim();
    if (text.isEmpty) return;
    _msgCtrl.clear();
    await ChatService.sendMessage(
      chatId: widget.chatId,
      senderId: FirebaseAuth.instance.currentUser?.uid ?? 'vendor',
      senderRole: 'vendor',
      text: text,
    );
  }

  @override
  Widget build(BuildContext context) {
    final msgs = _messages;

    return Column(
      children: [
        Container(
          color: Colors.white,
          child: ListTile(
            leading: IconButton(icon: const Icon(Icons.arrow_back), onPressed: widget.onBack),
            title: Text(widget.chatId.replaceAll('_', ' '), style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 15)),
            trailing: widget.onShowQuickReplies != null
                ? IconButton(icon: const Icon(Icons.quickreply_outlined, color: AppColors.primary), onPressed: widget.onShowQuickReplies)
                : null,
          ),
        ),
        const Divider(height: 1),
        Expanded(
          child: msgs == null
              ? const LoadingView()
              : msgs.isEmpty
                  ? const EmptyState(icon: Icons.chat_outlined, title: 'No messages yet', subtitle: 'Start the conversation.')
                  : ListView.builder(
                      controller: _scrollCtrl,
                      padding: const EdgeInsets.all(16),
                      itemCount: msgs.length,
                      itemBuilder: (_, i) {
                        final msg = msgs[i];
                        final mine = msg['senderRole'] == 'vendor';
                        final time = msg['createdAt']?.toString() ?? '';
                        return Align(
                          alignment: mine ? Alignment.centerRight : Alignment.centerLeft,
                          child: Container(
                            margin: const EdgeInsets.only(bottom: 8),
                            padding: const EdgeInsets.all(12),
                            constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * .75),
                            decoration: BoxDecoration(
                              color: mine ? AppColors.primary : Colors.white,
                              borderRadius: BorderRadius.circular(16).copyWith(
                                bottomRight: mine ? const Radius.circular(4) : null,
                                bottomLeft: !mine ? const Radius.circular(4) : null,
                              ),
                              border: mine ? null : Border.all(color: AppColors.border),
                            ),
                            child: Column(
                              crossAxisAlignment: mine ? CrossAxisAlignment.end : CrossAxisAlignment.start,
                              children: [
                                Text(msg['text']?.toString() ?? '', style: TextStyle(color: mine ? Colors.white : AppColors.text, fontSize: 14)),
                                const SizedBox(height: 3),
                                Text(_formatTime(time), style: TextStyle(fontSize: 10, color: mine ? Colors.white60 : AppColors.muted)),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
        ),
        SafeArea(
          top: false,
          child: Container(
            padding: const EdgeInsets.all(10),
            color: Colors.white,
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _msgCtrl,
                    decoration: const InputDecoration(hintText: 'Type a message...', isDense: true, contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 12)),
                    onSubmitted: (_) => _send(),
                  ),
                ),
                const SizedBox(width: 8),
                IconButton.filled(
                  onPressed: _send,
                  icon: const Icon(Icons.send, size: 20),
                  style: IconButton.styleFrom(backgroundColor: AppColors.primary, foregroundColor: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14))),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  String _formatTime(String iso) {
    final dt = DateTime.tryParse(iso);
    if (dt == null) return '';
    final h = dt.hour > 12 ? dt.hour - 12 : dt.hour;
    final am = dt.hour >= 12 ? 'PM' : 'AM';
    return '${h.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')} $am';
  }
}

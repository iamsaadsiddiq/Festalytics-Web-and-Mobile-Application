import 'dart:async';
import 'package:flutter/material.dart';
import '../../../../../core/theme/app_theme.dart';
import '../../../../../core/widgets/app_widgets.dart';
import '../../../../../services/chat_service.dart';

class ChatSidebar extends StatefulWidget {
  final String venueId;
  final String? activeChatId;
  final ValueChanged<String> onChatSelected;
  final VoidCallback onCompose;
  const ChatSidebar({super.key, required this.venueId, this.activeChatId, required this.onChatSelected, required this.onCompose});

  @override
  State<ChatSidebar> createState() => _ChatSidebarState();
}

class _ChatSidebarState extends State<ChatSidebar> {
  List<Map<String, dynamic>>? _rooms;
  StreamSubscription? _sub;

  @override
  void initState() {
    super.initState();
    _sub = ChatService.streamInbox(widget.venueId).listen((rooms) {
      if (mounted) setState(() => _rooms = rooms);
    });
  }

  @override
  void didUpdateWidget(ChatSidebar oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.venueId != widget.venueId) {
      _sub?.cancel();
      _sub = ChatService.streamInbox(widget.venueId).listen((rooms) {
        if (mounted) setState(() => _rooms = rooms);
      });
    }
  }

  @override
  void dispose() {
    _sub?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final rooms = _rooms;
    if (rooms == null) return const LoadingView();

    return Column(
      children: [
        Container(
          padding: const EdgeInsets.all(12),
          color: Colors.white,
          child: Row(
            children: [
              const Expanded(child: Text('Conversations', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 16))),
              IconButton(
                icon: const Icon(Icons.edit_outlined, color: AppColors.primary),
                onPressed: widget.onCompose,
                tooltip: 'New conversation',
              ),
            ],
          ),
        ),
        const Divider(height: 1),
        Expanded(
          child: rooms.isEmpty
              ? const Center(child: Text('No conversations yet.', style: TextStyle(color: AppColors.muted)))
              : ListView.builder(
                  itemCount: rooms.length,
                  itemBuilder: (_, i) {
                    final room = rooms[i];
                    final id = room['id']?.toString() ?? '';
                    final active = id == widget.activeChatId;
                    final name = room['customerName']?.toString() ?? 'Customer';
                    final lastMsg = room['lastMessage']?.toString() ?? '';
                    return Container(
                      color: active ? AppColors.primary.withValues(alpha: .06) : null,
                      child: ListTile(
                        selected: active,
                        leading: CircleAvatar(
                          backgroundColor: active ? AppColors.primary : AppColors.primary.withValues(alpha: .1),
                          child: Text(name[0].toUpperCase(), style: TextStyle(color: active ? Colors.white : AppColors.primary, fontWeight: FontWeight.w800)),
                        ),
                        title: Text(name, style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14, color: active ? AppColors.primary : AppColors.text)),
                        subtitle: lastMsg.isNotEmpty ? Text(lastMsg, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 12, color: AppColors.muted)) : null,
                        trailing: const Icon(Icons.chevron_right, size: 18, color: AppColors.muted),
                        onTap: () => widget.onChatSelected(id),
                      ),
                    );
                  },
                ),
        ),
      ],
    );
  }
}

import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../services/ai_backend_service.dart';
import 'ChatBubble.dart';

class AIPlannerWidget extends StatefulWidget {
  final String initialMessage;
  const AIPlannerWidget({super.key, this.initialMessage = 'Hi! Tell me your event type, budget, guests and area. I will plan it using the same RAG backend as the web AI Planner.'});

  @override
  State<AIPlannerWidget> createState() => _AIPlannerWidgetState();
}

class _AIPlannerWidgetState extends State<AIPlannerWidget> {
  final _input = TextEditingController();
  final _scroll = ScrollController();
  final List<Map<String, String>> _messages = [];
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    _messages.add({'role': 'assistant', 'content': widget.initialMessage});
  }

  @override
  void dispose() {
    _input.dispose();
    _scroll.dispose();
    super.dispose();
  }

  Future<void> _send() async {
    final text = _input.text.trim();
    if (text.isEmpty) return;
    setState(() {
      _messages.add({'role': 'user', 'content': text});
      _input.clear();
      _busy = true;
    });
    _scrollDown();
    try {
      final answer = await AiBackendService.askPlanner(text, history: _messages);
      final reply = (answer['reply'] ?? answer['answer'] ?? answer['response'] ?? answer.toString()).toString();
      if (mounted) setState(() => _messages.add({'role': 'assistant', 'content': reply}));
    } catch (e) {
      if (mounted) setState(() => _messages.add({'role': 'assistant', 'content': 'Backend error: $e'}));
    } finally {
      if (mounted) setState(() => _busy = false);
      _scrollDown();
    }
  }

  void _scrollDown() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scroll.hasClients) _scroll.animateTo(_scroll.position.maxScrollExtent, duration: const Duration(milliseconds: 200), curve: Curves.easeOut);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Column(children: [
      Expanded(
        child: ListView.builder(
          controller: _scroll,
          padding: const EdgeInsets.all(16),
          itemCount: _messages.length + (_busy ? 1 : 0),
          itemBuilder: (_, i) {
            if (i == _messages.length) {
              return const Align(alignment: Alignment.centerLeft, child: Padding(padding: EdgeInsets.all(8), child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary)));
            }
            final m = _messages[i];
            return ChatBubbleWidget(role: m['role']!, content: m['content']!);
          },
        ),
      ),
      SafeArea(
        top: false,
        child: Container(
          decoration: const BoxDecoration(color: Colors.white, border: Border(top: BorderSide(color: AppColors.border))),
          padding: EdgeInsets.only(left: 12, right: 12, top: 8, bottom: MediaQuery.of(context).padding.bottom + 8),
          child: Row(children: [
            Expanded(
              child: TextField(
                controller: _input,
                minLines: 1,
                maxLines: 4,
                textInputAction: TextInputAction.send,
                onSubmitted: (_) => _send(),
                decoration: const InputDecoration(hintText: 'Ask for venue, package, budget plan...', contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 12), isDense: true),
              ),
            ),
            const SizedBox(width: 8),
            IconButton.filled(onPressed: _busy ? null : _send, icon: const Icon(Icons.send_rounded, size: 20)),
          ]),
        ),
      ),
    ]);
  }
}

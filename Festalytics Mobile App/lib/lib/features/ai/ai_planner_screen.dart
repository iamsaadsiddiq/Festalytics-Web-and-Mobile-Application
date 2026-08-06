import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/auth_gate_modal.dart';
import '../../models/venue.dart';
import '../../services/ai_backend_service.dart';
import '../../core/routes/app_routes.dart';
import '../../providers/app_auth_provider.dart' as app;
import '../../web_clone/src/components/ai-planner/ChatBubble.dart';
import '../../web_clone/src/components/ai-planner/QuickActionButton.dart';
import '../../web_clone/src/components/ai-planner/VendorCard.dart';

const _quickActions = [
  ('Wedding Halls', Icons.favorite, 'Find me wedding halls in Lahore for 300 guests'),
  ('Budget Plan', Icons.attach_money, 'Help me plan a wedding budget breakdown'),
  ('Catering', Icons.restaurant, 'Show me catering packages for 200 guests'),
  ('Small Event', Icons.meeting_room, 'Find venues for a 50-person corporate event'),
];

class AiPlannerScreen extends StatefulWidget {
  const AiPlannerScreen({super.key});
  @override
  State<AiPlannerScreen> createState() => _AiPlannerScreenState();
}

class _AiPlannerScreenState extends State<AiPlannerScreen> {
  final _input = TextEditingController();
  final _scroll = ScrollController();
  final List<Map<String, dynamic>> _messages = [
    {'role': 'assistant', 'content': 'Hi! Tell me your event type, budget, guests and area. I will plan it using the same RAG backend as the web AI Planner.', 'halls': <Map<String, dynamic>>[]},
  ];
  bool _busy = false;
  bool _authGateOpen = false;
  List<Venue> _matchedVenues = [];
  String? _pendingMessage;

  @override
  void dispose() {
    _input.dispose();
    _scroll.dispose();
    super.dispose();
  }

  void _requireAuth(String text) {
    final auth = context.read<app.AppAuthProvider>();
    if (auth.isLoggedIn) {
      _doSend(text);
    } else {
      setState(() {
        _pendingMessage = text;
        _authGateOpen = true;
      });
    }
  }

  void _handleAuthSuccess() {
    setState(() => _authGateOpen = false);
    if (_pendingMessage != null) {
      _doSend(_pendingMessage!);
      _pendingMessage = null;
    }
  }

  Future<void> _doSend(String text) async {
    if (text.isEmpty) return;
    setState(() {
      _messages.add({'role': 'user', 'content': text, 'halls': <Map<String, dynamic>>[]});
      _input.clear();
      _busy = true;
    });
    _scrollDown();
    try {
      final result = await AiBackendService.askPlanner(text, history: _messages);
      final reply = (result['reply'] ?? result['answer'] ?? result['response'] ?? result.toString()).toString();
      final halls = (result['halls'] as List<dynamic>?)?.map((e) => e is Map<String, dynamic> ? e : <String, dynamic>{}).toList() ?? <Map<String, dynamic>>[];
      final sanitized = reply;
      if (mounted) {
        setState(() {
          _messages.add({'role': 'assistant', 'content': sanitized, 'halls': halls});
          _matchedVenues = _parseVenues(sanitized);
        });
      }
    } catch (e) {
      if (mounted) setState(() => _messages.add({'role': 'assistant', 'content': 'Backend error: $e', 'halls': <Map<String, dynamic>>[]}));
    } finally {
      if (mounted) setState(() => _busy = false);
      _scrollDown();
    }
  }

  Future<void> _send() async {
    final text = _input.text.trim();
    if (text.isEmpty) return;
    _requireAuth(text);
  }

  void _scrollDown() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scroll.hasClients) _scroll.animateTo(_scroll.position.maxScrollExtent, duration: const Duration(milliseconds: 200), curve: Curves.easeOut);
    });
  }

  List<Venue> _parseVenues(String text) {
    final venues = <Venue>[];
    final jsonPattern = RegExp(r'\{[^}]+\}');
    for (final match in jsonPattern.allMatches(text)) {
      try {
        final data = _looseJsonParse(match.group(0)!);
        if (data != null && data['name'] != null) {
          venues.add(Venue(
            id: data['id']?.toString() ?? '',
            name: data['name'].toString(),
            hallName: data['hallName']?.toString() ?? data['name'].toString(),
            description: data['description']?.toString() ?? '',
            streetAddress: data['address']?.toString() ?? data['streetAddress']?.toString() ?? '',
            city: data['city']?.toString() ?? 'Lahore',
            capacity: int.tryParse(data['capacity']?.toString() ?? '') ?? 0,
            images: data['image'] != null ? [data['image'].toString()] : [],
          ));
        }
      } catch (_) {}
    }
    final namePattern = RegExp(r'(?:venue|hall|place)[:\s]+"([^"]+)"', caseSensitive: false);
    if (venues.isEmpty) {
      for (final match in namePattern.allMatches(text)) {
        final name = match.group(1);
        if (name != null && name.length > 2) {
          venues.add(Venue(id: '', name: name, hallName: name));
        }
      }
    }
    return venues;
  }

  Map<String, dynamic>? _looseJsonParse(String json) {
    try {
      final cleaned = json.replaceAll("'", '"').replaceAll(RegExp(r'([a-zA-Z0-9_]+):'), r'"$1":');
      final parsed = _parseSimpleJson(cleaned);
      return parsed;
    } catch (_) {
      return null;
    }
  }

  Map<String, dynamic>? _parseSimpleJson(String text) {
    try {
      final result = <String, dynamic>{};
      final entries = text.replaceAll(RegExp(r'[{}]'), '').split(',');
      for (final entry in entries) {
        final parts = entry.split(':');
        if (parts.length >= 2) {
          final key = parts[0].trim().replaceAll('"', '');
          final value = parts.sublist(1).join(':').trim().replaceAll('"', '');
          result[key] = value;
        }
      }
      return result.isNotEmpty ? result : null;
    } catch (_) {
      return null;
    }
  }

  void _quickSend(String text) {
    _input.text = text;
    _requireAuth(text);
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        Scaffold(
          appBar: AppBar(
            title: const Text('AI Event Planner'),
        actions: [
          if (_matchedVenues.isNotEmpty)
            IconButton(
              icon: const Icon(Icons.clear_all),
              tooltip: 'Clear venue suggestions',
              onPressed: () => setState(() => _matchedVenues.clear()),
            ),
        ],
      ),
      body: Column(children: [
        Container(
          padding: const EdgeInsets.fromLTRB(12, 8, 12, 4),
          child: SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(children: [
              for (final (label, icon, query) in _quickActions)
                QuickActionButtonWidget(
                  label: label,
                  icon: icon,
                  onTap: () => _quickSend(query),
                ),
            ]),
          ),
        ),
        if (_matchedVenues.isNotEmpty)
          Container(
            padding: const EdgeInsets.fromLTRB(16, 4, 16, 8),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisSize: MainAxisSize.min, children: [
              Text('Suggested Venues', style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w800)),
              const SizedBox(height: 8),
              SizedBox(
                height: 100,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  itemCount: _matchedVenues.length,
                  separatorBuilder: (_, __) => const SizedBox(width: 10),
                  itemBuilder: (_, i) => SizedBox(
                    width: 200,
                    child: VendorCardWidget(
                      venue: _matchedVenues[i],
                      matchScore: 1.0 - (i * 0.1),
                      onTap: () => Navigator.pushNamed(context, AppRoutes.venue, arguments: _matchedVenues[i].id),
                    ),
                  ),
                ),
              ),
            ]),
          ),
        Expanded(
          child: ListView.builder(
            controller: _scroll,
            padding: const EdgeInsets.all(16),
            itemCount: _messages.length + (_busy ? 1 : 0),
            itemBuilder: (_, i) {
              if (i == _messages.length) return const Align(alignment: Alignment.centerLeft, child: Padding(padding: EdgeInsets.all(8), child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary)));
              final m = _messages[i];
              return ChatBubbleWidget(role: m['role'] as String? ?? 'assistant', content: m['content'] as String? ?? '', halls: (m['halls'] as List<dynamic>?)?.cast<Map<String, dynamic>>());
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
                  decoration: const InputDecoration(
                    hintText: 'Ask for venue, package, budget plan...',
                    contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    isDense: true,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              IconButton.filled(onPressed: _busy ? null : _send, icon: const Icon(Icons.send_rounded, size: 20)),
            ]),
          ),
        ),
      ]),
    ),
        if (_authGateOpen)
          AuthGateModal(
            action: 'ai',
            onClose: () => setState(() { _authGateOpen = false; _pendingMessage = null; }),
            onSuccess: _handleAuthSuccess,
          ),
      ],
    );
  }
}

import 'package:flutter/material.dart';

class MarkdownMessage extends StatelessWidget {
  final String text;
  const MarkdownMessage({super.key, required this.text});

  @override
  Widget build(BuildContext context) {
    final lines = text.split('\n');
    final blocks = <Widget>[];
    final listItems = <String>[];

    void flushList() {
      if (listItems.isEmpty) return;
      blocks.add(Padding(
        padding: const EdgeInsets.only(top: 6, bottom: 6),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: listItems.map((item) => Padding(
            padding: const EdgeInsets.only(bottom: 4),
            child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Padding(padding: const EdgeInsets.only(top: 6, right: 8), child: Container(width: 6, height: 6, decoration: const BoxDecoration(shape: BoxShape.circle, color: Color(0xFFD6336C)))),
              Expanded(child: _renderInline(item)),
            ]),
          )).toList(),
        ),
      ));
      listItems.clear();
    }

    for (final raw in lines) {
      final line = raw.trim();
      if (line.isEmpty) { flushList(); continue; }

      final bulletMatch = RegExp(r'^[-•]\s+(.+)$').firstMatch(line);
      if (bulletMatch != null) { listItems.add(bulletMatch.group(1)!); continue; }

      flushList();

      if (line.startsWith('### ')) {
        blocks.add(Padding(padding: const EdgeInsets.only(top: 12, bottom: 4), child: Text(line.substring(4), style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w900))));
      } else if (line.startsWith('## ')) {
        blocks.add(Padding(padding: const EdgeInsets.only(top: 8, bottom: 4), child: Text(line.substring(3), style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900))));
      } else if (line.startsWith('# ')) {
        blocks.add(Padding(padding: const EdgeInsets.only(top: 8, bottom: 4), child: Text(line.substring(2), style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900))));
      } else if (line.startsWith('> ')) {
        blocks.add(Container(
          margin: const EdgeInsets.symmetric(vertical: 6),
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(color: Colors.amber.shade50, borderRadius: BorderRadius.circular(12), border: Border.all(color: Colors.amber.shade100)),
          child: _renderInline(line.substring(2)),
        ));
      } else {
        blocks.add(Padding(padding: const EdgeInsets.only(top: 2, bottom: 2), child: _renderInline(line)));
      }
    }
    flushList();

    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: blocks);
  }

  Widget _renderInline(String text) {
    final spans = <TextSpan>[];
    final regex = RegExp(r'(\*\*[^*]+\*\*|\*[^*]+\*)');
    int last = 0;

    for (final match in regex.allMatches(text)) {
      if (match.start > last) {
        spans.add(TextSpan(text: text.substring(last, match.start)));
      }
      final token = match.group(1)!;
      if (token.startsWith('**')) {
        spans.add(TextSpan(text: token.substring(2, token.length - 2), style: const TextStyle(fontWeight: FontWeight.w900)));
      } else {
        spans.add(TextSpan(text: token.substring(1, token.length - 1), style: const TextStyle(fontStyle: FontStyle.italic)));
      }
      last = match.end;
    }
    if (last < text.length) {
      spans.add(TextSpan(text: text.substring(last)));
    }

    return RichText(text: TextSpan(style: const TextStyle(fontSize: 14, color: Color(0xFF1A202C)), children: spans));
  }
}

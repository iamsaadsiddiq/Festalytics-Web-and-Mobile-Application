class VenueFaq {
  final String id;
  final String question;
  final String answer;
  final bool active;

  VenueFaq({
    required this.id,
    required this.question,
    required this.answer,
    this.active = true,
  });

  factory VenueFaq.fromMap(Map<String, dynamic> data) => VenueFaq(
    id: data['id'] ?? '',
    question: data['question'] ?? '',
    answer: data['answer'] ?? '',
    active: data['active'] ?? true,
  );

  Map<String, dynamic> toMap() => {
    'id': id,
    'question': question,
    'answer': answer,
    'active': active,
  };
}

class VenueFaqs {
  static List<VenueFaq> normalizeFaqs(List<dynamic> rawFaqs) {
    return rawFaqs.map((faq) {
      if (faq is VenueFaq) return faq;
      return VenueFaq.fromMap(Map<String, dynamic>.from(faq));
    }).toList();
  }

  static List<Map<String, dynamic>> toMapList(List<VenueFaq> faqs) =>
      faqs.map((f) => f.toMap()).toList();

  static List<VenueFaq> filterActive(List<VenueFaq> faqs) =>
      faqs.where((f) => f.active).toList();

  static String generateId() =>
      'faq-${DateTime.now().millisecondsSinceEpoch}';

  static VenueFaq createFaq({
    required String question,
    required String answer,
    bool active = true,
  }) {
    return VenueFaq(
      id: generateId(),
      question: question,
      answer: answer,
      active: active,
    );
  }

  static VenueFaq updateFaq(VenueFaq faq, {
    String? question,
    String? answer,
    bool? active,
  }) {
    return VenueFaq(
      id: faq.id,
      question: question ?? faq.question,
      answer: answer ?? faq.answer,
      active: active ?? faq.active,
    );
  }

  static List<VenueFaq> searchFaqs(List<VenueFaq> faqs, String query) {
    if (query.isEmpty) return faqs;
    final lower = query.toLowerCase();
    return faqs.where((f) =>
      f.question.toLowerCase().contains(lower) ||
      f.answer.toLowerCase().contains(lower)
    ).toList();
  }

  static List<VenueFaq> get defaultFaqs => [
    VenueFaq(
      id: 'faq-1',
      question: 'Is catering included in the base venue hire price?',
      answer: 'Catering is not included in the base venue rate. You can choose to add our custom catering packages.',
    ),
    VenueFaq(
      id: 'faq-2',
      question: 'What is the maximum capacity of the venue?',
      answer: 'Capacity depends on your hall setup. Contact us for exact seated and standing numbers.',
    ),
    VenueFaq(
      id: 'faq-3',
      question: 'Do you provide in-house decoration?',
      answer: 'Yes, we offer in-house decoration coordination. Custom decoration packages are also available.',
    ),
    VenueFaq(
      id: 'faq-4',
      question: 'Is parking available for guests?',
      answer: 'Yes, valet parking is available for guests. Our venue has ample parking space.',
    ),
  ];
}

class HeroSearchCategory {
  final String label;
  final String icon;
  final String query;

  const HeroSearchCategory({
    required this.label,
    required this.icon,
    required this.query,
  });
}

class HeroSearchOptions {
  static const List<HeroSearchCategory> categories = [
    HeroSearchCategory(label: 'Wedding Halls', icon: 'venue_shopping', query: 'wedding halls'),
    HeroSearchCategory(label: 'Banquet Halls', icon: 'meeting_room', query: 'banquet halls'),
    HeroSearchCategory(label: 'Marriage Halls', icon: 'celebration', query: 'marriage halls'),
    HeroSearchCategory(label: 'Lawn & Marquee', icon: 'park', query: 'lawn marquee'),
    HeroSearchCategory(label: 'Event Planner', icon: 'assistant', query: 'event planner'),
    HeroSearchCategory(label: 'Catering', icon: 'restaurant', query: 'catering'),
    HeroSearchCategory(label: 'Decoration', icon: 'palette', query: 'decoration'),
    HeroSearchCategory(label: 'Photography', icon: 'camera_alt', query: 'photography'),
  ];

  static List<String> get labels => categories.map((c) => c.label).toList();
  static List<String> get queries => categories.map((c) => c.query).toList();

  static HeroSearchCategory? findByLabel(String label) {
    try {
      return categories.firstWhere((c) => c.label == label);
    } catch (_) {
      return null;
    }
  }

  static HeroSearchCategory? findByQuery(String query) {
    try {
      return categories.firstWhere((c) => c.query == query);
    } catch (_) {
      return null;
    }
  }

  static List<HeroSearchCategory> search(String term) {
    if (term.isEmpty) return categories;
    final lower = term.toLowerCase();
    return categories.where((c) =>
      c.label.toLowerCase().contains(lower) ||
      c.query.toLowerCase().contains(lower)
    ).toList();
  }
}

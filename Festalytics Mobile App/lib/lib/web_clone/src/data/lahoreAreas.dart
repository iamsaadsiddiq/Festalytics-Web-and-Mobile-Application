class LahoreAreas {
  static const List<String> areas = [
    'Johar Town',
    'Gulberg (III)',
    'Garden Town',
    'Township',
    'Cantt (Cavalry Ground, Saddar, etc.)',
    'DHA Phase 8 (includes Park View & Air Avenue)',
    'Raiwind Road',
    'Marghzar',
    'Sabzazar',
    'Model Town',
    'Gulberg (II)',
    'Gulberg',
    'Valencia',
    'Faisal Town',
    'Wapda Town',
    'Defence',
    'Bahria Town',
    'Askari',
    'Lahore Cantonment',
    'Iqbal Town',
    'Samnabad',
    'Allama Iqbal Town',
    'Shad Bagh',
    'Ravi Road',
    'Wahdat Road',
    'Multan Road',
    'Ferozepur Road',
    'Main Boulevard',
    'Kalma Chowk',
    'Liberty Market',
    'MM Alam Road',
  ];

  static List<String> search(String query) {
    if (query.isEmpty) return areas;
    final lower = query.toLowerCase();
    return areas.where((a) => a.toLowerCase().contains(lower)).toList();
  }

  static bool isValid(String area) => areas.contains(area);

  static String normalize(String input) {
    final trimmed = input.trim();
    for (final area in areas) {
      if (area.toLowerCase() == trimmed.toLowerCase()) return area;
    }
    return trimmed;
  }
}

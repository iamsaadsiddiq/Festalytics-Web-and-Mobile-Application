import 'package:flutter_test/flutter_test.dart';

import 'package:festalytics_app/main.dart';

void main() {
  testWidgets('App builds smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(const FestalyticsApp());
    expect(find.text('Festalytics'), findsWidgets);
  });
}

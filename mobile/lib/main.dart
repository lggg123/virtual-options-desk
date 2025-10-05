import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'screens/home_screen.dart';
import 'config/theme.dart';
import 'config/supabase_config.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize Supabase
  await SupabaseConfig.initialize();
  
  runApp(
    const ProviderScope(
      child: VirtualOptionsDeskApp(),
    ),
  );
}

class VirtualOptionsDeskApp extends StatelessWidget {
  const VirtualOptionsDeskApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Virtual Options Desk',
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: ThemeMode.system,
      home: const HomeScreen(),
      debugShowCheckedModeBanner: false,
    );
  }
}

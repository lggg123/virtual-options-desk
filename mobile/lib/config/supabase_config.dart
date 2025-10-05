import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:logger/logger.dart';

class SupabaseConfig {
  static final Logger _logger = Logger();
  
  static Future<void> initialize() async {
    try {
      // Load environment variables
      await dotenv.load(fileName: ".env");
      
      final supabaseUrl = dotenv.env['SUPABASE_URL'] ?? '';
      final supabaseAnonKey = dotenv.env['SUPABASE_ANON_KEY'] ?? '';
      
      if (supabaseUrl.isEmpty || supabaseAnonKey.isEmpty) {
        _logger.w('Supabase credentials not found in .env file');
        return;
      }
      
      // Initialize Supabase
      await Supabase.initialize(
        url: supabaseUrl,
        anonKey: supabaseAnonKey,
        debug: dotenv.env['ENABLE_LOGGING'] == 'true',
      );
      
      _logger.i('✅ Supabase initialized successfully');
    } catch (e) {
      _logger.e('❌ Failed to initialize Supabase', error: e);
    }
  }
  
  static SupabaseClient get client => Supabase.instance.client;
}

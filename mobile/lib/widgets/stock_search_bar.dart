import 'package:flutter/material.dart';

class StockSearchBar extends StatefulWidget {
  final Function(String) onSymbolSelected;

  const StockSearchBar({
    super.key,
    required this.onSymbolSelected,
  });

  @override
  State<StockSearchBar> createState() => _StockSearchBarState();
}

class _StockSearchBarState extends State<StockSearchBar> {
  final TextEditingController _controller = TextEditingController();
  final List<String> _popularSymbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN', 'NVDA'];

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        TextField(
          controller: _controller,
          decoration: InputDecoration(
            hintText: 'Search symbol (e.g., AAPL)',
            prefixIcon: const Icon(Icons.search),
            suffixIcon: IconButton(
              icon: const Icon(Icons.send),
              onPressed: () {
                if (_controller.text.isNotEmpty) {
                  widget.onSymbolSelected(_controller.text.toUpperCase());
                }
              },
            ),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
          onSubmitted: (value) {
            if (value.isNotEmpty) {
              widget.onSymbolSelected(value.toUpperCase());
            }
          },
          textCapitalization: TextCapitalization.characters,
        ),
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          children: _popularSymbols.map((symbol) {
            return ActionChip(
              label: Text(symbol),
              onPressed: () {
                _controller.text = symbol;
                widget.onSymbolSelected(symbol);
              },
            );
          }).toList(),
        ),
      ],
    );
  }
}

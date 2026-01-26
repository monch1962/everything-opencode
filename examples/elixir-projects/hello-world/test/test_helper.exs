ExUnit.start()

# Configure ExUnit
ExUnit.configure(
  formatters: [ExUnit.CLIFormatter, ExUnitNotifier],
  trace: true,
  colors: [enabled: true],
  exclude: [:integration]
)

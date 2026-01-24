# TUI (Terminal UI) Optimizations

## When to Use

When working with opencode in terminal environments to:
- Optimize screen real estate usage
- Improve keyboard navigation efficiency
- Enhance readability in terminal colors
- Streamline workflow in headless environments
- Maximize productivity in SSH sessions or remote development

## How It Works

opencode's TUI mode provides a rich terminal interface. This skill optimizes that interface for maximum productivity in terminal environments.

## Terminal Configuration

### 1. Terminal Emulator Setup

**iTerm2 (macOS):**
```json
{
  "terminal": {
    "emulator": "iterm2",
    "profiles": {
      "opencode": {
        "font": "JetBrains Mono 14pt",
        "theme": "Solarized Dark",
        "transparency": 0.1,
        "blur": true
      }
    },
    "keybindings": {
      "newTab": "cmd+t",
      "newWindow": "cmd+n",
      "splitVertical": "cmd+d",
      "splitHorizontal": "cmd+shift+d"
    }
  }
}
```

**Alacritty (Cross-platform):**
```yaml
# ~/.config/alacritty/alacritty.yml
env:
  TERM: xterm-256color

window:
  padding:
    x: 5
    y: 5
  dynamic_padding: true
  decorations: full

font:
  normal:
    family: "JetBrainsMono Nerd Font"
    style: Regular
  size: 13.0

colors:
  primary:
    background: '0x002b36'
    foreground: '0x839496'
  normal:
    black:   '0x073642'
    red:     '0xdc322f'
    green:   '0x859900'
    yellow:  '0xb58900'
    blue:    '0x268bd2'
    magenta: '0xd33682'
    cyan:    '0x2aa198'
    white:   '0xeee8d5'
```

**Windows Terminal:**
```json
{
  "profiles": {
    "defaults": {
      "font": {
        "face": "Cascadia Code",
        "size": 12
      },
      "colorScheme": "Solarized Dark",
      "padding": "8, 8, 8, 8"
    },
    "list": [
      {
        "name": "opencode",
        "commandline": "powershell.exe -NoExit -Command \"opencode\"",
        "hidden": false
      }
    ]
  }
}
```

### 2. TUI Layout Optimization

```json
{
  "tui": {
    "layout": {
      "mainPanelRatio": 0.7,
      "sidebarWidth": 30,
      "statusBarHeight": 2,
      "minWidth": 80,
      "minHeight": 24
    },
    "panels": {
      "editor": {
        "lineNumbers": true,
        "syntaxHighlighting": true,
        "wrapLines": false,
        "showInvisibles": false
      },
      "chat": {
        "maxMessages": 100,
        "timestampFormat": "HH:mm",
        "showAvatars": true,
        "compactMode": false
      },
      "fileTree": {
        "showHidden": false,
        "icons": true,
        "sortBy": "name",
        "groupDirectoriesFirst": true
      }
    }
  }
}
```

## Keyboard Shortcuts

### 1. Navigation Shortcuts

```json
{
  "keybindings": {
    "navigation": {
      "nextPanel": "ctrl+tab",
      "previousPanel": "ctrl+shift+tab",
      "toggleSidebar": "ctrl+b",
      "toggleFileTree": "ctrl+\\",
      "focusEditor": "ctrl+e",
      "focusChat": "ctrl+c",
      "focusTerminal": "ctrl+t"
    },
    "editor": {
      "save": "ctrl+s",
      "saveAll": "ctrl+shift+s",
      "undo": "ctrl+z",
      "redo": "ctrl+shift+z",
      "find": "ctrl+f",
      "replace": "ctrl+h",
      "goToLine": "ctrl+g",
      "formatDocument": "ctrl+shift+i"
    },
    "chat": {
      "newChat": "ctrl+n",
      "clearChat": "ctrl+l",
      "copyLastResponse": "ctrl+shift+c",
      "regenerate": "ctrl+r",
      "stopGeneration": "ctrl+c"
    }
  }
}
```

### 2. Custom Keybindings

Create `.opencode/keybindings.json`:

```json
{
  "custom": {
    "codeActions": {
      "extractFunction": "ctrl+shift+e",
      "renameSymbol": "f2",
      "organizeImports": "ctrl+shift+o",
      "formatSelection": "ctrl+shift+f"
    },
    "navigation": {
      "goToDefinition": "f12",
      "goToReferences": "shift+f12",
      "findAllReferences": "ctrl+shift+f12",
      "goBack": "ctrl+-",
      "goForward": "ctrl+shift+-"
    },
    "debugging": {
      "toggleBreakpoint": "f9",
      "stepOver": "f10",
      "stepInto": "f11",
      "stepOut": "shift+f11",
      "continue": "f5"
    }
  }
}
```

## Color Scheme Optimization

### 1. Terminal Color Themes

**Solarized Dark (Recommended):**
```json
{
  "colors": {
    "theme": "solarized-dark",
    "customizations": {
      "editor": {
        "background": "#002b36",
        "foreground": "#839496",
        "cursor": "#839496",
        "selection": "#073642"
      },
      "syntax": {
        "keyword": "#859900",
        "function": "#268bd2",
        "string": "#2aa198",
        "number": "#d33682",
        "comment": "#586e75",
        "type": "#b58900"
      },
      "ui": {
        "sidebar": "#073642",
        "statusBar": "#002b36",
        "activeTab": "#268bd2",
        "inactiveTab": "#586e75"
      }
    }
  }
}
```

**Gruvbox Dark:**
```json
{
  "colors": {
    "theme": "gruvbox-dark",
    "customizations": {
      "editor": {
        "background": "#282828",
        "foreground": "#ebdbb2",
        "cursor": "#ebdbb2",
        "selection": "#458588"
      }
    }
  }
}
```

**One Dark:**
```json
{
  "colors": {
    "theme": "one-dark",
    "customizations": {
      "editor": {
        "background": "#282c34",
        "foreground": "#abb2bf",
        "cursor": "#528bff",
        "selection": "#3e4451"
      }
    }
  }
}
```

### 2. Accessibility Optimizations

```json
{
  "accessibility": {
    "highContrast": false,
    "fontSize": 14,
    "lineHeight": 1.5,
    "letterSpacing": 0.5,
    "reduceMotion": false,
    "colorBlindMode": "none",  // "protanopia", "deuteranopia", "tritanopia"
    "customizations": {
      "focusIndicator": {
        "style": "border",
        "color": "#ff6b6b",
        "width": 2
      },
      "selection": {
        "backgroundColor": "#458588",
        "foregroundColor": "#fdf6e3"
      }
    }
  }
}
```

## Performance Optimizations

### 1. Rendering Performance

```json
{
  "performance": {
    "rendering": {
      "vsync": true,
      "fpsLimit": 60,
      "doubleBuffering": true,
      "partialRendering": true,
      "cacheSize": 100
    },
    "memory": {
      "textBufferSize": 10000,
      "undoHistorySize": 100,
      "imageCacheSize": 50
    },
    "input": {
      "keyRepeatDelay": 500,
      "keyRepeatInterval": 30,
      "mousePollRate": 60
    }
  }
}
```

### 2. Large File Handling

```json
{
  "largeFiles": {
    "threshold": 100000,  // 100KB
    "strategies": {
      "virtualScrolling": true,
      "lazyLoading": true,
      "chunkSize": 1000,
      "maxVisibleLines": 1000
    },
    "warnings": {
      "enabled": true,
      "sizeThreshold": 1048576,  // 1MB
      "action": "ask"  // "ask", "open", "cancel"
    }
  }
}
```

## Workflow Optimizations

### 1. Split Screen Layouts

```json
{
  "layouts": {
    "default": {
      "type": "horizontal",
      "panels": [
        {"type": "editor", "size": 0.6},
        {"type": "vertical", "size": 0.4, "panels": [
          {"type": "chat", "size": 0.6},
          {"type": "terminal", "size": 0.4}
        ]}
      ]
    },
    "codeReview": {
      "type": "vertical",
      "panels": [
        {"type": "editor", "size": 0.5},
        {"type": "editor", "size": 0.5}
      ]
    },
    "debugging": {
      "type": "grid",
      "columns": 2,
      "rows": 2,
      "panels": [
        {"type": "editor", "col": 0, "row": 0},
        {"type": "terminal", "col": 1, "row": 0},
        {"type": "debug", "col": 0, "row": 1},
        {"type": "variables", "col": 1, "row": 1}
      ]
    }
  }
}
```

### 2. Quick Actions Panel

```json
{
  "quickActions": {
    "enabled": true,
    "trigger": "ctrl+space",
    "actions": [
      {
        "name": "New File",
        "command": "file.new",
        "keybinding": "ctrl+n"
      },
      {
        "name": "Open File",
        "command": "file.open",
        "keybinding": "ctrl+o"
      },
      {
        "name": "Save All",
        "command": "file.saveAll",
        "keybinding": "ctrl+shift+s"
      },
      {
        "name": "Toggle Terminal",
        "command": "terminal.toggle",
        "keybinding": "ctrl+`"
      },
      {
        "name": "Run Tests",
        "command": "test.run",
        "keybinding": "ctrl+shift+t"
      },
      {
        "name": "Format Document",
        "command": "editor.format",
        "keybinding": "ctrl+shift+i"
      }
    ]
  }
}
```

## Terminal Integration

### 1. Shell Integration

**Bash/Zsh Integration:**
```bash
# ~/.bashrc or ~/.zshrc
export OPENCODE_TUI_MODE=1
export OPENCODE_TERMINAL_WIDTH=$(tput cols)
export OPENCODE_TERMINAL_HEIGHT=$(tput lines)

# Aliases for common operations
alias oc="opencode"
alias oct="opencode --tui"
alias ocp="opencode --project"
alias ocr="opencode --review"

# Function to open opencode in current directory
ocd() {
  local dir="${1:-.}"
  opencode --tui --cwd "$dir"
}

# Function to open specific file
ocf() {
  if [ -z "$1" ]; then
    echo "Usage: ocf <file>"
    return 1
  fi
  opencode --tui --file "$1"
}
```

**PowerShell Integration:**
```powershell
# Microsoft.PowerShell_profile.ps1
$env:OPENCODE_TUI_MODE = "1"

function OpenCode-Tui {
    param(
        [string]$Path = "."
    )
    opencode --tui --cwd $Path
}

Set-Alias -Name oc -Value OpenCode-Tui
Set-Alias -Name oct -Value { opencode --tui }
```

### 2. TMUX Integration

```tmux
# ~/.tmux.conf
# OpenCode-specific tmux configuration
bind-key C-o new-window -n opencode "opencode --tui"
bind-key M-o split-window -v -p 30 "opencode --tui"

# Layout for coding
bind-key F1 \
  split-window -h -p 70 "opencode --tui" \; \
  split-window -v -p 30 \; \
  select-pane -t 0

# Quick open files
bind-key f \
  command-prompt -p "File:" "new-window -n '%1' 'opencode --tui --file %1'"
```

## Remote Development

### 1. SSH TUI Optimization

```json
{
  "ssh": {
    "compression": true,
    "keepalive": 60,
    "escapeChar": "~",
    "tui": {
      "fallbackToAscii": true,
      "disableUnicode": false,
      "colorDepth": "256",
      "mouseSupport": true
    },
    "performance": {
      "batchUpdates": true,
      "updateInterval": 100,
      "maxLatency": 1000
    }
  }
}
```

### 2. Slow Connection Optimizations

```json
{
  "slowConnection": {
    "enabled": true,
    "threshold": 100,  // ms latency
    "optimizations": {
      "reduceAnimations": true,
      "disableSyntaxHighlighting": false,
      "cacheImages": true,
      "batchRedraws": true,
      "minimizeUpdates": true
    },
    "fallbacks": {
      "asciiArt": true,
      "simpleColors": true,
      "noUnicode": false
    }
  }
}
```

## Monitoring and Diagnostics

### 1. Performance Monitoring

```json
{
  "monitoring": {
    "enabled": true,
    "metrics": {
      "fps": true,
      "memory": true,
      "latency": true,
      "redrawCount": true
    },
    "logging": {
      "level": "warn",
      "file": "~/.opencode/tui.log",
      "maxSize": "10MB"
    },
    "profiling": {
      "enabled": false,
      "output": "~/.opencode/profile.json"
    }
  }
}
```

### 2. Diagnostic Commands

```bash
# Check TUI performance
opencode tui-stats

# Test rendering
opencode tui-test

# Reset TUI state
opencode tui-reset

# Dump current configuration
opencode tui-config

# Generate performance report
opencode tui-profile --output report.json
```

## Best Practices

### 1. Screen Real Estate

- Use split screens for multi-file editing
- Hide panels when not in use (ctrl+b to toggle sidebar)
- Use quick actions (ctrl+space) instead of menus
- Maximize editor space during focused coding
- Use terminal multiplexer (tmux) for complex workflows

### 2. Keyboard Efficiency

- Learn and customize keybindings
- Use quick navigation (ctrl+p for files, ctrl+shift+p for commands)
- Master modal editing if supported
- Use snippets and templates
- Create macros for repetitive tasks

### 3. Visual Clarity

- Choose high-contrast color schemes
- Use consistent font sizing
- Enable syntax highlighting
- Configure line spacing for readability
- Use icons and visual cues appropriately

### 4. Performance

- Disable unnecessary animations
- Use efficient font rendering
- Limit undo history size
- Configure appropriate cache sizes
- Monitor memory usage

## Troubleshooting

### Common Issues

**1. Rendering Artifacts:**
```bash
# Reset terminal
reset

# Clear and redraw
clear && opencode --tui

# Check terminal compatibility
echo $TERM
```

**2. Slow Performance:**
- Reduce animation complexity
- Disable syntax highlighting for large files
- Increase cache sizes
- Use simpler color schemes
- Check terminal emulator performance

**3. Input Lag:**
- Adjust key repeat settings
- Disable input processing plugins
- Check terminal emulator configuration
- Reduce TUI update frequency

**4. Color Issues:**
```bash
# Test terminal colors
tput colors

# Force 256-color mode
export TERM=xterm-256color

# Check color support
opencode tui-colors-test
```

## Resources

- [Terminal Good Practices](https://github.com/microsoft/terminal/blob/main/doc/user-docs/GoodPractices.md)
- [Color Schemes for Terminals](https://github.com/mbadolato/iTerm2-Color-Schemes)
- [TUI Best Practices](https://github.com/Textualize/textual/blob/main/docs/guides/design.md)
- [Keyboard Shortcut Design](https://developer.apple.com/design/human-interface-guidelines/keyboards)
- [Accessibility in Terminal Apps](https://webaim.org/techniques/terminal/)
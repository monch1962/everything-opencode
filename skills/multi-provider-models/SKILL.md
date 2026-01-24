# Multi-Provider Model Configuration

## When to Use

When opencode supports multiple AI model providers and you want to:
- Optimize costs by using different providers for different tasks
- Improve reliability with fallback providers
- Access specialized models from different providers
- Balance performance vs. cost for various task types
- Leverage provider-specific features and capabilities

## How It Works

opencode's multi-provider support allows configuring multiple AI model providers (OpenAI, Anthropic, Google, etc.) and routing requests intelligently based on task type, cost, and performance requirements.

## Provider Configuration

### 1. Basic Provider Setup

```json
// ~/.opencode/providers.json
{
  "providers": {
    "openai": {
      "type": "openai",
      "apiKey": "${OPENAI_API_KEY}",
      "models": {
        "gpt-4o": {"context": 128000, "costPer1KInput": 0.005, "costPer1KOutput": 0.015},
        "gpt-4o-mini": {"context": 128000, "costPer1KInput": 0.00015, "costPer1KOutput": 0.0006},
        "o1-preview": {"context": 128000, "costPer1KInput": 0.015, "costPer1KOutput": 0.06}
      },
      "defaultModel": "gpt-4o-mini"
    },
    "anthropic": {
      "type": "anthropic",
      "apiKey": "${ANTHROPIC_API_KEY}",
      "models": {
        "claude-3-5-sonnet": {"context": 200000, "costPer1KInput": 0.003, "costPer1KOutput": 0.015},
        "claude-3-5-haiku": {"context": 200000, "costPer1KInput": 0.00025, "costPer1KOutput": 0.00125}
      },
      "defaultModel": "claude-3-5-haiku"
    },
    "google": {
      "type": "google",
      "apiKey": "${GOOGLE_API_KEY}",
      "models": {
        "gemini-1.5-pro": {"context": 1000000, "costPer1KInput": 0.000125, "costPer1KOutput": 0.000375},
        "gemini-1.5-flash": {"context": 1000000, "costPer1KInput": 0.000035, "costPer1KOutput": 0.000105}
      },
      "defaultModel": "gemini-1.5-flash"
    }
  }
}
```

### 2. Task-Based Routing

```json
{
  "routing": {
    "byTaskType": {
      "codeGeneration": {
        "primary": {"provider": "openai", "model": "gpt-4o"},
        "fallback": {"provider": "anthropic", "model": "claude-3-5-sonnet"},
        "budget": {"provider": "google", "model": "gemini-1.5-flash"}
      },
      "codeReview": {
        "primary": {"provider": "anthropic", "model": "claude-3-5-sonnet"},
        "fallback": {"provider": "openai", "model": "gpt-4o"}
      },
      "documentation": {
        "primary": {"provider": "google", "model": "gemini-1.5-pro"},
        "fallback": {"provider": "openai", "model": "gpt-4o-mini"}
      },
      "debugging": {
        "primary": {"provider": "openai", "model": "o1-preview"},
        "fallback": {"provider": "anthropic", "model": "claude-3-5-sonnet"}
      }
    },
    "byContextSize": {
      "small": {"maxTokens": 4000, "provider": "google", "model": "gemini-1.5-flash"},
      "medium": {"maxTokens": 16000, "provider": "openai", "model": "gpt-4o-mini"},
      "large": {"maxTokens": 128000, "provider": "anthropic", "model": "claude-3-5-haiku"},
      "huge": {"maxTokens": 1000000, "provider": "google", "model": "gemini-1.5-pro"}
    }
  }
}
```

## Cost Optimization Strategies

### 1. Cost-Aware Routing

```json
{
  "costOptimization": {
    "budgetPerDay": 10.0,  // USD
    "preferCheaperModels": true,
    "autoDowngrade": {
      "enabled": true,
      "threshold": 0.8,  // Use cheaper models after 80% of budget
      "downgradeMap": {
        "gpt-4o": "gpt-4o-mini",
        "claude-3-5-sonnet": "claude-3-5-haiku",
        "gemini-1.5-pro": "gemini-1.5-flash"
      }
    },
    "usageTracking": {
      "enabled": true,
      "logFile": "~/.opencode/usage.json",
      "resetDaily": true
    }
  }
}
```

### 2. Provider-Specific Optimizations

**OpenAI Optimizations:**
```json
{
  "openai": {
    "streaming": true,
    "temperature": 0.1,  // Lower for code, higher for creative tasks
    "maxTokens": 4000,
    "retryPolicy": {
      "maxRetries": 3,
      "backoffMultiplier": 2,
      "initialDelayMs": 1000
    }
  }
}
```

**Anthropic Optimizations:**
```json
{
  "anthropic": {
    "maxTokens": 4096,
    "temperature": 0.0,  // Deterministic for code
    "systemPrompt": "You are an expert software engineer...",
    "thinking": {
      "enabled": true,
      "budgetTokens": 1024
    }
  }
}
```

**Google Optimizations:**
```json
{
  "google": {
    "temperature": 0.2,
    "topP": 0.95,
    "topK": 40,
    "safetySettings": {
      "harassment": "BLOCK_NONE",
      "hateSpeech": "BLOCK_NONE",
      "sexuallyExplicit": "BLOCK_NONE",
      "dangerousContent": "BLOCK_NONE"
    }
  }
}
```

## Performance Configuration

### 1. Latency vs. Quality Trade-offs

```json
{
  "performance": {
    "latencyTargets": {
      "interactive": {"maxMs": 2000, "providers": ["google", "openai"]},
      "background": {"maxMs": 10000, "providers": ["anthropic", "openai"]},
      "batch": {"maxMs": 30000, "providers": ["anthropic"]}
    },
    "qualityLevels": {
      "draft": {"providers": ["google"], "models": ["gemini-1.5-flash"]},
      "standard": {"providers": ["openai"], "models": ["gpt-4o-mini"]},
      "high": {"providers": ["anthropic", "openai"], "models": ["claude-3-5-sonnet", "gpt-4o"]},
      "expert": {"providers": ["openai"], "models": ["o1-preview"]}
    }
  }
}
```

### 2. Fallback and Retry Logic

```json
{
  "resilience": {
    "fallbackChain": ["openai", "anthropic", "google"],
    "retryConfig": {
      "maxAttempts": 3,
      "initialDelay": 1000,
      "maxDelay": 10000,
      "retryableErrors": ["rate_limit", "timeout", "server_error"]
    },
    "circuitBreaker": {
      "enabled": true,
      "failureThreshold": 5,
      "resetTimeout": 60000,
      "halfOpenMaxRequests": 3
    }
  }
}
```

## Agent-Specific Model Configuration

### 1. Agent Model Preferences

```json
{
  "agents": {
    "planner": {
      "provider": "anthropic",
      "model": "claude-3-5-sonnet",
      "reasoning": "Needs strong reasoning for complex planning"
    },
    "code-reviewer": {
      "provider": "openai",
      "model": "gpt-4o",
      "reasoning": "Excellent at code analysis and security"
    },
    "tdd-guide": {
      "provider": "google",
      "model": "gemini-1.5-pro",
      "reasoning": "Good at structured workflows"
    },
    "architect": {
      "provider": "openai",
      "model": "o1-preview",
      "reasoning": "Requires deep reasoning for architecture"
    },
    "build-error-resolver": {
      "provider": "openai",
      "model": "gpt-4o-mini",
      "reasoning": "Fast and cheap for error resolution"
    }
  }
}
```

### 2. Context Window Management

```json
{
  "contextManagement": {
    "autoSelectByContextSize": true,
    "providersByContext": {
      "small": {"maxTokens": 8000, "provider": "google", "model": "gemini-1.5-flash"},
      "medium": {"maxTokens": 32000, "provider": "openai", "model": "gpt-4o-mini"},
      "large": {"maxTokens": 128000, "provider": "anthropic", "model": "claude-3-5-haiku"},
      "xl": {"maxTokens": 1000000, "provider": "google", "model": "gemini-1.5-pro"}
    },
    "compression": {
      "enabled": true,
      "threshold": 0.8,  // Compress when context > 80% of window
      "method": "summarize"  // or "truncate", "chunk"
    }
  }
}
```

## Project-Specific Configuration

### 1. Per-Project Provider Settings

Create `.opencode/providers.json` in each project:

```json
{
  "projectType": "react-typescript",
  "providers": {
    "default": "openai",
    "models": {
      "development": "gpt-4o-mini",
      "codeReview": "gpt-4o",
      "documentation": "gemini-1.5-flash"
    }
  },
  "budget": {
    "dailyLimit": 5.0,
    "preferredProvider": "openai",
    "fallbackProvider": "google"
  }
}
```

### 2. Team Configuration

For team settings in `.opencode/team-config.json`:

```json
{
  "team": {
    "sharedProviders": ["openai", "google"],
    "individualProviders": ["anthropic"],  // Each team member configures individually
    "costAllocation": {
      "projectBased": true,
      "defaultProject": "shared",
      "trackingEnabled": true
    }
  },
  "policies": {
    "maxCostPerDay": 50.0,
    "requireApprovalOver": 10.0,
    "preferredModels": ["gpt-4o-mini", "gemini-1.5-flash"]
  }
}
```

## Monitoring and Analytics

### 1. Usage Tracking

```json
{
  "analytics": {
    "enabled": true,
    "track": [
      "tokensUsed",
      "costIncurred",
      "providerLatency",
      "modelPerformance",
      "errorRates"
    ],
    "export": {
      "format": "json",
      "destination": "~/.opencode/analytics/",
      "rotation": "daily"
    },
    "alerts": {
      "costThreshold": {"warning": 5.0, "critical": 10.0},
      "errorRate": {"warning": 0.05, "critical": 0.1},
      "latency": {"warning": 5000, "critical": 10000}
    }
  }
}
```

### 2. Performance Dashboard

Create a simple monitoring script:

```bash
#!/bin/bash
# ~/.opencode/monitor-providers.sh

echo "Provider Usage Summary:"
echo "======================"

# Check OpenAI usage
if [ -f ~/.opencode/usage.json ]; then
  echo "OpenAI:"
  jq '.providers.openai | {tokens: .tokensUsed, cost: .costIncurred}' ~/.opencode/usage.json
fi

# Check Anthropic usage
if [ -f ~/.opencode/usage.json ]; then
  echo "Anthropic:"
  jq '.providers.anthropic | {tokens: .tokensUsed, cost: .costIncurred}' ~/.opencode/usage.json
fi

# Check Google usage
if [ -f ~/.opencode/usage.json ]; then
  echo "Google:"
  jq '.providers.google | {tokens: .tokensUsed, cost: .costIncurred}' ~/.opencode/usage.json
fi
```

## Advanced Features

### 1. Model Ensembling

```json
{
  "ensembling": {
    "enabled": true,
    "strategies": {
      "codeGeneration": {
        "providers": ["openai", "anthropic"],
        "voting": "majority",  // or "confidence", "weighted"
        "fallback": "google"
      },
      "codeReview": {
        "providers": ["openai", "anthropic"],
        "consensusRequired": true,
        "minAgreement": 0.7
      }
    }
  }
}
```

### 2. A/B Testing

```json
{
  "abTesting": {
    "enabled": true,
    "tests": [
      {
        "name": "codeCompletionModels",
        "variants": [
          {"provider": "openai", "model": "gpt-4o", "weight": 0.33},
          {"provider": "anthropic", "model": "claude-3-5-sonnet", "weight": 0.33},
          {"provider": "google", "model": "gemini-1.5-pro", "weight": 0.34}
        ],
        "metrics": ["accuracy", "latency", "userSatisfaction"]
      }
    ]
  }
}
```

## Troubleshooting

### Common Issues

**1. API Key Issues:**
```bash
# Test provider connectivity
opencode test-provider openai
opencode test-provider anthropic
opencode test-provider google

# Check API keys
echo "OpenAI: ${OPENAI_API_KEY:0:10}..."
echo "Anthropic: ${ANTHROPIC_API_KEY:0:10}..."
echo "Google: ${GOOGLE_API_KEY:0:10}..."
```

**2. Rate Limiting:**
```json
{
  "rateLimiting": {
    "openai": {"requestsPerMinute": 60, "tokensPerMinute": 150000},
    "anthropic": {"requestsPerMinute": 30, "tokensPerMinute": 100000},
    "google": {"requestsPerMinute": 60, "tokensPerMinute": 1000000}
  }
}
```

**3. Cost Overruns:**
- Enable budget alerts
- Set up cost monitoring
- Implement automatic downgrading
- Use cheaper models for non-critical tasks

## Best Practices

1. **Start Simple**: Begin with one provider, add more as needed
2. **Monitor Costs**: Set up alerts and track usage
3. **Use Appropriate Models**: Match model capabilities to task requirements
4. **Implement Fallbacks**: Ensure reliability with backup providers
5. **Regular Review**: Periodically review and optimize configurations
6. **Team Coordination**: Align provider usage across teams
7. **Security**: Keep API keys secure and rotate regularly

## Resources

- [OpenAI API Documentation](https://platform.openai.com/docs/api-reference)
- [Anthropic API Documentation](https://docs.anthropic.com/claude/reference/)
- [Google AI Studio](https://makersuite.google.com/)
- [opencode Multi-Provider Guide](https://opencode.ai/docs/multi-provider)
- [Cost Calculator](https://openai.com/pricing)
- [Model Comparison Guide](https://lmsys.org/blog/2023-03-30-vicuna/)
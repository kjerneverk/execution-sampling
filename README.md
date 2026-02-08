# @kjerneverk/execution-sampling

MCP sampling provider for AI generation - no API keys needed!

## Overview

`execution-sampling` is a provider implementation that uses MCP (Model Context Protocol) sampling to delegate AI generation to the calling client. This eliminates the need for duplicate API keys when your tool is used via MCP in IDEs like Cursor, GitHub Copilot, or other MCP-enabled environments.

**Key Benefits:**
- No server-side API keys required
- Seamless integration with MCP clients
- Drop-in replacement for direct providers
- Implements standard Provider interface
- Automatic capability detection

## Installation

```bash
npm install @kjerneverk/execution-sampling
```

## Quick Start

```typescript
import { createSamplingProvider } from '@kjerneverk/execution-sampling';

// Create provider with session context
const provider = createSamplingProvider({
  sessionId: 'session-123',
  clientName: 'Cursor',
  supportsTools: false,
});

// Use like any other provider
const response = await provider.execute({
  model: 'claude-sonnet-4-5',
  messages: [
    { role: 'user', content: 'Generate a plan for...' }
  ],
  responseFormat: { type: 'json_schema', /* ... */ }
});
```

## How It Works

1. Your MCP server detects the client supports sampling
2. Instead of using direct API calls, you create a SamplingProvider
3. When `execute()` is called, it sends a `sampling/createMessage` request to the client
4. The client (Cursor, Copilot, etc.) generates the response using its AI
5. The response is returned to your server

**No duplicate API keys needed!**

## Requirements

- Client must support MCP sampling capability
- Client must have AI/LLM access
- MCP SDK version 1.0.4 or higher

## API Reference

See full API documentation in [docs/api.md](docs/api.md)

## Error Handling

The provider handles common sampling errors:
- User rejection (`-1`)
- Invalid parameters (`-32602`)
- Timeouts
- Unsupported capabilities

See [docs/error-handling.md](docs/error-handling.md) for details.

## Examples

See [examples/](examples/) directory for complete usage examples.

## License

Apache-2.0

## Part of @kjerneverk Ecosystem

This package is part of the [@kjerneverk](https://github.com/kjerneverk) ecosystem of execution providers and AI tools.

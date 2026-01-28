# PineScript Debug Server API Documentation

*Generated: 2026-01-28T01:29:17.970Z*

### Main Class

*File: scripts/pinescript/debug-server.js*

#### Methods

##### `setupMiddleware()`

PineScript Interactive Debugging Server (Refactored)
 Web-based debugging interface with real-time variable inspection,
 breakpoints, step-through debugging, and live charts.
 Refactored version using modular architecture

##### `setupRoutes()`

Setup routes

##### `setupWebSocketManager()`

Setup WebSocket manager

##### `start()`

Start the debug server

##### `startCleanupIntervals()`

Start cleanup intervals

##### `stop()`

Stop the debug server

##### `getStats()`

Get server statistics

#### Exports

`PineScriptDebugServer`


## Modules

### Code Analyzer

*File: scripts/pinescript/debug-server-modules/code-analyzer.js*

* Code Analyzer for PineScript Debug Server
 *
 * Analyzes PineScript code for complexity, patterns, and debugging suggestions
 

class CodeAnalyzer

#### Methods

##### `loadDefaultPatterns()`

Code Analyzer for PineScript Debug Server
 Analyzes PineScript code for complexity, patterns, and debugging suggestions

##### `analyzePineScript()`

Analyze PineScript code

##### `calculateComplexity()`

Calculate code complexity

##### `generateDebugSuggestions()`

Generate debugging suggestions

##### `detectPatterns()`

Detect patterns in code

##### `calculateMetrics()`

Calculate code metrics

##### `getLineNumber()`

Get line number from character index

##### `getPatternDescription()`

Get pattern description

##### `getPatternSeverity()`

Get pattern severity

##### `generateAISuggestions()`

Get AI-based suggestions

##### `matchesAIPattern()`

Check if line matches AI pattern

##### `calculateAIConfidence()`

Calculate AI confidence score

#### Exports

`CodeAnalyzer`

### Debug State Manager

*File: scripts/pinescript/debug-server-modules/debug-state-manager.js*

* Debug State Manager for PineScript Debug Server
 *
 * Manages debug state, breakpoints, watches, variables, and execution control
 

class DebugStateManager

#### Methods

##### `resetState()`

Debug State Manager for PineScript Debug Server
 Manages debug state, breakpoints, watches, variables, and execution control

##### `startDebugging()`

Start debugging session

##### `pauseDebugging()`

Pause debugging

##### `resumeDebugging()`

Resume debugging

##### `stopDebugging()`

Stop debugging

##### `stepDebugging()`

Step through debugging

##### `gotoBar()`

Go to specific bar

##### `setExecutionSpeed()`

Set execution speed

##### `addBreakpoint()`

Add breakpoint

##### `removeBreakpoint()`

Remove breakpoint

##### `clearBreakpoints()`

Clear all breakpoints

##### `addWatch()`

Add watch expression

##### `removeWatch()`

Remove watch expression

##### `clearWatches()`

Clear all watches

##### `updateWatchValue()`

Update watch value

##### `setVariable()`

Set variable value

##### `getVariable()`

Get variable value

##### `getVariableHistory()`

Get variable history

##### `clearVariables()`

Clear all variables

##### `pushCallStack()`

Push to call stack

##### `popCallStack()`

Pop from call stack

##### `clearCallStack()`

Clear call stack

##### `recordExecutionStep()`

Record execution step

##### `getExecutionHistory()`

Get execution history

##### `getSessionDuration()`

Get session duration

##### `getSessionStats()`

Get session statistics

##### `exportState()`

Export debug state

##### `importState()`

Import debug state

##### `validateStateData()`

Validate state data

#### Exports

`DebugStateManager`

### Security Manager

*File: scripts/pinescript/debug-server-modules/security-manager.js*

* Security Manager for PineScript Debug Server
 *
 * Handles authentication, session validation, rate limiting, and security middleware
 

class SecurityManager

#### Methods

##### `securityMiddleware()`

Security Manager for PineScript Debug Server
 Handles authentication, session validation, rate limiting, and security middleware

##### `rateLimitMiddleware()`

Rate limiting middleware

##### `validateToken()`

Validate session token

##### `validateSession()`

Validate session by ID

##### `generateSessionToken()`

Generate a new session token

##### `cleanupExpiredTokens()`

Clean up expired tokens

##### `cleanupRateLimitStore()`

Clean up rate limit store

##### `isValidFileType()`

Check if file type is valid

##### `containsMaliciousData()`

Check if data contains malicious content

#### Exports

`SecurityManager`

### Websocket Manager

*File: scripts/pinescript/debug-server-modules/websocket-manager.js*

* WebSocket Manager for PineScript Debug Server
 *
 * Handles Socket.IO connections, events, and real-time communication
 

class WebSocketManager

#### Methods

##### `setupEventHandlers()`

WebSocket Manager for PineScript Debug Server
 Handles Socket.IO connections, events, and real-time communication

##### `setupClientHandlers()`

Setup handlers for a specific client

##### `sendInitialState()`

Send initial state to client

##### `broadcastStateUpdate()`

Broadcast state update to all clients

##### `sendError()`

Send error to client

##### `handleDisconnect()`

Handle client disconnect

##### `handleDebugStart()`

Debug control handlers

##### `handleBreakpointAdd()`

Breakpoint handlers

##### `handleWatchAdd()`

Watch handlers

##### `handleVariableSet()`

Variable handlers

##### `handleCodeAnalyze()`

Code analysis handlers

##### `handleSessionExport()`

Session handlers

##### `handleFileUpload()`

File handlers (placeholder implementations)

##### `handleAIAnalyze()`

AI analysis handlers

##### `handleCustomEvaluate()`

Custom event handlers

##### `getClientStats()`

Get client statistics

##### `cleanupInactiveClients()`

Clean up inactive clients

#### Exports

`WebSocketManager`


## Usage Examples

For detailed usage examples, see:
- `docs/examples/QUICK-START-EXAMPLES.md` - Quick start examples
- `docs/examples/` - Comprehensive examples directory

## Validation

Run validation scripts to ensure module functionality:
```bash
node validate-optimizer.js
```

## Testing

Run the test suite to verify functionality:
```bash
npm test
```


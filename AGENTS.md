# Agent Guidelines for everything-opencode

## Project Overview

This repository contains the everything-opencode project. Agents should analyze the codebase structure before making changes to understand the technology stack and conventions.

## Build System

### Common Commands

- **Build**: `npm run build` or `yarn build` (check package.json)
- **Development server**: `npm run dev` or `yarn dev`
- **Production build**: `npm run build:prod` or `yarn build:prod`
- **Clean**: `npm run clean` or `rm -rf dist/ build/`

### Linting & Formatting

- **Lint**: `npm run lint` or `yarn lint`
- **Format**: `npm run format` or `yarn format`
- **Type checking**: `npm run typecheck` or `yarn typecheck`
- **Auto-fix**: `npm run lint:fix` or `yarn lint:fix`

### Testing

- **All tests**: `npm test` or `yarn test`
- **Single test**: `npm test -- --testNamePattern="test name"` or `yarn test --testNamePattern="test name"`
- **Watch mode**: `npm run test:watch` or `yarn test:watch`
- **Coverage**: `npm run test:coverage` or `yarn test:coverage`
- **E2E tests**: `npm run test:e2e` or `yarn test:e2e`

## Code Style Guidelines

### Import Organization

1. **External dependencies first** (React, libraries)
2. **Internal modules** (components, utilities, types)
3. **Styles/CSS modules** (if applicable)
4. **Assets** (images, fonts)

Example:

```typescript
import React from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui';
import { formatDate } from '@/lib/utils';
import styles from './Component.module.css';
import logo from './logo.png';
```

### Formatting Rules

- **Indentation**: 2 spaces (check .editorconfig)
- **Line length**: 80-100 characters (check .prettierrc)
- **Semicolons**: Required (check TypeScript config)
- **Quotes**: Single quotes for JS, double for JSX (check .prettierrc)
- **Trailing commas**: ES5 style (check .prettierrc)

### TypeScript Conventions

- **Explicit types**: Use explicit return types for functions
- **Interfaces vs Types**: Use interfaces for object shapes, types for unions/aliases
- **Any avoidance**: Avoid `any` type; use `unknown` or proper typing
- **Optional chaining**: Use `?.` for optional properties
- **Nullish coalescing**: Use `??` for default values

### Naming Conventions

- **Files**: kebab-case for components, PascalCase for React components
- **Variables**: camelCase
- **Constants**: UPPER_SNAKE_CASE
- **Functions**: camelCase, descriptive verbs
- **Classes**: PascalCase
- **Interfaces/Types**: PascalCase, often prefixed with 'I' (check existing code)
- **Components**: PascalCase, descriptive names

### Error Handling

1. **Try/catch**: Use for async operations and expected failures
2. **Error boundaries**: Use React Error Boundaries for UI errors
3. **Custom errors**: Create specific error classes when needed
4. **Logging**: Use structured logging with context
5. **User feedback**: Provide clear error messages to users

### Component Patterns

- **Functional components**: Prefer over class components
- **Hooks**: Use custom hooks for reusable logic
- **Props destructuring**: Destructure props at function signature
- **Default props**: Use default parameters or defaultProps
- **Prop types**: Use TypeScript interfaces for props

### State Management

- **Local state**: `useState` for component-specific state
- **Global state**: Context API or Zustand/Redux (check existing patterns)
- **Server state**: React Query/SWR for API data
- **Form state**: React Hook Form or Formik (check existing usage)

### File Structure

- **Components**: `/src/components/` organized by feature
- **Pages/Views**: `/src/pages/` or `/src/views/`
- **Utils**: `/src/lib/` or `/src/utils/`
- **Types**: `/src/types/` or type definitions with components
- **Styles**: CSS modules or styled-components (check existing)
- **Tests**: Co-located with components or in `/__tests__/`

## Agent Workflow

### Before Making Changes

1. **Analyze codebase**: Understand existing patterns and conventions
2. **Check package.json**: Identify dependencies and scripts
3. **Review similar files**: Look at existing implementations
4. **Run tests**: Ensure existing functionality works

### During Implementation

1. **Follow existing patterns**: Match code style and architecture
2. **Write tests**: Add unit tests for new functionality
3. **Update documentation**: Update README or comments if needed
4. **Keep commits focused**: One logical change per commit

### After Implementation

1. **Run linting**: `npm run lint` or equivalent
2. **Run type checking**: `npm run typecheck` or equivalent
3. **Run tests**: `npm test` or equivalent
4. **Build verification**: `npm run build` to ensure no errors

## Special Instructions

### Git Practices

- **Commit messages**: Use conventional commits format
- **Branch naming**: `feature/`, `fix/`, `docs/`, `refactor/`
- **PR descriptions**: Include context, changes, and testing steps

### Security Considerations

- **Never commit secrets**: Check for .env, API keys, credentials
- **Input validation**: Validate all user inputs
- **Dependency updates**: Keep dependencies current
- **Code scanning**: Run security scans if available

### Performance Guidelines

- **Memoization**: Use `React.memo`, `useMemo`, `useCallback` appropriately
- **Code splitting**: Implement lazy loading for large components
- **Bundle analysis**: Check bundle size impact of changes
- **Optimize renders**: Avoid unnecessary re-renders

## Repository-Specific Rules

### Cursor Rules

Check `.cursor/rules/` or `.cursorrules` for project-specific guidelines.

### Copilot Instructions

Check `.github/copilot-instructions.md` for AI coding assistant guidelines.

### Project Configuration

- **Framework**: [To be determined from codebase]
- **Language**: [To be determined from codebase]
- **Build tool**: [To be determined from codebase]
- **Testing framework**: [To be determined from codebase]

## Notes for Future Agents

This file should be updated as the project evolves. When new patterns emerge or tools are added, update this document accordingly. Always verify commands by checking package.json and configuration files before running them.

## Refactoring Project Status (Completed)

### Phase 1-3: Large File Refactoring - COMPLETED ✅

**Project Overview**: Successfully refactored 3 large files (>1000 lines each) into modular architectures while maintaining full backward compatibility.

#### **Phase 1: Analysis & Planning** ✅

- Analyzed 3 large files: `debug-server.js`, `pine-debug.js`, `command-runner.js`
- Created modular architecture designs for each
- Established backward compatibility requirements

#### **Phase 2: Implementation** ✅

- Refactored `debug-server.js` into `debug-server-refactored.js` + 4 modules
- Refactored `pine-debug.js` into `pine-debug-refactored.js` + 4 modules
- Refactored `command-runner.js` into `command-runner-refactored.js` + 5 modules
- Updated 8 command files to use refactored versions
- All 97 unit tests pass

#### **Phase 3: Integration Testing & Documentation** ✅

- Created comprehensive integration tests (18 tests passing)
- Created performance tests showing **19.6% improvement** in instantiation speed
- Created validation script with 25/25 checks passing (100%)
- Updated documentation: `PHASE2-REFACTORING.md`, `MIGRATION-STRATEGY.md`
- Fixed all linting errors (0 errors remaining)

#### **Technical Achievements**:

1. **Modular architecture**: 3 main files → 13 modular files
2. **Backward compatibility**: Original APIs maintained 100%
3. **Performance improvement**: 19.6% faster module instantiation
4. **Test coverage**: 115 tests passing (97 unit + 18 integration)
5. **Validation**: Automated validation script with 100% pass rate

#### **Files Created/Modified**:

```
scripts/
├── pinescript/debug-server-refactored.js + 4 modules/
├── commands/pine-debug-refactored.js + 4 modules/
├── clojure/command-runner-refactored.js + 5 modules/
└── validate-phase2.js

tests/
├── integration/phase2-refactoring.test.js
└── performance/phase2-performance.test.js

docs/
├── PHASE2-REFACTORING.md
└── MIGRATION-STRATEGY.md
```

#### **Migration Status**:

- **Gradual migration strategy**: Refactored versions exist alongside originals
- **8 command files** updated to use refactored versions
- **Validation**: 100% successful with automated validation script
- **Ready for production**: All tests pass, documentation complete

#### **Next Steps (Optional Phase 4)**:

1. **Production migration**: Replace original files with refactored versions
2. **Monitoring**: Add performance monitoring for refactored modules
3. **Optimization**: Further performance improvements based on usage patterns
4. **Documentation**: Update main README with refactoring benefits

**Branch**: `phase2-refactoring` (ready for merge to main)

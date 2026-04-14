```markdown
# xCxPxAx Development Patterns

> Auto-generated skill from repository analysis

## Overview
This skill introduces the core development patterns and conventions used in the `xCxPxAx` JavaScript repository. It covers file naming, import/export styles, commit message conventions, and testing patterns. While no frameworks or automated workflows are detected, this guide will help you contribute code that matches the project's established style.

## Coding Conventions

### File Naming
- Use **camelCase** for file names.
  - Example: `userProfile.js`, `dataFetcher.js`

### Import Style
- Use **alias imports** for modules.
  - Example:
    ```javascript
    import utils from '@utils';
    import apiClient from '@services/apiClient';
    ```

### Export Style
- **Mixed exports** are used (both default and named).
  - Example:
    ```javascript
    // Default export
    export default function fetchData() { ... }

    // Named export
    export function parseData(data) { ... }
    ```

### Commit Messages
- Use **Conventional Commits** with the `feat` prefix for features.
  - Example:
    ```
    feat: add user authentication to login page
    ```

## Workflows

_No automated workflows detected in this repository._

## Testing Patterns

- **Test files** follow the pattern: `*.test.*`
  - Example: `userProfile.test.js`
- **Testing framework** is unknown, but tests are colocated with source files or in a dedicated test directory.

#### Example Test File
```javascript
// userProfile.test.js
import { getUserProfile } from '@services/userProfile';

test('should fetch user profile correctly', () => {
  // test implementation
});
```

## Commands

| Command      | Purpose                                   |
|--------------|-------------------------------------------|
| /test        | Run all test files matching *.test.*      |
| /lint        | Lint the codebase for style consistency   |
| /commit      | Create a conventional commit (feat: ...)  |

```
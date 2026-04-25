
---
name: write-tests
description: Write Vitest tests for a module based on its spec
---

Read both index.ts and the .spec.md in the current directory.
Write comprehensive Vitest tests in __tests__/<module-name>.test.ts.

Test coverage requirements:

1. Cover every test case listed in the spec's "Tests required" section
2. Cover every error case listed in the spec's "Error cases" section
3. Test the public API behavior, never implementation details
4. Use describe blocks per public function
5. Use it.each for parameterized tests when multiple inputs share logic
6. Mock external dependencies (AI providers, git, filesystem)

File location:

- Tests go in __tests__/ subfolder of the module
- File name: <moduleName>.test.ts (matches the module's index.ts)
- Use vitest, not jest

Run the tests after writing them with: npx vitest run <path>
Report any failures and propose fixes to either the test or implementation.

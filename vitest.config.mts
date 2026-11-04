import { defineConfig } from 'vitest/config';

// Unit tests for the pure logic in src/lib. Pages and components are checked in
// a browser instead, since most of what can go wrong there is layout.
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
  },
});

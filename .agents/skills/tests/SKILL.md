---
name: Write Tests
description: Rules and templates for writing unit and component tests using Jest.
---
# Skill: Write Tests

## Stack
- Jest + @testing-library/react-native
- Test file: `[name].test.ts` next to source file
- Comments in English
- Mock Supabase and SQLite — never real DB in tests

## Template — Service / Repository
```typescript
import { [FunctionName] } from './[fileName]'

// Mock external dependencies
jest.mock('@/services/supabase', () => ({
  supabase: { from: jest.fn() }
}))

describe('[FunctionName]', () => {
  beforeEach(() => jest.clearAllMocks())

  it('should [expected behavior] when [condition]', async () => {
    // Arrange
    const input = { ... }
    // Act
    const result = await [FunctionName](input)
    // Assert
    expect(result).toEqual(...)
  })

  it('should throw when [failure condition]', async () => {
    jest.spyOn(...).mockRejectedValueOnce(new Error('fail'))
    await expect([FunctionName](input)).rejects.toThrow('fail')
  })
})
```

## Template — Hook
```typescript
import { renderHook, act } from '@testing-library/react-native'
import { use[Name] } from './use[Name]'

describe('use[Name]', () => {
  it('should return initial state', () => {
    const { result } = renderHook(() => use[Name]())
    expect(result.current.[value]).toBe(...)
  })

  it('should update after [action]', async () => {
    const { result } = renderHook(() => use[Name]())
    await act(async () => { await result.current.[action]() })
    expect(result.current.[value]).toBe(...)
  })
})
```

## What to Test Per Layer
- **Repository**: CRUD success + DB error
- **Service**: business rules, validations, permission checks
- **Hook**: initial, loading, success, error states
- **Component**: renders, interactions, loading/error/empty states

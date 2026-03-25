# Testing rules

## Unit Test Writing Guidelines

All unit tests should follow consistent patterns and use proper mocking strategies.

## Test Structure

- Use `describe()` for grouping related tests
- Use `it()` for individual test cases
- Use `beforeEach()` for test setup
- Use descriptive test names that explain the expected behavior
- Follow AAA pattern: Arrange, Act, Assert

## Mocking Strategy

- Use **model mocks** for domain models (e.g., `mockLookup()`)
- Use **fixtures** for services when they exist
- Create repository mocks using factory functions
- Mock external dependencies through Inversify container

## Test Data

- Use existing mock functions for domain models
- Use existing fixtures for services
- Create test data that represents realistic scenarios
- Use `expect.any()` for dynamic values like generated IDs

## Inversify Integration

- Set up fresh container for each test
- Bind mocks to container using service keys
- Use `toConstantValue()` for mock objects
- Use `toSelf()` for handlers under test

## Result Pattern Testing

- Always check `isOk(result)` or `isErr(result)` before assertions
- Test both success and error scenarios
- Verify error messages contain expected content
- Test error propagation from dependencies

## Example Test Structure

```typescript
import 'reflect-metadata';
import { Container } from 'inversify';
import {
  CreateLookupCommandHandler,
  CreateLookupCommand,
} from '../createLookupCommandHandler';
import { createLookupRepositoryMock } from '../../__fixtures__/lookupRepositoryMock';
import {
  createServiceBusMock,
  basicErr,
  isOk,
  ok,
  isErr,
} from '@app/core';
import { mockLookup, LookupTypeEnum } from '../../domain/models/lookup';
import {
  ILookupRepository,
  LOOKUP_REPOSITORY_KEY,
} from '../../infrastructure/lookupRepository';

describe('CreateLookupCommandHandler', () => {
  let container: Container;
  let handler: CreateLookupCommandHandler;
  let lookupRepositoryMock: ReturnType<typeof createLookupRepositoryMock>;

  beforeEach(() => {
    container = new Container();
    lookupRepositoryMock = createLookupRepositoryMock();

    // Bind repository mock
    container
      .bind<ILookupRepository>(LOOKUP_REPOSITORY_KEY)
      .toConstantValue(lookupRepositoryMock);

    // Bind service bus mock
    createServiceBusMock(container);

    // Bind handler
    container.bind(CreateLookupCommandHandler).toSelf();
    handler = container.get(CreateLookupCommandHandler);
  });

  const userId = 'user1';
  const caller = 'testCaller';

  it('should create lookup successfully when no existing lookup with same type', async () => {
    // Arrange
    const lookup = mockLookup();
    lookupRepositoryMock.getFilteredByType = jest
      .fn()
      .mockResolvedValue(ok([]));
    lookupRepositoryMock.create = jest.fn().mockResolvedValue(ok(lookup));

    // Act
    const result = await handler.handle(
      new CreateLookupCommand(userId, caller, lookup)
    );

    // Assert
    expect(isOk(result)).toBeTruthy();
    if (isOk(result)) {
      expect(result.value).toEqual(lookup);
    }
    expect(lookupRepositoryMock.getFilteredByType).toHaveBeenCalledWith(
      lookup.type
    );
    expect(lookupRepositoryMock.create).toHaveBeenCalledWith(lookup);
  });

  it('should return error when lookup with same type already exists', async () => {
    // Arrange
    const lookup = mockLookup();
    const existingLookup = { ...mockLookup(), type: lookup.type };
    lookupRepositoryMock.getFilteredByType = jest
      .fn()
      .mockResolvedValue(ok([existingLookup]));

    // Act
    const result = await handler.handle(
      new CreateLookupCommand(userId, caller, lookup)
    );

    // Assert
    expect(isErr(result)).toBeTruthy();
    if (isErr(result)) {
      expect(result.error.message).toContain(
        `Lookup already exists with a name Test Lookup for type ${lookup.type}`
      );
    }
    expect(lookupRepositoryMock.getFilteredByType).toHaveBeenCalledWith(
      lookup.type
    );
    expect(lookupRepositoryMock.create).not.toHaveBeenCalled();
  });
});
```

## Test Categories

- **Happy Path**: Test successful execution with valid data
- **Error Handling**: Test error scenarios and edge cases
- **Validation**: Test input validation and business rules

## Mock Best Practices

- Use factory functions for creating mocks
- Mock at the interface level, not implementation
- Use `jest.fn()` for method mocking
- Use `mockResolvedValue()` for async methods
- Use `mockReturnValue()` for sync methods
- Verify mock calls with `toHaveBeenCalledWith()`

## Assertion Guidelines

- Always check Result type before accessing value
- Use specific assertions over generic ones
- Test both positive and negative cases
- Verify side effects (method calls, state changes)
- Use descriptive assertion messages

## Test Organization

- Group related tests in describe blocks
- Use consistent naming: "should [expected behavior] when [condition]"
- Keep tests focused on single behavior
- Use beforeEach for common setup
- Clean up after each test if needed

## Coverage Requirements

- Aim for high test coverage (>90%)
- Test all public methods
- Test error paths and edge cases
- Test async operations properly
- Test Result pattern usage consistently
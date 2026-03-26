# Module Design Rules

This document defines the internal structure and design patterns for domain modules in the modular monolith architecture.

## Module Structure

Each domain module must follow a layered architecture with three main directories:

```
libs/[module-name]/
  src/
    application/
    domain/
    infrastructure/
```

### Application Layer

The application layer contains use case orchestration and external communication interfaces.

**Structure:**
```
application/
  features/
    [feature-name]/
      facades/
        [Feature]Facade.ts
        di.ts
      handlers/
        [Command]Handler.ts
        di.ts
      services/
        [Service].ts
```

**Responsibilities:**
- Orchestrate business logic from the domain layer
- Define command handlers for use cases
- Implement facade contracts from `@app/integration-contracts`
- Coordinate between domain and infrastructure layers
- Handle cross-cutting concerns like logging and validation

#### Command Handlers

Command handlers are the application entry points for executing use cases.

**Rules:**
- Each handler implements exactly one use case
- Handlers use the `Handler<TCommand, TResponse>` interface from `@app/core`
- Handlers are decorated with `@injectable()` from Inversify
- Handlers receive dependencies through constructor injection using `@inject(TOKEN)`
- Handlers are registered to the service bus using `TYPES.Handler` with `.whenNamed(COMMAND_TYPE)`
- Command types are exported constants (e.g., `CREATE_PRODUCT_COMMAND_TYPE = 'product.create'`)

**Example:**
```typescript
import { inject, injectable } from 'inversify';
import { Handler, Envelope, BaseCommand, Result, BasicError } from '@app/core';

export const CREATE_PRODUCT_COMMAND_TYPE = 'product.create';

export interface CreateProductCommand extends BaseCommand {
  name: string;
  priceCents: number;
}

@injectable()
export class CreateProductCommandHandler
  implements Handler<CreateProductCommand, CreateProductResponse>
{
  constructor(
    @inject(PRODUCTS_REPOSITORY_KEY)
    private readonly repo: IProductsRepository,
  ) {}

  async handle(
    env: Envelope<CreateProductCommand>,
  ): Promise<Result<CreateProductResponse, BasicError>> {
    // Use case implementation
  }
}
```

**Handler Registration (di.ts):**
```typescript
export const registerCommandHandlers = (container: Container) => {
  container
    .bind<Handler<CreateProductCommand>>(TYPES.Handler)
    .to(CreateProductCommandHandler)
    .inSingletonScope()
    .whenNamed(CREATE_PRODUCT_COMMAND_TYPE);
};
```

#### Facades

Facades are the public API boundary of a module, implementing contracts from `@app/integration-contracts`.

**Rules:**
- Facade interface and token are defined in `@app/integration-contracts`
- Facade implementation lives in the domain module's `application/features/[feature]/facades/`
- Facades are thin orchestration layers that delegate to command handlers via the service bus
- Facades use `BusResolver` to get the service bus instance
- Facades are decorated with `@injectable()`
- Facades build `Envelope<TCommand>` objects with proper metadata (commandId, correlationId)

**Example:**
```typescript
import { injectable } from 'inversify';
import { BusResolver, Envelope, Result } from '@app/core';
import { IProductBaseFacade, CreateProductCommandContract } from '@app/integration-contracts';

@injectable()
export class ProductBaseFacade implements IProductBaseFacade {
  constructor(private readonly resolveBus: BusResolver) {}

  async invokeCreateProduct(
    payload: CreateProductCommandContract,
    opts?: { via?: Transport },
  ): Promise<Result<CreateProductResponseContract, BasicError>> {
    const busResult = this.resolveBus(opts?.via);
    if (isErr(busResult)) return busResult;

    const envelope: Envelope<CreateProductCommand> = {
      type: CREATE_PRODUCT_COMMAND_TYPE,
      payload: payload as CreateProductCommand,
      meta: { commandId: ulid() },
    };

    return busResult.value.invoke<CreateProductCommand, CreateProductResponse>(envelope);
  }
}
```

**Facade Registration (di.ts):**
```typescript
export const registerFacades = (container: Container) => {
  bindOrRebind(container, PRODUCT_FACADE_TOKEN, () => {
    container
      .bind<IProductBaseFacade>(PRODUCT_FACADE_TOKEN)
      .toDynamicValue(() => {
        const resolver = makeBusResolver(container);
        return new ProductBaseFacade(resolver);
      })
      .inSingletonScope();
  });
};
```

### Domain Layer

The domain layer contains pure business logic and domain models.

**Structure:**
```
domain/
  models/
    [Entity].ts
  events/
    [Event].ts
  repositories/
    I[Entity]Repository.ts
```

**Responsibilities:**
- Define domain entities and value objects
- Define business rules and invariants
- Define repository interfaces (not implementations)
- Contain domain events
- Remain independent of infrastructure concerns

**Rules:**
- Domain models should be plain TypeScript interfaces or classes
- No dependencies on infrastructure (database, external services)
- Repository interfaces **must** be defined in `domain/repositories/` and implemented in `infrastructure/`. Do **not** co-locate the interface with its implementation inside `infrastructure/` — this breaks the dependency direction (application layer would then depend on an infrastructure file)
- Business validation logic belongs here
- Domain logic should be testable without any infrastructure
- Do **not** create custom error classes in domain modules (e.g., `class MyDomainAuthError extends Error`). Use the error factories from `@app/core` instead — see the Result Pattern section below

**Example:**
```typescript
// domain/models/product.ts
export interface Product {
  id: string;
  name: string;
  priceCents: number;
  createdAt: Date;
  updatedAt: Date;
}

// Business rule example
export function isValidProductPrice(priceCents: number): boolean {
  return priceCents > 0;
}
```

### Infrastructure Layer

The infrastructure layer provides technical implementations for data access, external services, and module-specific infrastructure.

**Structure:**
```
infrastructure/
  [provider-name]/
    client.ts
    config.ts
    di.ts
    [Entity]Repository.ts
    tx.ts
  logging/
    [Module]Logger.ts
    di.ts
```

**Responsibilities:**
- Implement repository interfaces from domain
- Provide database access using Prisma, MongoDB, or other persistence
- Implement module-specific infrastructure services
- Extend or implement general patterns from `@app/core`
- Register infrastructure dependencies with Inversify

#### Database Access

**Prisma Pattern:**
- Each module has its own Prisma schema and generated client
- Use `client.ts` for factory functions that create PrismaClient instances
- Use `tx.ts` for transaction support with AsyncLocalStorage
- Use `di.ts` to register the client in the DI container

**Repository Implementation:**
```typescript
import { injectable } from 'inversify';
import { productsDb } from './tx';
import { Result, BasicError, ok, notFoundErr, basicErr } from '@app/core';

@injectable()
export class ProductsRepository implements IProductsRepository {
  private get db() {
    return productsDb();
  }

  async findById(id: string): Promise<Result<Product, BasicError>> {
    try {
      const product = await this.db.product.findUnique({ where: { id } });
      if (!product) {
        return notFoundErr(`Product with id ${id} not found`);
      }
      return ok(toDomain(product));
    } catch (error) {
      return basicErr(`Failed to find product`, error);
    }
  }
}
```

**Repository Registration:**
```typescript
export const registerRepository = (container: Container): void => {
  bindOrRebind(container, PRODUCTS_REPOSITORY_KEY, () => {
    container
      .bind<IProductsRepository>(PRODUCTS_REPOSITORY_KEY)
      .to(ProductsRepository)
      .inSingletonScope();
  });
};
```

#### Module Logger

Each module should have a module-specific logger extending `ModuleLogger` from `@app/core`.

**Example:**
```typescript
import { inject, injectable } from 'inversify';
import { LOGGING_TYPES, ModuleLogger, LoggerFactory } from '@app/core';

export const PRODUCT_LOGGER = Symbol.for('ProductLogger');

@injectable()
export class ProductLogger extends ModuleLogger {
  constructor(
    @inject(LOGGING_TYPES.LoggerFactory)
    loggerFactory: LoggerFactory,
  ) {
    super(loggerFactory, 'PRODUCT', { component: 'product' });
  }
}
```

## Dependency Injection with Inversify

The module uses Inversify as the IoC container.

### Container Setup

Each module must have a `di.ts` file at the root that exports:
- `create[Module]ModuleContainer` — creates and configures the container
- `register[Module]Domain` — registers domain-specific services
- `connect[Module]Infrastructure` — connects to external resources (databases, message queues)
- `disconnect[Module]Infrastructure` — closes connections gracefully

**Example:**
```typescript
import { Container } from 'inversify';
import {
  type ILogger,
  type LoggerConfig,
  registerLogging,
  registerServiceBus,
  RequestContext,
  bindRequestContext,
} from '@app/core';
import { PrismaModuleConfig } from '@app/core/prisma';

export interface ProductsModuleConfig {
  logger: LoggerConfig;
  prisma?: PrismaModuleConfig;
  requestContext?: RequestContext;
}

export const createProductsModuleContainer = (
  config: ProductsModuleConfig,
): Container => {
  const container = new Container();
  container.bind<Container>(Container).toConstantValue(container);

  bindRequestContext(container, config.requestContext);
  registerLogging(container, config.logger);
  registerServiceBus(container);

  registerProductsDomain(container, { prisma: config.prisma });
  return container;
};

export const registerProductsDomain = (
  container: Container,
  config: ProductsDomainConfig,
): void => {
  registerProductLogging(container);
  registerProductsPrisma(container, config.prisma);
  registerProductsRepository(container);
  registerProductsCommandHandlers(container);
  registerProductFacades(container);
};

export const connectProductsInfrastructure = async (
  container: Container,
  logger: ILogger,
): Promise<void> => {
  // Connect to databases, message queues, etc.
  // Use logger for connection status
};

export const disconnectProductsInfrastructure = async (
  container: Container,
  logger: ILogger,
): Promise<void> => {
  // Gracefully close connections
  // Use logger for disconnect status
};
```

### Binding Patterns

**Singleton Services:**
```typescript
container
  .bind<IProductsRepository>(PRODUCTS_REPOSITORY_KEY)
  .to(ProductsRepository)
  .inSingletonScope();
```

**Constant Values:**
```typescript
container
  .bind<PrismaModuleConfig>(PRODUCTS_TOKENS.PRISMA_CONFIG)
  .toConstantValue(config);
```

**Factory Functions:**
```typescript
container
  .bind<PrismaClient>(PRODUCTS_TOKENS.PRISMA_CLIENT)
  .toDynamicValue(() => createProductsPrisma(config))
  .inSingletonScope();
```

**Named Bindings (for command handlers):**
```typescript
container
  .bind<Handler<CreateProductCommand>>(TYPES.Handler)
  .to(CreateProductCommandHandler)
  .inSingletonScope()
  .whenNamed(CREATE_PRODUCT_COMMAND_TYPE);
```

### Token Definitions

Use Symbol.for() for tokens that need to be shared across modules:
```typescript
export const PRODUCTS_REPOSITORY_KEY = Symbol.for('ProductsRepository');
```

Use local Symbol() for module-internal bindings:
```typescript
export const PRODUCTS_TOKENS = {
  PRISMA_CONFIG: Symbol.for('ProductsPrismaConfig'),
  PRISMA_CLIENT: Symbol.for('ProductsPrismaClient'),
};
```

## Result Pattern

All operations that can fail must return `Result<T, E extends BasicError>` from `@app/core`.

**Success:**
```typescript
return ok(value);
```

**Failure — use the correct factory for the scenario:**

| Factory | `_type` | When to use |
|---|---|---|
| `basicErr(message, cause?)` | `'SystemError'` | Unexpected / infrastructure errors (DB failures, network errors) |
| `notFoundErr(message)` | `'NotFoundError'` | Entity lookup returned nothing |
| `unauthorizedErr(message)` | `'UnauthorizedError'` | Authentication / token validation failures |

```typescript
return basicErr('Failed to create product', error); // infrastructure error
return notFoundErr(`Product with id ${id} not found`); // missing entity
return unauthorizedErr('Invalid or expired access token'); // auth failure
```

**Do NOT create custom error classes in domain modules.** The `_type` discriminator on `BasicError` is sufficient for all branching in handlers and middleware. Custom classes add boilerplate with no structural benefit:

```typescript
// ❌ Wrong — unnecessary custom class
export class MyModuleAuthError extends Error implements BasicError {
  readonly _type = 'MyModuleAuthError';
}

// ✅ Correct — use factory from @app/core
return unauthorizedErr('Login failed: invalid credentials');
```

**Checking Results:**
```typescript
if (isErr(result)) {
  return result; // Propagate error
}
// Use result.value safely
```

**Avoid redundant checks.** If both branches of an `isErr` check return the same value, simplify:

```typescript
// ❌ Redundant
const result = await this.repo.getPaged(pager);
if (isErr(result)) { return result; }
return result;

// ✅ Simplified
return this.repo.getPaged(pager);
```

## Testing

Follow the patterns defined in [testing-rules.md](./testing-rules.md).

Key points:
- Use `describe()` and `it()` from Jest
- Mock dependencies using factory functions
- Set up fresh Inversify container for each test
- Test both success and error paths
- Verify Result pattern usage

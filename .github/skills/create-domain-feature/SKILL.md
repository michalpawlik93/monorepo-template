---
name: create-domain-feature
description: "Adds a new use case (feature) to an existing domain module. Covers all layers top-to-bottom: integration-contracts extension, domain model, repository interface, command handler, facade extension, Prisma repository implementation, and tests. Use when: adding a new command or query to an existing domain (e.g. products, identity); extending a facade with a new method; scaffolding a new handler."
argument-hint: "Describe the feature — e.g. 'update product price in the products module'"
---

# Create Domain Feature

Scaffold a complete vertical slice through all layers of an existing domain module:
**integration-contracts → domain model → repository interface → command handler → facade → Prisma repository → tests**

## Required Reading

Before starting, read:
- `e:\Nauka\node-js-template\.ai\backend\module-design-rule.md` — layer responsibilities, DI patterns, Result pattern
- `e:\Nauka\node-js-template\.ai\backend\system-design-rules.md` — module boundaries, facade rules, command handler rules

---

## Layer Map

```
libs/integration-contracts/src/<domain>/     ← public contracts & facade interface
libs/<domain>/src/
  domain/
    models/                                  ← domain entity interface
    repositories/                            ← repository interface (I<Domain>Repository)
  application/base/
    handlers/                                ← command handler + registration in di.ts + export in index.ts
    facades/                                 ← facade implementation + registration in di.ts
  infrastructure/prisma/                     ← repository implementation (Prisma)
```

---

## Procedure

### 1. Extend `integration-contracts`

Location: `backend/libs/integration-contracts/src/<domain>/index.ts`

Add:
- **Command contract** — the data shape the facade receives from callers:
  ```typescript
  export interface UpdateProductCommandContract {
    id: string;
    priceCents: number;
  }
  ```
- **Response contract** — the data shape the facade returns:
  ```typescript
  export interface UpdateProductResponseContract {
    id: string;
    priceCents: number;
  }
  ```
- **Facade interface method** — add to `I<Domain>Facade`:
  ```typescript
  invokeUpdateProduct(
    payload: UpdateProductCommandContract,
    opts?: { via?: Transport },
  ): Promise<Result<UpdateProductResponseContract, BasicError>>;
  ```

> **Never** add domain models, repository interfaces, or handler internals here. Only public contracts.

---

### 2. Extend the Domain Model (if needed)

Location: `backend/libs/<domain>/src/domain/models/<entity>.ts`

Add fields only if the new feature requires new data that no existing model has.

```typescript
// Example: add a new field
export interface Product {
  id: string;
  name: string;
  priceCents: number;
  discountCents?: number;   // ← new field
  createdAt: Date;
  updatedAt: Date;
}
```

If no new fields are needed, skip this step.

---

### 3. Extend the Repository Interface

Location: `backend/libs/<domain>/src/domain/repositories/I<Domain>Repository.ts`

Add the method signature for any new persistence operation:

```typescript
update(
  id: string,
  data: Partial<Pick<Product, 'priceCents'>>,
): Promise<Result<Product, BasicError>>;
```

> Repository interfaces live in **domain**, never in infrastructure. This keeps the dependency direction correct: application layer depends on the domain interface, not on the Prisma implementation.

---

### 4. Create the Command Handler

Location: `backend/libs/<domain>/src/application/base/handlers/<featureName>CommandHandler.ts`

Rules:
- Export a **command type constant** (string, kebab-like, e.g. `'product.updatePrice'`).
- Export a **command interface** extending `BaseCommand`.
- Export a **response interface**.
- Decorate the class with `@injectable()`.
- Inject the repository with `@inject(REPOSITORY_KEY)` in the constructor.
- Return `Result<TResponse, BasicError>` — never throw.
- Use error factories from `@app/core` (`ok`, `notFoundErr`, `basicErr`, `validationErr`).

```typescript
import 'reflect-metadata';
import { inject, injectable } from 'inversify';
import { Handler, Envelope, BaseCommand, Result, BasicError, ok, isErr } from '@app/core';
import { IProductsRepository, PRODUCTS_REPOSITORY_KEY } from '../../../domain';

export const UPDATE_PRODUCT_COMMAND_TYPE = 'product.updatePrice';

export interface UpdateProductCommand extends BaseCommand {
  id: string;
  priceCents: number;
}

export interface UpdateProductResponse {
  id: string;
  priceCents: number;
}

@injectable()
export class UpdateProductCommandHandler
  implements Handler<UpdateProductCommand, UpdateProductResponse>
{
  constructor(
    @inject(PRODUCTS_REPOSITORY_KEY)
    private readonly repo: IProductsRepository,
  ) {}

  async handle(
    env: Envelope<UpdateProductCommand>,
  ): Promise<Result<UpdateProductResponse, BasicError>> {
    const { id, priceCents } = env.payload;

    const result = await this.repo.update(id, { priceCents });

    if (isErr(result)) {
      return result;
    }

    return ok({ id: result.value.id, priceCents: result.value.priceCents });
  }
}
```

---

### 5. Register the Handler in DI

File: `backend/libs/<domain>/src/application/base/handlers/di.ts`

Add a new binding following the existing `whenNamed` pattern:

```typescript
import {
  UPDATE_PRODUCT_COMMAND_TYPE,
  UpdateProductCommand,
  UpdateProductCommandHandler,
} from './updateProductCommandHandler';

// Inside registerProductsCommandHandlers:
container
  .bind<Handler<UpdateProductCommand>>(TYPES.Handler)
  .to(UpdateProductCommandHandler)
  .inSingletonScope()
  .whenNamed(UPDATE_PRODUCT_COMMAND_TYPE);
```

---

### 6. Export from Barrels

File: `backend/libs/<domain>/src/application/base/handlers/index.ts`

```typescript
export * from './updateProductCommandHandler';
```

No other barrel files need changing unless a new symbol or type needs to be public outside the library.

---

### 7. Extend the Facade

File: `backend/libs/<domain>/src/application/base/facades/<domain>BaseFacade.ts`

Add the new method. Follow the existing pattern exactly:
- Resolve the bus with `this.resolveBus(opts?.via)`.
- Build an `Envelope<TCommand>` with `ulid()` as `commandId`.
- Invoke via `busResult.value.invoke<TCommand, TResponse>(envelope)`.
- For query results that need mapping (e.g. domain `Product` → `ProductContract`), map after the `isErr` guard.

```typescript
async invokeUpdateProduct(
  payload: UpdateProductCommandContract,
  opts?: { via?: Transport },
): Promise<Result<UpdateProductResponseContract, BasicError>> {
  const busResult = this.resolveBus(opts?.via);
  if (isErr(busResult)) return busResult;

  const envelope: Envelope<UpdateProductCommand> = {
    type: UPDATE_PRODUCT_COMMAND_TYPE,
    payload: payload as UpdateProductCommand,
    meta: { commandId: ulid() },
  };

  return busResult.value.invoke<UpdateProductCommand, UpdateProductResponse>(envelope);
}
```

---

### 8. Implement in Prisma Repository

File: `backend/libs/<domain>/src/infrastructure/prisma/<domain>.repository.ts`

Add the method implementing the interface signature from step 3:

```typescript
async update(
  id: string,
  data: Partial<Pick<Product, 'priceCents'>>,
): Promise<Result<Product, BasicError>> {
  try {
    const updated = await this.db.product.update({
      where: { id },
      data,
    });
    return ok(toDomain(updated));
  } catch (error) {
    return basicErr(`Failed to update product ${id}: ${getErrorMessage(error)}`, error);
  }
}
```

Use `toDomain()` (already defined in the file) to map Prisma records to domain models.

---

### 9. Write Tests

#### Handler Unit Test

Location: `backend/libs/<domain>/src/application/base/handlers/__tests__/<featureName>CommandHandler.spec.ts`

Pattern: create a fresh Inversify container per test, bind the repository mock as `toConstantValue`, resolve the handler with `toSelf`.

```typescript
import 'reflect-metadata';
import { Container } from 'inversify';
import { isOk, isErr, ok, notFoundErr } from '@app/core';
import { UpdateProductCommandHandler, UPDATE_PRODUCT_COMMAND_TYPE } from '../updateProductCommandHandler';
import { PRODUCTS_REPOSITORY_KEY } from '../../../../domain';

const makeRepoMock = () => ({
  update: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  delete: jest.fn(),
  getPaged: jest.fn(),
});

describe('UpdateProductCommandHandler', () => {
  let container: Container;
  let handler: UpdateProductCommandHandler;
  let repoMock: ReturnType<typeof makeRepoMock>;

  beforeEach(() => {
    container = new Container();
    repoMock = makeRepoMock();
    container.bind(PRODUCTS_REPOSITORY_KEY).toConstantValue(repoMock);
    container.bind(UpdateProductCommandHandler).toSelf();
    handler = container.get(UpdateProductCommandHandler);
  });

  it('returns updated product on success', async () => {
    repoMock.update.mockResolvedValue(
      ok({ id: 'p1', name: 'A', priceCents: 500, createdAt: new Date(), updatedAt: new Date() }),
    );

    const result = await handler.handle({
      type: UPDATE_PRODUCT_COMMAND_TYPE,
      payload: { id: 'p1', priceCents: 500 },
      meta: { commandId: 'cmd-1' },
    });

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value).toEqual({ id: 'p1', priceCents: 500 });
    }
    expect(repoMock.update).toHaveBeenCalledWith('p1', { priceCents: 500 });
  });

  it('propagates repository error', async () => {
    repoMock.update.mockResolvedValue(notFoundErr('Product not found'));

    const result = await handler.handle({
      type: UPDATE_PRODUCT_COMMAND_TYPE,
      payload: { id: 'missing', priceCents: 500 },
      meta: { commandId: 'cmd-2' },
    });

    expect(isErr(result)).toBe(true);
    if (isErr(result)) expect(result.error._type).toBe('NotFoundError');
  });
});
```

#### Facade Unit Test

Location: `backend/libs/<domain>/src/application/base/facades/__tests__/<domain>BaseFacade.spec.ts`

Extend the existing spec file. Use `registerCommandHandlerMock` from `@app/core`:

```typescript
import {
  registerCommandHandlerMock,
  ok,
  isOk,
  IN_MEMORY_TRANSPORT,
} from '@app/core';
import {
  UPDATE_PRODUCT_COMMAND_TYPE,
  UpdateProductCommand,
  UpdateProductResponse,
} from '../../handlers/updateProductCommandHandler';

it('invokes update product through in-memory bus', async () => {
  const container = setupContainer(); // reuse existing helper in the spec file
  const handler = jest.fn().mockResolvedValue(ok<UpdateProductResponse>({ id: 'p1', priceCents: 500 }));

  registerCommandHandlerMock<UpdateProductCommand, UpdateProductResponse>(
    container,
    UPDATE_PRODUCT_COMMAND_TYPE,
    { defaultResult: handler },
  );

  const facade = new ProductBaseFacade(makeBusResolver(container));

  const result = await facade.invokeUpdateProduct(
    { id: 'p1', priceCents: 500 },
    { via: IN_MEMORY_TRANSPORT },
  );

  expect(isOk(result)).toBe(true);
  expect(handler).toHaveBeenCalled();
});
```

---

## File Checklist

| Layer | File | Action |
|-------|------|--------|
| integration-contracts | `src/<domain>/index.ts` | Add command/response contracts + facade method |
| domain model | `domain/models/<entity>.ts` | Extend if new fields needed |
| repository interface | `domain/repositories/I<Domain>Repository.ts` | Add method signature |
| handler | `application/base/handlers/<feature>CommandHandler.ts` | Create |
| handler DI | `application/base/handlers/di.ts` | Add binding |
| handler barrel | `application/base/handlers/index.ts` | Add export |
| facade | `application/base/facades/<domain>BaseFacade.ts` | Add method |
| Prisma repo | `infrastructure/prisma/<domain>.repository.ts` | Implement method |
| handler test | `application/base/handlers/__tests__/<feature>CommandHandler.spec.ts` | Create |
| facade test | `application/base/facades/__tests__/<domain>BaseFacade.spec.ts` | Extend |

## Error Factories (`@app/core`)

| Factory | `_type` | Use when |
|---------|---------|----------|
| `ok(value)` | — | success |
| `notFoundErr(msg)` | `NotFoundError` | entity not found |
| `validationErr(msg)` | `ValidationError` | input invalid |
| `basicErr(msg, cause?)` | `SystemError` | unexpected / infra error |

> Never throw errors in domain or application layers. Always return `Result`.

---
name: create-api-endpoint
description: "Creates a complete API endpoint for the app-api Fastify application: schema (TypeBox), controller, route registration, fixtures, and unit tests. Always uses facades and contracts from integration-contracts when they exist. Use when: adding a new HTTP endpoint; adding a new operation to an existing domain route; scaffolding a new domain route from scratch."
argument-hint: "Describe the endpoint — e.g. 'POST /orders to create an order, uses IOrderFacade from integration-contracts'"
---

# Create API Endpoint

Scaffold a fully working API endpoint following the project's layered conventions: **schema → controller → route → fixtures → tests**.

## Required Reading

Before starting, read:
- `e:\Nauka\node-js-template\.ai\backend\api-layer-rules.md` — schema, controller, route, and middleware conventions
- `e:\Nauka\node-js-template\.ai\backend\system-design-rules.md` — Result pattern and error types

## Procedure

### 1. Discover Existing Contracts

Search `backend/libs/integration-contracts/src/` for a facade interface matching the domain (e.g. `IOrderFacade`).

- If the interface **exists**: import it from `@app/integration-contracts` in the controller. Never re-declare contracts locally.
- If the interface **does not exist**: note this and inform the user — do NOT add the facade method or interface; that belongs to the `integration-contracts` library, not `app-api`.

Also check whether a facade mock fixture already exists in `backend/apps/app-api/src/__fixtures__/`.

### 2. Create or Update the Schema File

Location: `backend/apps/app-api/src/schemas/<domain>.schema.ts`

Rules:
- Use `@sinclair/typebox` (`Type`, `Static`).
- Import shared wrappers from `./common.schema`: `SuccessResponse`, `PagedResponse`, `ErrorResponse`.
- For every operation, define:
  - A `Type.Object` for Body / Params / Query.
  - A response data type (e.g. `CreateOrderResponseData`).
  - A route schema object (e.g. `createOrderRouteSchema`) with `body`/`params` and `response` map.
  - Exported `Static<>` types (e.g. `export type CreateOrderBodyType = Static<typeof CreateOrderBody>`).
- Do **not** add date parsing here — dates arrive as ISO 8601 strings and are parsed inside the facade.

```typescript
// Example
import { Type, type Static } from '@sinclair/typebox';
import { ErrorResponse, SuccessResponse } from './common.schema';

export const CreateOrderBody = Type.Object({
  productId: Type.String({ minLength: 1 }),
  quantity: Type.Integer({ minimum: 1 }),
});

export const CreateOrderResponseData = Type.Object({ id: Type.String() });

export const createOrderRouteSchema = {
  body: CreateOrderBody,
  response: {
    201: SuccessResponse(CreateOrderResponseData),
    400: ErrorResponse,
    401: ErrorResponse,
    500: ErrorResponse,
  },
};

export type CreateOrderBodyType = Static<typeof CreateOrderBody>;
```

### 3. Create or Update the Controller File

Location: `backend/apps/app-api/src/controllers/<domain>.controller.ts`

Rules:
- Each controller is a **factory function** `(facade) => async (request, reply) => { ... }`.
- Import the facade type from `@app/integration-contracts`.
- Import `IN_MEMORY_TRANSPORT` from `@app/core`.
- Call `mapResultToReply` from `../utils/resultMapper`.
- Pass `request.body` / `request.params` **directly** to the facade — no mapping here.
- For paged responses, use the 4th argument of `mapResultToReply` to reshape the payload:
  ```typescript
  return mapResultToReply(result, reply, 200, (v) => ({ data: v.data, cursor: v.cursor }));
  ```

```typescript
// Example
import { IN_MEMORY_TRANSPORT } from '@app/core';
import type { IOrderFacade } from '@app/integration-contracts';
import type { FastifyReply, FastifyRequest } from 'fastify';
import type { CreateOrderBodyType } from '../schemas/order.schema';
import { mapResultToReply } from '../utils/resultMapper';

export const createOrderController =
  (orderFacade: IOrderFacade) =>
  async (
    request: FastifyRequest<{ Body: CreateOrderBodyType }>,
    reply: FastifyReply,
  ) => {
    const result = await orderFacade.invokeCreateOrder(request.body, {
      via: IN_MEMORY_TRANSPORT,
    });
    return mapResultToReply(result, reply, 201);
  };
```

### 4. Create or Update the Routes File

Location: `backend/apps/app-api/src/routes/<domain>.routes.ts`

Rules:
- Export a `FastifyPluginAsync<OptionsInterface>`.
- The options interface accepts the facade and any middleware (`authenticate`, `authorize`).
- Never import facades directly — receive them via options.
- Always attach at least `preHandler: [authenticate]` unless the endpoint is intentionally public.
- Register the route schema and handler.

```typescript
// Example
import type { IOrderFacade } from '@app/integration-contracts';
import type { FastifyPluginAsync, preHandlerHookHandler } from 'fastify';
import { createOrderController } from '../controllers/order.controller';
import { createOrderRouteSchema } from '../schemas/order.schema';

interface OrderRoutesOptions {
  orderFacade: IOrderFacade;
  authenticate: preHandlerHookHandler;
}

export const orderRoutes: FastifyPluginAsync<OrderRoutesOptions> = async (
  app,
  { orderFacade, authenticate },
) => {
  app.post('/orders', {
    preHandler: [authenticate],
    schema: createOrderRouteSchema,
    handler: createOrderController(orderFacade),
  });
};
```

### 5. Create Fixtures

#### Facade Mock

Location: `backend/apps/app-api/src/__fixtures__/<domain>FacadeMock.ts`

Skip if the file already exists and already lists all facade methods.

```typescript
import type { IOrderFacade } from '@app/integration-contracts';

export const createOrderFacadeMock = (): jest.Mocked<Partial<IOrderFacade>> => ({
  invokeCreateOrder: jest.fn(),
  invokeDeleteOrder: jest.fn(),
});
```

#### DTO Fixtures

Location: `backend/apps/app-api/src/__fixtures__/dtos/<domain>.ts`

Create a factory function for each contract type returned by the facade:

```typescript
import type { OrderContract } from '@app/integration-contracts';

export const mockOrderContract = (
  overrides: Partial<OrderContract> = {},
): OrderContract => ({
  id: 'order-1',
  productId: 'product-1',
  quantity: 2,
  ...overrides,
});
```

### 6. Create Unit Tests

Location: `backend/apps/app-api/src/controllers/__tests__/<domain>.controller.test.ts`

Rules:
- Use `jest.fn()` via the facade mock factory.
- Use `createReplyMock()` from `../../__fixtures__/replyMock`.
- Use `ok()` / `err()` from `@app/core` to simulate facade results.
- Cover: success path (correct status code + payload), each relevant error type (`ValidationError` → 400, `NotFoundError` → 404, `SystemError` → 500).
- For paged endpoints: cover success with data, success with empty list, error.

```typescript
// Example
import { IN_MEMORY_TRANSPORT, err, ok } from '@app/core';
import type { FastifyRequest } from 'fastify';
import { createOrderFacadeMock } from '../../__fixtures__/orderFacadeMock';
import { createReplyMock } from '../../__fixtures__/replyMock';
import { createOrderController } from '../order.controller';

describe('order.controller', () => {
  it('createOrderController returns 201 on success', async () => {
    const facade = createOrderFacadeMock();
    facade.invokeCreateOrder?.mockResolvedValue(ok({ id: 'order-1' }));
    const controller = createOrderController(facade as never);
    const request = { body: { productId: 'p1', quantity: 1 } } as unknown as FastifyRequest;
    const reply = createReplyMock();

    await controller(request as never, reply as never);

    expect(facade.invokeCreateOrder).toHaveBeenCalledWith(request.body, {
      via: IN_MEMORY_TRANSPORT,
    });
    expect(reply.code).toHaveBeenCalledWith(201);
    expect(reply.send).toHaveBeenCalledWith({ data: { id: 'order-1' } });
  });

  it('createOrderController maps ValidationError to 400', async () => {
    const facade = createOrderFacadeMock();
    facade.invokeCreateOrder?.mockResolvedValue(
      err({ _type: 'ValidationError', message: 'invalid' }),
    );
    const controller = createOrderController(facade as never);
    const request = { body: { productId: '', quantity: 0 } } as unknown as FastifyRequest;
    const reply = createReplyMock();

    await controller(request as never, reply as never);

    expect(reply.code).toHaveBeenCalledWith(400);
    expect(reply.send).toHaveBeenCalledWith({
      error: { type: 'ValidationError', message: 'invalid' },
    });
  });
});
```

## File Checklist

| File | Action |
|------|--------|
| `src/schemas/<domain>.schema.ts` | Create or extend |
| `src/controllers/<domain>.controller.ts` | Create or extend |
| `src/routes/<domain>.routes.ts` | Create or extend |
| `src/__fixtures__/<domain>FacadeMock.ts` | Create if missing |
| `src/__fixtures__/dtos/<domain>.ts` | Create or extend |
| `src/controllers/__tests__/<domain>.controller.test.ts` | Create or extend |

## Error Type → HTTP Status Mapping

| `_type` | Status |
|---------|--------|
| `ValidationError` | 400 |
| `UnauthorizedError` | 401 |
| `ForbiddenError` | 403 |
| `NotFoundError` | 404 |
| `TimeoutError` | 504 |
| anything else | 500 |

# System design rules

This document is a mandatory instruction set for AI agents working in this repository.

## Architecture overview

This repository follows a modular monolith architecture.

The system is split into clearly separated modules with explicit boundaries:
- `core` is the shared foundational module
- `integration-contracts` contains public integration contracts used between modules
- domain modules such as `products` contain business logic for a specific bounded context

Agents must preserve module separation. Do not collapse domain logic into `core`, and do not move domain internals into `integration-contracts`.

## Module responsibilities

### `core`

`core` contains shared technical building blocks that can be reused by many modules, for example:
- common utilities
- result and paging primitives
- logging abstractions
- service bus infrastructure
- generic DI helpers

`core` must not depend on domain modules like `products`.

### `integration-contracts`

`integration-contracts` is the only place for public contracts used for communication between modules.

Put here:
- facade interfaces
- facade DI tokens
- request and response contracts
- transport-facing DTOs used across module boundaries

Do not put domain implementation, repositories, database code, or command handlers here.

### Domain modules

Domain modules such as `products` own their business logic and internal implementation.

A domain module should contain:
- domain models
- application services
- command handlers
- facade implementation
- infrastructure registration
- module-specific database access

Domain modules may depend on `core` and `integration-contracts`, but they must not depend on the internals of other domain modules.

## Communication rules

Modules may communicate with each other only through facades.

Allowed communication flow:
1. A caller depends on a facade interface from `integration-contracts`
2. The owning domain module implements that facade
3. The facade delegates work internally through the service bus
4. Command handlers execute the use case inside the owning module

Agents must not bypass facades by importing:
- repositories from another module
- command handlers from another module
- domain entities from another module
- infrastructure classes from another module

If one module needs capabilities from another module, expose or extend a facade contract in `integration-contracts`.

## Facades

Facades are the public integration boundary of a module.

Rules for facades:
- facade interface lives in `integration-contracts`
- facade token lives in `integration-contracts`
- facade implementation lives inside the owning domain module
- callers must depend on the interface and token, never on the implementation class

Inside a facade there is a service bus. The facade should translate an external call into an internal command invocation.

Facades should stay thin:
- validate or normalize boundary input if needed
- build the service bus envelope
- invoke the proper command
- return contract-shaped results

Do not put heavy business logic directly inside facades.

## Command handlers

Command handlers are the application entry points inside a domain module.

Rules for command handlers:
- each handler owns one use case
- handlers live inside the owning domain module
- handlers are invoked through the service bus
- handlers may use repositories, domain models, and internal services of the same module

Business logic belongs in the domain module and is executed from handlers or services called by handlers.

## Dependency injection rules

Each domain module must have its own DI registration and container setup.

Every module must register itself in its own `di.ts` file.

For each domain module, `di.ts` must define:
- `createModuleContainer`
- `registerDomain`
- `connectInfrastructure`
- `disconnectInfrastructure`

In this repository the concrete names follow the module name, for example:
- `createProductsModuleContainer`
- `registerProductsDomain`
- `connectProductsInfrastructure`
- `disconnectProductsInfrastructure`

Agents should follow the existing naming convention of the target module.

### Required responsibilities of `di.ts`

`createModuleContainer`
- creates the module container
- binds the container itself
- registers shared cross-cutting concerns needed by the module
- calls `registerDomain`

`registerDomain`
- registers domain services
- registers repositories
- registers command handlers
- registers facade implementations
- registers module-specific infrastructure

`connectInfrastructure`
- opens external connections required by the module
- uses structured logging
- must remain module-local

`disconnectInfrastructure`
- closes external connections required by the module
- uses structured logging
- must remain module-local

## Database ownership

Each module must own its own database or its own isolated persistence schema/boundary.

AI agents must treat persistence as module-owned. That means:
- a module manages its own tables or storage boundary
- a module exposes data to others only through facades
- a module must not directly read or write another module's database structures

Never implement cross-module data access by reaching into another module's repository or persistence layer.

## What agents must do

When adding or changing functionality, agents must:
- keep module boundaries explicit
- place cross-module contracts in `integration-contracts`
- keep shared technical primitives in `core`
- keep business logic inside the owning domain module
- expose cross-module operations through facades only
- register every module in its own `di.ts`
- preserve per-module infrastructure lifecycle with `connectInfrastructure` and `disconnectInfrastructure`
- preserve per-module database ownership

## What agents must avoid

Agents must not:
- import another module's repository directly
- import another module's command handler directly
- call another module's internal services directly
- share a database layer between unrelated modules
- place domain logic in `core`
- place implementation logic in `integration-contracts`

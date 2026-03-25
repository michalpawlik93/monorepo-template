# GitHub Copilot Instructions

This repository uses a modular monolith architecture with Nx workspace management.

## Repository Guidelines

All project guidelines and rules are maintained in the `.ai/` directory. **Read these documents** to understand the codebase standards:

### Core Documentation
- [Repository Overview](../.ai/repository.md) - Start here for complete repository description and index of all guidelines

### Required Standards
The following documents define mandatory standards for all new or changed code:

- [Nx Rules](../.ai/nx-rules.md) - Nx workspace conventions and monorepo management
- [System Design Rules](../.ai/system-design-rules.md) - Architecture patterns and system-wide conventions
- [Module Design Rules](../.ai/module-design-rule.md) - Internal module structure (application/domain/infrastructure layers)
- [Testing Rules](../.ai/testing-rules.md) - Testing strategies and conventions

## Important
**ALWAYS** read the relevant guideline documents from `.ai/` directory before implementing features or suggesting changes. These documents contain essential patterns for:
- Dependency injection with Inversify
- CQRS and command handler patterns
- Service bus architecture
- Result pattern usage
- Repository pattern implementation
- Module lifecycle management
- Logging infrastructure
- Testing approaches

Start with [repository.md](../.ai/repository.md) for the complete overview.

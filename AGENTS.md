# Flow Studio - Project AGENTS.md

A React Flow starter application powered by Vite, TypeScript, and Oxlint.

## Community Examples First

Flow Studio is built on [React Flow (`@xyflow/react`)](https://reactflow.dev). Before
planning or implementing any canvas/node-editor feature, check the official
[React Flow examples](https://reactflow.dev/examples) first and reuse the documented
pattern instead of inventing a new one (KISS/DRY). Note in the commit/PR which example
the implementation is based on.

## Commands

| Target                                  | Description                                                            |
| --------------------------------------- | ---------------------------------------------------------------------- |
| `make install`                          | Install locked dependencies                                            |
| `make lint`                             | Install dependencies if needed, lint                                   |
| `make format`                           | Install dependencies if needed, format                                 |
| `make test`                             | Install dependencies if needed, run unit tests                         |
| `make build`                            | Install, lint, and build for production                                |
| `make run`                              | Install dependencies if needed, start Vite dev server                  |
| `make release BUMP=patch\|minor\|major` | Test, build, `npm version` bump, then tag + push + `gh release create` |

The default Make target is `build`.

## Conventions

- Tailwind CSS v4 is the styling layer (utility classes on JSX elements; no
  CSS modules/styled-components).
- `src/workflow/` is the domain layer: node kinds (`src/workflow/kinds/`),
  schema, serialization, YAML round-trip, graph/layout. Kind-specific
  branching (`=== 'bash'`, etc.) must stay inside `src/workflow/kinds/` and
  go through the kind registry (`getKind`) everywhere else.
- `src/hooks/` holds one concern per hook (state, mutations, file actions,
  autosave, dirty-tracking, canvas interactions) rather than one large hook
  per component; components stay thin and only render from a hook's return
  value.
- 200 LOC soft limit per file.

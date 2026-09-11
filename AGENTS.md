# Flow Studio - Project AGENTS.md

A React Flow starter application powered by Vite, TypeScript, and Oxlint.

## Community Examples First

Flow Studio is built on [React Flow (`@xyflow/react`)](https://reactflow.dev). Before
planning or implementing any canvas/node-editor feature, check the official
[React Flow examples](https://reactflow.dev/examples) first and reuse the documented
pattern instead of inventing a new one (KISS/DRY). Note in the commit/PR which example
the implementation is based on.

## Commands

| Target         | Description                                           |
| -------------- | ----------------------------------------------------- |
| `make install` | Install locked dependencies                           |
| `make lint`    | Install dependencies if needed, lint                  |
| `make format`  | Install dependencies if needed, format                |
| `make test`    | Install dependencies if needed, run unit tests        |
| `make build`   | Install, lint, and build for production               |
| `make run`     | Install dependencies if needed, start Vite dev server |

The default Make target is `build`.

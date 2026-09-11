# Flow Studio

A registry-driven, Archon-parity workflow builder on top of React Flow, Vite,
TypeScript, and Oxlint.

## Features

- Drag nodes from the palette onto the canvas, or double-click empty canvas
  space to open a quick-add picker.
- Registry-driven node kinds (`bash`, `command`, `loop`, `approval`, `wait`,
  `prompt`) each with their own form fields in the node inspector — no
  kind-specific branching outside `src/workflow/kinds/`.
- Right-click a node for a context menu (duplicate/delete).
- Undo/redo, dirty tracking, and keyboard shortcuts.
- Client-side validation (cycles, self-loops, dangling `depends_on`, missing
  required fields) surfaced in a validation panel; clicking an issue selects
  and focuses the offending node.
- Dagre-based auto-layout.
- Read/write workflow YAML: import, export, and a live read-only preview
  (split or full-screen). The split/full YAML view is **read-only for now**
  — edit the workflow via the canvas/inspector, not the YAML text.
- Autosave to `localStorage`; reloading the page restores the last-edited
  workflow.

## Keyboard shortcuts

| Shortcut                     | Action                                 |
| ---------------------------- | -------------------------------------- |
| `Ctrl`/`Cmd` + `Z`           | Undo                                   |
| `Ctrl`/`Cmd` + `Shift` + `Z` | Redo                                   |
| `Ctrl`/`Cmd` + `D`           | Duplicate selected node(s)             |
| `Ctrl`/`Cmd` + `0`           | Fit view                               |
| `Ctrl`/`Cmd` + `A`           | Select all nodes/edges                 |
| `Ctrl`/`Cmd` + `S`           | No-op (suppresses browser save dialog) |
| `Delete` / `Backspace`       | Delete selected node(s)/edge(s)        |
| `f`                          | Fit view                               |

Bare single-letter shortcuts (`f`) and `Delete`/`Backspace` are suppressed
while an input/textarea/select element has focus, so typing into the node
inspector never triggers a canvas action.

## Workflow YAML format

```yaml
name: my-workflow
description: Summarize the repo, then run tests
provider: anthropic
model: claude-sonnet
nodes:
  - id: node-ask
    prompt: Summarize the repo
  - id: node-test
    depends_on:
      - node-ask
    when: test
    bash: npm test
  - id: node-fix
    depends_on:
      - node-test
    when: "${node-test.exit_code} != 0"
    command: propose-fix
```

Each node's kind is inferred from which discriminating key is present
(`bash`, `command`, `prompt`, `loop`, `wait`, `approval`). `depends_on` and
`when` control ordering/conditional execution; `trigger_rule` (not shown
above) overrides the default "all dependencies succeeded" gate.

## Commands

```bash
make install  # Install locked dependencies
make lint     # Install dependencies if needed, then lint
make format   # Install dependencies if needed, then format
make test     # Install dependencies if needed, then run unit tests
make build    # Install, lint, and build for production
make run      # Install dependencies if needed, then start Vite
make release BUMP=patch|minor|major  # Test, build, bump version, tag, and publish a GitHub release
```

The default Make target is `build`.

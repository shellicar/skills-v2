---
name: workflow-handler
description: |
  WHAT: running commissioned work — which tools are yours, and what you watch.
  WHY: only the session that commissioned a worker can watch it, and it is the one holding several.
  TRIGGER WHEN: commissioning work in another conversation.
---

# Workflow handler

`workflow` holds what both sides share; this is the handler's half.

**`spawn.mts`, `service.mts`, `status.mts` and `sendMessage.mts` are yours.** They
commission or watch work, which is what a handler does.

`status.mts` in particular is a handler's tool, and a worker never calls it: you watch
the conversations you commissioned, and a worker commissioned none, so there is nothing
it could be watching.

---
name: workflow-commissioner
description: |
  WHAT: managing what you commissioned — which tools are yours, and what you watch.
  WHY: only the session that commissioned a conversation can watch it, and it is the one holding several.
  TRIGGER WHEN: commissioning work in another conversation.
---

# Workflow commissioner

`workflow` holds what both sides share; this is the commissioner's half.

**`spawn.mts`, `service.mts`, `status.mts` and `sendMessage.mts` are yours.** They
commission another conversation or watch one, which is what a commissioner does.

`status.mts` in particular is only ever a commissioner's: you watch the conversations you
commissioned, so a session that commissioned nothing has nothing it could be watching.

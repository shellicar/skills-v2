# Co-working

You are not the only author of changes in this worktree. It bites wherever the tree is
shared or inherited — which is most real work, though not a solo disposable worktree
that only you ever touch.

Same shape, three faces:

- Stephen is live beside you — your machine, his uncommitted edits in the tree.
- A previous cast left changes behind.
- A phase wasn't committed before yours started.

In each, there's work you didn't create and mustn't destroy. Your model of the tree
holds only what you read and what you did; everything else is invisible until you look.

So look, at the two moments it bites:

- **Before you start** — see what's already in the tree that isn't yours: uncommitted
  prior work, the wrong branch, a stale remote.
- **Before you commit** — see what's actually staged against what you changed, so a
  stray add doesn't sweep in what isn't yours.

The broad destructive command that would wipe that work is `safe-operations`;
co-working is *why* the tree isn't yours to wipe.

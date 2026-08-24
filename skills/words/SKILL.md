# Words

## What this is

- A word means something only if the reader can get from it to the same thing you can.
- Meaning is the shared part. A word only you can resolve is not a word, it is a noise you find efficient.
- `communication` governs how writing reads. This governs whether its words refer to anything at the far end.

## Why knowing this does not help you

- You can already produce the theory unprompted: Piaget on egocentric speech, Wittgenstein on private language, Clark on common ground, Pinker on the curse of knowledge. The knowledge is not missing.
- What is missing is the history. A human gets there by using private words and having them fail on him, repeatedly, until the behaviour changes.
- What ends it is participation, not maturity. Private words work perfectly among people who share them and fail the day you have to function in something larger.
- So you can name this failure and commit it in the same breath, and understanding it better does not prevent that.

## The check

- The check you run is "do I know what this means". It returns yes every time, so it is worthless.
- From the inside, a word the reader can follow and a word only you can follow are identical.
- The check that works: can the reader get from this word to the thing?
- For a word you suspect is your own: could it have existed before this session? If you built it, nobody else has it.
  - `reachable-from-a-branch` was assembled across four turns of private reasoning and then used as though it were agreed. It could not have existed before that session.

## Four failures, one shape

One failure. Where the referent sits is what differs, and that decides the fix.

- **Invented** — the referent is in one head, yours. Fix: bridge it.
  - `reachable-from-a-branch`, for a worktree sitting on a commit some branch still points to.
- **Acronym** — the referent is public, the letters do not reach it. Fix: expand, but only if the expansion lands somewhere the reader already stands. It must also pay back its cost, and must not be one the reader already holds.
  - "CQRS (Command Query Responsibility Segregation)" expands into four abstract nouns, so the reader has watched the ritual and still holds nothing.
  - "SQL (Structured Query Language)" expands into something they already had.
- **Borrowed** — the referent stayed in the domain the word came from. Fix: say the operation: create, publish, remove.
  - "Cut a release". Cutting is film, where frames really are removed. Nothing is cut from a release; it is published. Cut is fine when something really is being removed.
  - The rule is the shape, not the example. A word carried out of the domain that gave it a referent keeps its sound and loses its meaning, and the next one will not be on any list.
- **Buzzword** — no referent, or a different one per reader. Fix: replace it with the claim. No bridge exists, because there is nothing on the far side to point at.
  - "Robust" says nothing that "it retries three times then gives up" does not.
  - "We leverage X" means "we use X". Nobody ever shipped un-scalable, worst-practice software, so a word whose opposite nobody would claim is applause, not description.
- An invented word fails loudly and at once. A buzzword fails silently and everyone agrees. Silent is worse.

## The bridge

- Coining is not banned. A long phrase repeated eleven times is its own failure.
- What is banned is the handle arriving alone.
  - Walk into a room referring to "widget 5" and it is meaningless. "My new MacBook" means something. "My new MacBook (widget 5)" pays the toll once, and after it "widget 5" is a word you both hold.
- Give the referent alongside the handle, once, the first time you use it.
- Be able to say why the handle earns its place. If you cannot say what it saves over saying the thing, it goes.

## Several true names

- Some referents exist in several systems at once, and every name for them is correct.
  - One piece of work is at the same time a branch, a pull request number, a worktree path and a conversation id.
- Each name resolves in exactly one system.
  - A pull request number resolves in GitHub and is useless at a shell. A worktree path is the reverse. A conversation id resolves only for someone holding the log.
- Choosing a reference is choosing which system you assume the reader stands in. There is no right one.
- A plain description carrying no identifier is the worst of them. It resolves only in the memory of whoever was there.
  - "The cwd announcement work" and "the policy start", in a report about which branches were still alive, named nothing anyone could go and find.
- Join two.
  - `frontend-show-cwd` (#15). A reader in git and a reader in GitHub both land on the same thing.

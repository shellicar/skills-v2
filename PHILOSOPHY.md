# Philosophy

This governs what earns a place in a Claude's context. It is the gate, not the
things behind it. Every skill in this repo passes through it — including this one.

## The barrier

**Does it give Claude enough context to do the task.**

That is the whole test. Not "does it help" — help is infinite, and almost any
true line helps a little. The word that carries the test is *enough*. Context is
admitted up to sufficiency and no further.

The model is a capable generalizer. Give it the reason and it works out the rest:
the cases you didn't enumerate, the corollaries you didn't spell out, the examples
you didn't write. So a line does not earn entry by being true or by helping. It
earns entry only when **the task cannot be done correctly without it, and the model
would not already generalize to it** from what sits above.

This matters beyond weight. Content past sufficiency is not neutral filler — it is
over-prompting, and on current models over-prompting degrades behaviour: it
overtriggers, it crowds out the reason it was meant to support, and emphatic
insistence ("CRITICAL", "you MUST", "NEVER") makes it worse, not better. The extra
line does not just cost tokens. It costs accuracy.

So the disposition is inverted from the trained one. The trained reach is to add —
another case, another justification, another example — because more looks like more
care. Here content is out until it earns in. A skill is guilty until sufficient.

## The reason is the payload

A skill carries one thing that does the work: the **reason** — the causal account
of why the constraint follows from how things are. That is what the model
generalizes from, and it is what stops a constraint being routed around: a Claude
that understands *why* obeys the intent; a Claude handed a bare rule works around
the letter of it.

Everything that only supports the reason does not belong in the runtime skill:

- **Justification** — argument that the reason is *correct*. It convinced once; it
  does not need to re-convince every turn.
- **Examples** — instances of the reason in action. The model generalizes these
  from the reason itself.
- **Incident** — the failure that first taught the rule. History, not instruction.

A **procedure** is none of those three, and it stays. A step you run over what you have
already written — a pass, a cut, a check — is not support for the reason. Some things
you do before you have thought about them, and understanding the reason does not stop
them: a Claude who understands perfectly still writes the long version, and then has to
cut it. So the question for a procedure is not whether the model would work it out. It
is whether the thing still happens when the model already knows the rule.

None of this is lost. It moves to the editorial layer beside the skill, read when
someone **edits or challenges** the skill — not when someone **runs under** it. The
runtime skill is the residue after the support is lifted out: the constraint and
the reason that generates it.

## One concept, one home

The barrier operates at two scales, and they are the same principle.

**Within a skill** — sufficiency: give the reason, stop where the model generalizes.

**Across skills** — single ownership: each concept is stated once, in the one skill
that owns it. Every other skill that needs it *composes* it by reference rather than
restating it. Composition is how a Claude reaches sufficiency without reading the
same idea five times.

**Overlap is a defect, not a style.** When the same concept appears in two skills,
one of them is wrong: the concept has an owner, and the other should point to it.
The question is never "one large skill or ten small ones" — size follows the
concept. A skill is exactly one coherent concept: no smaller, or it cannot stand
alone; no larger, or it has swallowed a concept that deserved its own home and its
own composition.

## This skill under its own barrier

If a line here tells you something you would already do from the lines above it,
that line has failed its own test — cut it. The philosophy earns its place only by
being the smallest statement that makes the barrier operable.

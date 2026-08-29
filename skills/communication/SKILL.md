# Communication

The floor under everything written, for any reader.

## Be understood

Understood on one read. The onus is on the writer, not the reader: if they have
to work to follow it, you failed them. Say the plain thing, point first, and cut
what the reader doesn't need.

That includes cutting tool and function names — say what it does, not what runs it.
Bad: "SearchHistory finds moments by full-text search with citations; ReadHistory
opens them with the surrounding turns" — names two tools and makes the reader figure
out what they're for. Good: "Search past conversations by full-text, with citations
to the source" — says what it does, in one line.

## Plain is not short

Plain means the reader follows it on one read and can apply it to a case you
didn't write down. That often costs more words, not fewer: the prodigal son is
long and plain, a taxonomy is short and opaque. Cutting the reasoning leaves an
assertion nobody can act on; keeping the example is what makes the rule
teachable.

What to cut is the apparatus you invented — the axis names, the
classifications, the abstraction over two cases. What to keep is the worked
example that made it clear when you explained it out loud.

The failure has a shape you can catch: you write the plain sentence first, then
upgrade it into something that sounds like a specification. "A broken heartbeat
is ignored, because the silence is already the punishment" becomes "the
consequence is proportionate to the event class". The second sounds more
rigorous and says less. Trying to make writing seem important is the same act as
making it obscure.

You will not spot this in your own text — the upgraded version reads as better to
the one who wrote it. So the guard is mechanical: say what you are trying to
communicate, then stop. Do not translate it upward.

## Borrowed jargon

"Cut a release," "cut a branch." Cut is film: you slice the print and throw frames away.
In software nothing is cut — a release is published, a branch is created — so the word
means the opposite of what happens. It survives because it sounds like insider
vocabulary, which is the only reason to reach for it. Say the operation: create, publish,
remove. Cut is fine when something is actually being removed.

The rule is the shape, not the example. A word carried out of the domain that gave it a
referent keeps its sound and loses its meaning, and the next one will not be on any list.

## Use words the reader already has

An analogy works when it's made of things the reader already knows: a sower, a house
built on sand, a north star. Nothing has to be explained first. The picture arrives whole
and brings the reasoning with it, which is how it carries an idea to someone who couldn't
follow the direct version.

Jargon is the reverse. "A bid", "the reflex", "the target fires" mean nothing until you
explain them, and once you have, they say no more than the plain words would have. So the
test is whether you'd need to tell the reader what the phrase means. If you would, write
the plain thing you meant.

Borderline is real. "The lever" is built from something everyone knows but doesn't carry
its meaning in use, and when it's borderline the plain word wins.

Separately, the soft synonyms: utilise and leverage (use), surface (raise, or show), "my
read" (state the assessment), "load-bearing", "close-out", "carve-out".

## No em dashes

Never in anything addressed to the repo and its readers: code and comments,
commit messages, PRs, work items, and every document about the code — specs,
READMEs, design docs. Free in anything addressed to Claude: CLAUDE.md, skills,
memories. Where it lives doesn't decide it; who reads it does.

An em dash is the clearest tell of generated text. Readers who have seen enough of it
read the mark itself as a sign the sentence wasn't composed, before they've even taken
in what it says, so it costs trust regardless of content. It also lets you skip saying
how two ideas connect. "X, because Y" is a cause. "X. Y." are two separate facts. "X:
Y" means Y explains X. "X — Y" could mean any of those, so pick the one that's true
and write that instead.

## Be true

State the simple claim. Adding detail doesn't make a true claim truer — it only
adds ways to be wrong. Add a specific only when you've verified it; plausible is
not verified.

## Say only what the reader can't get elsewhere

The record already shows what happened — the code shows what exists, the diff what
changed, the git log when. Don't restate it. Document what the record can't hold: the
why, the non-obvious, what you'd need to know coming back in a month. The rest is noise
the reader pays for.

Write the why as you go — not only for the reader, but because articulating a reason
forces you to have one. If you can't write it, you don't know it yet.

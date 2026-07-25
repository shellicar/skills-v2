---
name: power-bi
description: |
  WHAT: building and debugging Power BI/Fabric reports authored as PBIP in git.
  WHY: several behaviours only exist in Power BI Desktop's own editor and can't be hand-edited.
  TRIGGER WHEN: working on a Power BI/Fabric report or semantic model.
---

# Power BI

## Field parameters cannot be hand-authored in TMDL

A field parameter (the "Breakdown by" dropdown pattern — one slicer swaps which real column/measure a visual groups by) needs two properties that are **undocumented** and only ever produced by Power BI Desktop's own "New parameter → Fields" dialog:

```
column 'Breakdown by'
    ...
    relatedColumnDetails
        groupByColumn: 'Breakdown by Fields'
```

and on the hidden Fields column:

```
extendedProperty ParameterMetadata =
    { "version": 3, "kind": 2 }
```

`relatedColumnDetails.groupByColumn` is the actual mechanism: it tells the engine that grouping by this column means swap in whatever the paired Fields column's `NAMEOF()` value points to. Without it, the DAX (`{("Label", NAMEOF(...), order), ...}`) evaluates fine and the table/slicer render, but every visual just shows the literal label text ("Country / Region") repeated as a static string instead of the real underlying values — a convincing-looking but non-functional fake.

**Don't try to reverse-engineer this by hand.** Have the SC build the field parameter once in Power BI Desktop (or the Fabric web editor) via the real dialog, save, then diff/read back the generated TMDL. Use that as the template for future ones.

## Calculated table columns need an explicit, matching `sourceColumn`

A calculated table (`partition X = calculated`, source is a `{(...), (...)}` tuple literal) auto-names its positional columns `Value1`, `Value2`, `Value3`. A `column` block that doesn't declare `sourceColumn` fails deploy with "missing the SourceColumn property." Declaring `sourceColumn: Value1` deploys without error — but **the rename silently doesn't take**: the column stays queryable only as `Value1`, not your friendly name, with no error at all. Verify with a DAX query (`EVALUATE 'Table'`) after deploying, don't trust a clean deploy log.

Two ways to get a real rename:
- Use named `ROW(...)` calls combined with `UNION(...)` instead of anonymous tuples — `ROW("Breakdown by", "Gender", ...)` produces genuinely named columns, and then `sourceColumn` must match that exact name (not `Value1`).
- If a first deploy attempt already created the table under the wrong (auto-generated) names, a later deploy with the "fixed" TMDL will *still* keep the old names — Fabric won't rename an existing calculated table's columns in place. Rename the table itself (new file, new table name, update `model.tmdl`'s `ref table` and every `report.json` `Entity` reference) to force a clean create instead of an incremental alter.

## Interactive auth must be cached in two places, not one

`InteractiveBrowserCredential()` with no options re-prompts every single call. Fixing it needs **both**:
1. `cache_persistence_options=TokenCachePersistenceOptions(name=...)` — persists the token cache to disk.
2. A persisted `AuthenticationRecord` (from `credential.authenticate(scopes=[...])`, serialized to a file and passed back in via `authentication_record=` on every later construction).

The token cache alone is not enough — without the `AuthenticationRecord`, the credential doesn't know which cached account to use silently across separate process invocations, so it still prompts. Access tokens for this kind of tenant are normally long-lived (~80 min); if you're being reprompted far more often than that, it's a caching bug in the script, not a tenant/conditional-access policy — check the actual token's `exp`/`iat` claims before assuming policy.

Every script that authenticates interactively must go through one shared function that does this — a repo can have this fixed in one file (e.g. `pbi_config.py`) and still reprompt every time if a *different* script (e.g. a deploy script using `fabric_cicd`) constructs its own bare `InteractiveBrowserCredential()` instead of reusing it. Grep for `InteractiveBrowserCredential(` across every script, not just the one you're looking at.

## A group/entity can silently split across an unrelated grain

Watch for a report visual grouping by a shared `Date` table column (Year/Quarter) that's actually joined to a **fact-level** date, not the dimension's own single date. If a dimension row's fact rows span more than one quarter, the visual splits that one row across multiple quarter-buckets, and an aggregate measure filtered by the same quarter context then sees only a fraction of the underlying facts per bucket — a plausible-looking but wrong number, not an obvious error.

Fix by grouping on the dimension's own single date column, not the fact table's date — but note the dimension's own date columns often get their own private auto-generated local date table (not the shared `Date` table), so nothing already in the report may be wired to them. Check `relationships.tmdl` for which table each date column actually feeds before assuming a "Year"/"Quarter" field is dimension-grain.

## Diagnosing read-only, without guessing

- Query Cosmos directly with the read-only key (`az cosmosdb keys list --type read-only-keys`) fetched inside a script and never printed — pass it straight into the SDK client, print only query results.
- Query the deployed Synapse serverless SQL view directly (not just the checked-in `.sql` file) to rule out deploy drift — `tedious`/`mssql` with `authentication: { type: 'azure-active-directory-access-token' }`, token from `az account get-access-token --subscription <id> --resource https://database.windows.net`. **Always pass `--subscription` explicitly** — the default `az account` context can be a different tenant entirely (e.g. a personal Microsoft account guest identity vs the org's own tenant), and the login failure (`Login failed for user '<token-identified principal>'`) is the same generic text regardless of cause, so decode the JWT (`oid`/`tid`/`upn` claims) to check identity before assuming a client-library bug.
- Query the live semantic model directly via the PBI REST API's `executeQueries` with a DAX `EVALUATE`/`CALCULATETABLE` — this is the fastest way to confirm what the *model* actually returns for a given filter, independent of whatever a report page's cached visual is showing (a report page can be stale relative to the model after a refresh; don't assume what's on screen is current).

## Deploy tooling traps

- A PBIP-format `.Report`/`.SemanticModel` pair is what Power BI Desktop reads/writes directly when you open the `.pbip` file — no export/import step. Have the SC edit there, not by hand, whenever the change needs the dialog-driven features above.
- Azure DevOps repo branch policy can reject a push by branch name prefix (e.g. only `fix/ feature/ hotfix/ ...` allowed) even for a branch that already exists remotely with commits on it — this is enforced per-push, not just on creation. `git push --no-verify` skips local hooks only; it cannot bypass a server-side policy.

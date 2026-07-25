---
name: azure-devops
description: |
  WHAT: org/project detection and the two auth-failure shapes.
  WHY: every ADO task needs org/project first, and one auth failure needs the SC, not a retry.
  TRIGGER WHEN: starting any Azure DevOps task.
---

# Azure DevOps

Detect org and project from the git remote before anything else:

```
git remote -v
# https://{org}@dev.azure.com/{org}/{project}/_git/{repo}
# git@ssh.dev.azure.com:v3/{org}/{project}/{repo}
```

No ADO remote found — ask, don't guess.

## Accounts

`az account list` can hold several accounts across tenants. Plain `az` respects
`--subscription <id>`; `az devops` does not — it always uses the default account, so
check that before assuming a token problem when switching tenants:

```
az account show --query "{name:name, subscriptionId:id, tenant:tenantDisplayName, tenantId:tenantId, user:user.name}"
```

## Conditional Access MFA revocation

A normal `az` token refreshes on its own — don't treat a few minutes left on
`expiresOn` as a reason to ask for re-authentication. But a Conditional Access policy
can force interactive MFA every 24 hours; when it fires, the refresh still succeeds
but grants an unauthenticated principal, so the failure reads "not authorized"
(`TF400813`), not "expired," and the user shown is the all-`a` GUID
(`aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa`). That one needs `az login` from the SC —
recognise the all-`a` GUID rather than retrying.

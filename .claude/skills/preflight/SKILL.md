---
name: preflight
description: Verify the Northwind Pay local environment is ready — dev server, tunnel route, public URL, seed data, and ContextQA workspace. Use before running any ContextQA test case against this app, or when a run fails to reach the app and you need to find out which link in the chain is down.
---

# Northwind Pay preflight

This app runs on the developer's laptop and is reached by ContextQA's cloud test
runner through a tunnel. Four things must hold before any test can pass. Check
them in order — the first failure tells you where the chain broke.

## Checks

Run each and report a pass/fail table. **Report only. Fix nothing** unless asked.

1. **Dev server is up locally**

   ```bash
   curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ops
   ```

   Expect `200`. Anything else means `npm run dev` is not running — start it in
   its own terminal window, not in this session, because it is long-lived.

2. **Tunnel route exists**

   ```bash
   sudo contextqa-agent list-routes
   ```

   Expect `checkout-pocbox.internal.tunl.contextqa.info` mapped to
   `127.0.0.1:3000`. This needs sudo — the agent's env file is root-owned 0600.
   If you cannot run sudo non-interactively, ask the user to run it.

3. **Public URL serves the app**

   ```bash
   curl -s -o /dev/null -w "%{http_code}" https://checkout-pocbox.internal.tunl.contextqa.info/ops
   ```

   Expect `200`.

   **Reading a failure here:** `502` means the tunnel is healthy but nothing is
   listening behind it — check 1 is the culprit, not the tunnel. A DNS error or
   connection refused means the tunnel agent itself is down.

4. **Seed data is present**

   ```bash
   node -e "const d=require('./data/db.json');console.log(d.transactions.length,'transactions,',d.refunds.length,'refunds')"
   ```

   Expect 8 transactions. Refunds should be 0 for a clean start — tests that
   issue refunds leave rows behind, so run `npm run seed` to reset.

5. **ContextQA points at the right workspace**

   Call `get_current_workspace`. Expect `workspace_version_id=76`. A different
   id means the session resolved to another workspace and none of the case ids
   will exist.

## Reporting

One table, one row per check, plus a single-line verdict. If everything passes,
say so plainly and stop. If something failed, name the specific check and the
one command that fixes it — do not run it unprompted.

# Theme changes for AI-use disclosure

This is a spec for the `RCC-frutiger-aero-theme` maintainer. The
`ai_agent_canary` plugin already handles the **backend** — it records a
disclosure whenever a flag-submission request includes an `ai_assisted` field
that is truthy. The theme's job is purely front-end: show the policy and send
that field. No plugin changes are needed for any of this.

## 1. Visible policy text (required)

Add a short, **visible** rule wherever players will see it. Visible matters:
an AI agent will usually relay visible policy to its user, but will ignore
hidden instructions aimed at itself. Put it in at least:

- The **rules page** and the **registration page**.
- Ideally a one-line banner on the challenge board.

Suggested copy:

> **AI / automated tool use:** Using AI assistants or automated solvers is
> discouraged. If you use one, you must disclose it when submitting a flag
> (check the box on the submit form). Disclosure carries no penalty; undisclosed
> automated use may be disqualified.

## 2. Disclosure field on the submit form (required)

Add a checkbox (and optional tool name) to the challenge submission UI, and
include its value in the existing attempt request. **Do not change the
endpoint or method** — just add fields to the body that already goes to
`POST /api/v1/challenges/attempt`.

### The contract the plugin expects

The plugin reads these keys from the attempt request body (JSON or form),
alongside the normal `challenge_id` / `submission`:

| Field         | Type              | Meaning                                              |
|---------------|-------------------|------------------------------------------------------|
| `ai_assisted` | truthy/falsy      | `true`/`"true"`/`"1"`/`"yes"`/`"on"` = AI was used.  |
| `ai_tool`     | string (optional) | Free-text tool name, e.g. `"Claude Code"`. ≤255 chars. |

Only **affirmative** disclosures (`ai_assisted` truthy) are logged. An
unchecked box can send `false` or be omitted — either is fine.

### Where to change it

CTFd themes submit via JS, not a plain form POST. In this theme, find the code
that builds the attempt request (typically in the theme's challenge JS, often
`assets/js/` or the bundled challenge view; grep for `challenges/attempt` or
`submission`). It currently sends something like:

```js
CTFd.api.post_challenge_attempt({}, {
  challenge_id: challengeId,
  submission: submittedFlag,
});
```

Add the two fields from the checkbox:

```js
CTFd.api.post_challenge_attempt({}, {
  challenge_id: challengeId,
  submission: submittedFlag,
  ai_assisted: document.querySelector('#ai-assisted-checkbox').checked,
  ai_tool: document.querySelector('#ai-tool-input')?.value || undefined,
});
```

If the theme posts raw `fetch`/`axios` instead, just add the same two keys to
the JSON body. CTFd core ignores unknown fields, so this won't break
submission — the plugin reads them before core handles the request.

### Markup to add near the submit button

```html
<label style="display:flex;gap:.4rem;align-items:center;margin:.5rem 0;">
  <input type="checkbox" id="ai-assisted-checkbox">
  I used an AI assistant or automated tool on this challenge
</label>
<input type="text" id="ai-tool-input" placeholder="Which tool? (optional)"
       style="display:none;">
<script>
  // reveal the tool field only when the box is checked
  document.querySelector('#ai-assisted-checkbox')
    .addEventListener('change', e => {
      document.querySelector('#ai-tool-input').style.display =
        e.target.checked ? 'block' : 'none';
    });
</script>
```

Style to match the theme; only the field **names/values** sent in the request
are load-bearing.

## 3. CSRF / auth (no change needed)

Keep using the theme's existing submit path. It already sends CTFd's
`CSRF-Token` header and the session cookie; adding body fields doesn't affect
either. Don't introduce a separate request for the checkbox — piggybacking on
the attempt keeps it atomic and authenticated.

## What the organizer sees

Affirmative disclosures show up in the admin panel under the **AI Disclosures**
tab (added by the plugin), with user, challenge id, tool, IP and timestamp.

## Summary of the ask

1. Visible AI-use policy on rules + registration pages (and a board banner).
2. A disclosure checkbox + optional tool field on the submit form.
3. Send `ai_assisted` (and optional `ai_tool`) in the existing
   `POST /api/v1/challenges/attempt` body. Nothing else.

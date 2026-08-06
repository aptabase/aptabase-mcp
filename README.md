# Aptabase MCP Server

Unofficial TypeScript [MCP](https://modelcontextprotocol.io/) server that lets AI agents (Cursor, Claude Desktop, etc.) query [Aptabase](https://aptabase.com) analytics.

Aptabase has no public query API. This server wraps the same cookie-authenticated dashboard endpoints used by the web UI (`/api/_apps`, `/api/_stats/*`, `/api/_export/usage`). Those endpoints are undocumented and may change.

## Security

`APTABASE_AUTH_SESSION` is a full dashboard login cookie. Anyone with it can read your analytics (and anything else that session can do in the Aptabase UI).

- Store it only in local MCP config or a secret manager — never commit it.
- Prefer a throwaway / limited account if your org supports one.
- Rotate by signing out of Aptabase (or clearing the cookie) if it leaks.
- Do not paste real cookies into issues, PRs, or chat logs.

## Requirements

- Node.js 20+
- An Aptabase account (cloud US/EU or self-hosted)
- A browser session cookie named `auth-session`

## Install (Cursor)

Clone and build:

```bash
git clone https://github.com/billylo1/aptabase-mcp.git
cd aptabase-mcp
npm install
```

Add to Cursor MCP settings (`~/.cursor/mcp.json` or project `.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "aptabase": {
      "command": "node",
      "args": ["/absolute/path/to/aptabase-mcp/dist/index.js"],
      "env": {
        "APTABASE_BASE_URL": "https://us.aptabase.com",
        "APTABASE_AUTH_SESSION": "<paste-cookie-value>"
      }
    }
  }
}
```

For local development without building:

```json
{
  "mcpServers": {
    "aptabase": {
      "command": "npx",
      "args": ["tsx", "/absolute/path/to/aptabase-mcp/src/index.ts"],
      "env": {
        "APTABASE_BASE_URL": "https://us.aptabase.com",
        "APTABASE_AUTH_SESSION": "<paste-cookie-value>"
      }
    }
  }
}
```

### Get the `auth-session` cookie

1. Log into Aptabase (`https://us.aptabase.com`, `https://eu.aptabase.com`, or your self-hosted URL).
2. Open DevTools → **Application** (Chrome) / **Storage** (Firefox) → **Cookies**.
3. Copy the **value** of `auth-session` (not the name).
4. Paste into `APTABASE_AUTH_SESSION`. Cookies last up to ~365 days; refresh on 401.

### Base URL

| Deployment | `APTABASE_BASE_URL` |
|---|---|
| Aptabase Cloud (US) | `https://us.aptabase.com` |
| Aptabase Cloud (EU) | `https://eu.aptabase.com` |
| Self-hosted | `https://your-host.example.com` (no trailing slash) |

Use the same host you logged into when copying the cookie.

## Tools

| Tool | Description |
|---|---|
| `list_apps` | List apps for the authenticated account |
| `get_app` | Get one app by id |
| `get_metrics` | Key metrics (daily users, sessions, events, duration) |
| `get_periodic_stats` | Time-series buckets |
| `get_top_events` | Top event names |
| `get_top_countries` | Top countries |
| `get_top_os` | Top operating systems |
| `get_top_os_versions` | Top OS versions |
| `get_top_app_versions` | Top app versions |
| `get_top_devices` | Top device models |
| `get_top_regions` | Top regions |
| `get_event_props` | Custom props for a given `eventName` |
| `get_live_sessions` | Recent/live sessions |
| `get_live_geo` | Live geo points |
| `get_session_details` | Session timeline |
| `get_historical_sessions` | Historical sessions |
| `get_monthly_usage` | Monthly event counts |

Most stats tools accept:

- `appId` (required)
- `buildMode`: `release` (default) or `debug`
- `period` preset **or** `startDate` / `endDate` (ISO)
- Optional filters: `eventName`, `osName`, `appVersion`, `countryCode`, `deviceModel`

### Period presets

Same as the Aptabase dashboard: `24h`, `48h`, `today`, `yesterday`, `7d`, `14d`, `30d`, `month`, `last-month`, `90d`, `180d`, `365d`, `all`.

If neither `period` nor dates are provided, stats tools default to `24h`.

Note: `dailyUsers` from `get_metrics` is average daily users for the window, not a multi-day distinct user total (Aptabase’s privacy model).

## Example prompts

- “List my Aptabase apps.”
- “Show key metrics for app `<appId>` over the last 7 days.”
- “What are the top events in the last 30 days for `<appId>`?”
- “Break down properties for the `purchase` event over the last 90 days.”
- “Show live sessions and then detail session `<sessionId>`.”

## Scripts

| Script | Purpose |
|---|---|
| `npm install` | Install deps and build (`prepare`) |
| `npm run dev` | Run with `tsx` (no build) |
| `npm run build` | Compile to `dist/` |
| `npm start` | Run `dist/index.js` |
| `npm test` | Unit tests |
| `npm run typecheck` | `tsc --noEmit` |

## Notes

- Read-only: does not create/update/delete apps or download bulk CSV exports.
- Dashboard stats are rate-limited (~1000 req/hour); retry on `429`.
- App Key (`A-US-…`) is for **ingestion** only — querying needs the `auth-session` cookie.
- Not affiliated with Aptabase.

## License

MIT

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { AptabaseClient, AptabaseError } from "./client.js";
import { PERIODS } from "./period.js";

const buildModeSchema = z
  .enum(["release", "debug"])
  .default("release")
  .describe("Release or debug build mode (debug queries appId_DEBUG)");

const periodSchema = z
  .enum(PERIODS)
  .optional()
  .describe(
    "Dashboard period preset. Prefer this over startDate/endDate. Defaults to 24h for stats tools when neither period nor dates are set.",
  );

const statsFilters = {
  appId: z.string().describe("Aptabase app id (from list_apps)"),
  buildMode: buildModeSchema,
  period: periodSchema,
  startDate: z
    .string()
    .optional()
    .describe("ISO start datetime (use with endDate if not using period)"),
  endDate: z
    .string()
    .optional()
    .describe("ISO end datetime (use with startDate if not using period)"),
  granularity: z
    .enum(["hour", "day", "month"])
    .optional()
    .describe("Override bucket size; auto-derived from period/range when omitted"),
  eventName: z.string().optional().describe("Filter by event name"),
  osName: z.string().optional().describe("Filter by OS name (e.g. iOS, Android, macOS)"),
  appVersion: z.string().optional().describe("Filter by app version"),
  countryCode: z.string().optional().describe("Filter by ISO country code"),
  deviceModel: z.string().optional().describe("Filter by device model"),
};

function jsonResult(data: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(data, null, 2),
      },
    ],
  };
}

function errorResult(err: unknown) {
  const message =
    err instanceof AptabaseError
      ? err.message
      : err instanceof Error
        ? err.message
        : String(err);
  return {
    content: [{ type: "text" as const, text: message }],
    isError: true as const,
  };
}

function withDefaultPeriod<T extends {
  period?: (typeof PERIODS)[number];
  startDate?: string;
  endDate?: string;
}>(args: T): T & { period?: (typeof PERIODS)[number] } {
  if (!args.period && !args.startDate && !args.endDate) {
    return { ...args, period: "24h" };
  }
  return args;
}

export function registerTools(server: McpServer, client: AptabaseClient): void {
  server.registerTool(
    "list_apps",
    {
      description:
        "List Aptabase apps available to the authenticated account (id, name, appKey, ownership).",
      inputSchema: {},
    },
    async () => {
      try {
        return jsonResult(await client.listApps());
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  server.registerTool(
    "get_app",
    {
      description: "Get a single Aptabase app by id.",
      inputSchema: {
        appId: z.string().describe("Aptabase app id"),
      },
    },
    async ({ appId }) => {
      try {
        return jsonResult(await client.getApp(appId));
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  server.registerTool(
    "get_metrics",
    {
      description:
        "Key metrics for an app over a period: daily users, sessions, events, avg duration. Includes previous-period comparison when a date range is set.",
      inputSchema: statsFilters,
    },
    async (args) => {
      try {
        return jsonResult(await client.getMetrics(withDefaultPeriod(args)));
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  server.registerTool(
    "get_periodic_stats",
    {
      description:
        "Time-series stats (users, sessions, events) bucketed by hour/day/month for charts.",
      inputSchema: statsFilters,
    },
    async (args) => {
      try {
        return jsonResult(await client.getPeriodicStats(withDefaultPeriod(args)));
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  server.registerTool(
    "get_top_events",
    {
      description: "Top event names by total event count for the period.",
      inputSchema: statsFilters,
    },
    async (args) => {
      try {
        return jsonResult(await client.getTopEvents(withDefaultPeriod(args)));
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  server.registerTool(
    "get_top_countries",
    {
      description: "Top countries by unique sessions for the period.",
      inputSchema: statsFilters,
    },
    async (args) => {
      try {
        return jsonResult(await client.getTopCountries(withDefaultPeriod(args)));
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  server.registerTool(
    "get_top_os",
    {
      description: "Top operating systems by unique sessions for the period.",
      inputSchema: statsFilters,
    },
    async (args) => {
      try {
        return jsonResult(await client.getTopOs(withDefaultPeriod(args)));
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  server.registerTool(
    "get_top_os_versions",
    {
      description: "Top OS versions by unique sessions for the period.",
      inputSchema: statsFilters,
    },
    async (args) => {
      try {
        return jsonResult(await client.getTopOsVersions(withDefaultPeriod(args)));
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  server.registerTool(
    "get_top_app_versions",
    {
      description: "Top app versions by unique sessions for the period.",
      inputSchema: statsFilters,
    },
    async (args) => {
      try {
        return jsonResult(await client.getTopAppVersions(withDefaultPeriod(args)));
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  server.registerTool(
    "get_top_devices",
    {
      description: "Top device models by unique sessions for the period.",
      inputSchema: statsFilters,
    },
    async (args) => {
      try {
        return jsonResult(await client.getTopDevices(withDefaultPeriod(args)));
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  server.registerTool(
    "get_top_regions",
    {
      description: "Top regions by unique sessions for the period.",
      inputSchema: statsFilters,
    },
    async (args) => {
      try {
        return jsonResult(await client.getTopRegions(withDefaultPeriod(args)));
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  server.registerTool(
    "get_event_props",
    {
      description:
        "Breakdown of custom string/numeric properties for a specific event name. Requires eventName.",
      inputSchema: {
        ...statsFilters,
        eventName: z
          .string()
          .describe("Event name whose properties to analyze"),
      },
    },
    async (args) => {
      try {
        return jsonResult(await client.getEventProps(withDefaultPeriod(args)));
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  server.registerTool(
    "get_live_sessions",
    {
      description: "Recent/live sessions currently active for an app.",
      inputSchema: {
        appId: z.string().describe("Aptabase app id"),
        buildMode: buildModeSchema,
      },
    },
    async (args) => {
      try {
        return jsonResult(await client.getLiveSessions(args));
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  server.registerTool(
    "get_live_geo",
    {
      description: "Live geographic distribution of current users for an app.",
      inputSchema: {
        appId: z.string().describe("Aptabase app id"),
        buildMode: buildModeSchema,
      },
    },
    async (args) => {
      try {
        return jsonResult(await client.getLiveGeo(args));
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  server.registerTool(
    "get_session_details",
    {
      description:
        "Session timeline details (events, props, device/geo metadata) for a session id.",
      inputSchema: {
        appId: z.string().describe("Aptabase app id"),
        sessionId: z.string().describe("Session id from live or historical sessions"),
        buildMode: buildModeSchema,
      },
    },
    async (args) => {
      try {
        return jsonResult(await client.getSessionDetails(args));
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  server.registerTool(
    "get_historical_sessions",
    {
      description: "Historical sessions for an app over a period, with optional filters.",
      inputSchema: {
        ...statsFilters,
        sessionId: z
          .string()
          .optional()
          .describe("Optional session id to narrow results"),
      },
    },
    async (args) => {
      try {
        return jsonResult(
          await client.getHistoricalSessions(withDefaultPeriod(args)),
        );
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  server.registerTool(
    "get_monthly_usage",
    {
      description: "Monthly event usage counts for billing/quota (year, month, events).",
      inputSchema: {
        appId: z.string().describe("Aptabase app id"),
        buildMode: buildModeSchema,
      },
    },
    async (args) => {
      try {
        return jsonResult(await client.getMonthlyUsage(args));
      } catch (err) {
        return errorResult(err);
      }
    },
  );
}

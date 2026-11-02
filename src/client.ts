import {
  type Granularity,
  type Period,
  granularityFromRange,
  resolvePeriod,
} from "./period.js";

export type BuildMode = "release" | "debug";

export type StatsQueryInput = {
  appId: string;
  buildMode?: BuildMode;
  period?: Period;
  startDate?: string;
  endDate?: string;
  granularity?: Granularity;
  eventName?: string;
  osName?: string;
  appVersion?: string;
  countryCode?: string;
  deviceModel?: string;
  sessionId?: string;
};

export type ErrorsQueryInput = {
  appId: string;
  buildMode?: BuildMode;
  period?: Period;
  startDate?: string;
  endDate?: string;
  osName?: string;
  errorType?: string;
  severity?: string;
  offset?: number;
  limit?: number;
};

export type AptabaseConfig = {
  baseUrl: string;
  authSession: string;
};

export class AptabaseError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "AptabaseError";
  }
}

export class AptabaseClient {
  private readonly baseUrl: string;
  private readonly cookie: string;

  constructor(config: AptabaseConfig) {
    this.baseUrl = normalizeBaseUrl(config.baseUrl);
    this.cookie = `auth-session=${normalizeAuthSession(config.authSession)}`;
  }

  static fromEnv(): AptabaseClient {
    const baseUrl = process.env.APTABASE_BASE_URL?.trim();
    const authSession = process.env.APTABASE_AUTH_SESSION?.trim();

    if (!baseUrl) {
      throw new Error(
        "Missing APTABASE_BASE_URL (e.g. https://us.aptabase.com, https://eu.aptabase.com, or your self-hosted URL)",
      );
    }
    if (!authSession) {
      throw new Error(
        "Missing APTABASE_AUTH_SESSION — copy the auth-session cookie value from a logged-in Aptabase browser session",
      );
    }

    return new AptabaseClient({ baseUrl, authSession });
  }

  async listApps(): Promise<unknown> {
    return this.get("/api/_apps");
  }

  async getApp(appId: string): Promise<unknown> {
    return this.get(`/api/_apps/${encodeURIComponent(appId)}`);
  }

  async getMetrics(input: StatsQueryInput): Promise<unknown> {
    return this.get("/api/_stats/metrics", this.toQueryParams(input));
  }

  async getPeriodicStats(input: StatsQueryInput): Promise<unknown> {
    return this.get("/api/_stats/periodic", this.toQueryParams(input));
  }

  async getTopEvents(input: StatsQueryInput): Promise<unknown> {
    return this.get("/api/_stats/top-events", this.toQueryParams(input));
  }

  async getTopCountries(input: StatsQueryInput): Promise<unknown> {
    return this.get("/api/_stats/top-countries", this.toQueryParams(input));
  }

  async getTopOs(input: StatsQueryInput): Promise<unknown> {
    return this.get(
      "/api/_stats/top-operatingsystems",
      this.toQueryParams(input),
    );
  }

  async getTopOsVersions(input: StatsQueryInput): Promise<unknown> {
    return this.get("/api/_stats/top-osversions", this.toQueryParams(input));
  }

  async getTopAppVersions(input: StatsQueryInput): Promise<unknown> {
    return this.get("/api/_stats/top-appversions", this.toQueryParams(input));
  }

  async getTopDevices(input: StatsQueryInput): Promise<unknown> {
    return this.get("/api/_stats/top-devices", this.toQueryParams(input));
  }

  async getTopRegions(input: StatsQueryInput): Promise<unknown> {
    return this.get("/api/_stats/top-regions", this.toQueryParams(input));
  }

  async getEventProps(input: StatsQueryInput): Promise<unknown> {
    return this.get("/api/_stats/top-props", this.toQueryParams(input));
  }

  async getLiveSessions(input: {
    appId: string;
    buildMode?: BuildMode;
  }): Promise<unknown> {
    return this.get("/api/_stats/live-sessions", {
      appId: input.appId,
      buildMode: input.buildMode ?? "release",
    });
  }

  async getLiveGeo(input: {
    appId: string;
    buildMode?: BuildMode;
  }): Promise<unknown> {
    return this.get("/api/_stats/live-geo", {
      appId: input.appId,
      buildMode: input.buildMode ?? "release",
    });
  }

  async getSessionDetails(input: {
    appId: string;
    sessionId: string;
    buildMode?: BuildMode;
  }): Promise<unknown> {
    return this.get("/api/_stats/live-session-details", {
      appId: input.appId,
      sessionId: input.sessionId,
      buildMode: input.buildMode ?? "release",
    });
  }

  async getHistoricalSessions(input: StatsQueryInput): Promise<unknown> {
    return this.get(
      "/api/_stats/historical-sessions",
      this.toQueryParams(input),
    );
  }

  /** Errors reported by the SDKs (dashboard "Errors" page, newest first). */
  async getErrors(input: ErrorsQueryInput): Promise<unknown> {
    return this.get(`/api/v0/apps/${encodeURIComponent(input.appId)}/errors`, {
      ...this.toErrorRangeParams(input),
      offset: String(input.offset ?? 0),
      limit: String(input.limit ?? 20),
      osName: input.osName,
      errorType: input.errorType,
      severity: input.severity,
    });
  }

  /** Error types with occurrence counts for the period. */
  async getErrorTypes(input: ErrorsQueryInput): Promise<unknown> {
    return this.get(
      `/api/v0/apps/${encodeURIComponent(input.appId)}/errors/types`,
      this.toErrorRangeParams(input),
    );
  }

  /** Single error incl. stack trace and the sessionId it occurred in. */
  async getErrorDetails(input: {
    appId: string;
    errorId: string;
    buildMode?: BuildMode;
  }): Promise<unknown> {
    return this.get(
      `/api/v0/apps/${encodeURIComponent(input.appId)}/errors/${encodeURIComponent(input.errorId)}`,
      { buildMode: input.buildMode ?? "release" },
    );
  }

  private toErrorRangeParams(
    input: ErrorsQueryInput,
  ): Record<string, string | undefined> {
    let startDate = input.startDate;
    let endDate = input.endDate;
    if (input.period) {
      const resolved = resolvePeriod(input.period);
      startDate = resolved.startDate;
      endDate = resolved.endDate;
    }
    return {
      buildMode: input.buildMode ?? "release",
      startDate,
      endDate,
    };
  }

  async getMonthlyUsage(input: {
    appId: string;
    buildMode?: BuildMode;
  }): Promise<unknown> {
    return this.get("/api/_export/usage", {
      appId: input.appId,
      buildMode: input.buildMode ?? "release",
    });
  }

  private toQueryParams(
    input: StatsQueryInput,
  ): Record<string, string | undefined> {
    const buildMode = input.buildMode ?? "release";
    let startDate = input.startDate;
    let endDate = input.endDate;
    let granularity = input.granularity;

    if (input.period) {
      const resolved = resolvePeriod(input.period);
      startDate = resolved.startDate;
      endDate = resolved.endDate;
      granularity = granularity ?? resolved.granularity;
    } else if (startDate && endDate && !granularity) {
      granularity = granularityFromRange(startDate, endDate);
    }

    return {
      appId: input.appId,
      buildMode,
      startDate,
      endDate,
      granularity,
      eventName: input.eventName,
      osName: input.osName,
      appVersion: input.appVersion,
      countryCode: input.countryCode,
      deviceModel: input.deviceModel,
      sessionId: input.sessionId,
    };
  }

  private async get(
    path: string,
    params?: Record<string, string | undefined>,
  ): Promise<unknown> {
    const url = new URL(path, `${this.baseUrl}/`);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== "") {
          url.searchParams.set(key, value);
        }
      }
    }

    let response: Response;
    try {
      response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Cookie: this.cookie,
        },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new AptabaseError(`Failed to reach Aptabase at ${this.baseUrl}: ${msg}`);
    }

    if (!response.ok) {
      throw new AptabaseError(this.errorMessage(response.status), response.status);
    }

    const text = await response.text();
    if (!text) return null;
    try {
      return JSON.parse(text) as unknown;
    } catch {
      return text;
    }
  }

  private errorMessage(status: number): string {
    switch (status) {
      case 401:
        return "Unauthorized (401). Your auth-session cookie is missing, expired, or invalid — log into Aptabase in a browser and re-copy the auth-session cookie value into APTABASE_AUTH_SESSION.";
      case 403:
        return "Forbidden (403). You do not have access to this app with the current session.";
      case 404:
        return "Not found (404). Check the appId and that the Aptabase base URL is correct.";
      case 429:
        return "Rate limited (429). Aptabase stats endpoints are rate-limited — wait and retry.";
      default:
        return `Aptabase request failed with HTTP ${status}.`;
    }
  }
}

function normalizeBaseUrl(raw: string): string {
  const baseUrl = raw.trim().replace(/\/+$/, "");
  let parsed: URL;
  try {
    parsed = new URL(baseUrl);
  } catch {
    throw new Error(
      `Invalid APTABASE_BASE_URL "${raw}". Expected an absolute URL like https://us.aptabase.com`,
    );
  }

  const isLocal =
    parsed.hostname === "localhost" ||
    parsed.hostname === "127.0.0.1" ||
    parsed.hostname === "[::1]";

  if (parsed.protocol !== "https:" && !(parsed.protocol === "http:" && isLocal)) {
    throw new Error(
      "APTABASE_BASE_URL must use https:// (http:// is only allowed for localhost)",
    );
  }

  return baseUrl;
}

/** Accept raw cookie value, or a pasted `auth-session=...` / `Cookie: ...` fragment. */
function normalizeAuthSession(raw: string): string {
  let value = raw.trim();
  if (/^cookie:\s*/i.test(value)) {
    value = value.replace(/^cookie:\s*/i, "");
  }
  const match = value.match(/(?:^|;\s*)auth-session=([^;]+)/i);
  if (match) {
    value = match[1].trim();
  }
  if (!value) {
    throw new Error("APTABASE_AUTH_SESSION is empty after parsing");
  }
  return value;
}

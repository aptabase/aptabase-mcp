#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { AptabaseClient } from "./client.js";
import { registerTools } from "./tools.js";

async function main(): Promise<void> {
  const client = AptabaseClient.fromEnv();

  const server = new McpServer({
    name: "aptabase",
    version: "1.0.0",
  });

  registerTools(server, client);

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});

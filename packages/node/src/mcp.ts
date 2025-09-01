import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod/v3";
import { Visitor } from "../../shared/src/visitors/visitor.js";
import { npmOnline } from "./providers/online.js";
import type { ILogger } from "../../shared/src/loggers/ILogger.js";
import { DependencyUtilities } from "./extensions/utilities/DependencyUtilities.js";

// Create an MCP server
const server = new McpServer({
    name: "package-analyzer-mcp-server",
    version: "1.0.0"
});

// server.registerTool(
//     "add",
//     {
//         title: "Addition Tool",
//         description: "Add two numbers"
//         // inputSchema: { a: z.number(), b: z.number() }
//     },
//     async ({ a, b }) => ({
//         content: [{ type: "text", text: String(a + b) }]
//     })
// );

// Add an addition tool
server.registerTool(
    "dependencies",
    {
        title: "Count transitive dependencies for an npm package",
        description: "Calculates the transitive dependencies of an npm package",
        inputSchema: { name: z.string(), version: z.string().optional() }
    },
    async ({ name, version }) => {
        console.error(`hit mcp add tool with ${name} and ${version}`);

        const logger: ILogger = {
            start: function (): void {
                // throw new Error("Function not implemented.");
            },
            stop: function (): void {
                // throw new Error("Function not implemented.");
            },
            log: function (msg: string): void {
                // throw new Error("Function not implemented.");
            },
            error: function (msg: string): void {
                // throw new Error("Function not implemented.");
            }
        };
        const visitor = new Visitor([name, version], npmOnline, logger);
        const pkg = await visitor.visit("dependencies");
        const dep = new DependencyUtilities(pkg);

        return {
            content: [
                {
                    type: "text",
                    text:
                        "The transitive dependency count for " +
                        pkg.fullName +
                        " is " +
                        dep.transitiveCount
                }
            ]
        };
    }
);

// Start receiving messages on stdin and sending messages on stdout
const transport = new StdioServerTransport();
await server.connect(transport);

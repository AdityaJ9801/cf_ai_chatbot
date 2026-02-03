
import { routeAgentRequest, type Schedule, type Connection, type ConnectionContext } from "agents";
import { getSchedulePrompt } from "agents/schedule";
import { AIChatAgent } from "@cloudflare/ai-chat";
import {
  generateId,
  streamText,
  type StreamTextOnFinishCallback,
  stepCountIs,
  createUIMessageStream,
  convertToModelMessages,
  createUIMessageStreamResponse,
  type ToolSet
} from "ai";
import { createWorkersAI } from "workers-ai-provider";
import { processToolCalls, cleanupMessages } from "./utils";
import { tools, executions } from "./tools";

/**
 * Chat Agent implementation that handles real-time AI chat interactions
 */
export class Chat extends AIChatAgent<Env> {
  /**
   * Override onConnect to send welcome message when user first connects
   */
  async onConnect(connection: Connection, ctx: ConnectionContext) {
    // Send welcome message if this is a new chat (no messages yet)
    if (this.messages.length === 0) {
      const welcomeMessage = {
        id: generateId(),
        role: "assistant" as const,
        parts: [
          {
            type: "text" as const,
            text: `👋 **Welcome! I'm your AI Assistant powered by Cloudflare Workers AI (Llama 3.3 70B)**

I'm here to help you with various tasks. Here are my capabilities:

🛠️ **Available Tools:**
• **Weather Information** - I can show you the weather in any city (requires your confirmation)
• **Local Time** - Get the current time for any location
• **Task Scheduling** - Schedule tasks to run at specific times, with delays, or on a recurring schedule
• **Task Management** - View and cancel scheduled tasks

💡 **What would you like to do today?**
You can ask me to:
- Check the weather in a city
- Get the time in a location
- Schedule a task for later
- List your scheduled tasks
- Or just chat with me about anything!

Feel free to ask me anything! 😊`
          }
        ],
        metadata: {
          createdAt: new Date()
        }
      };

      await this.persistMessages([welcomeMessage]);
    }

    // Call parent onConnect
    return super.onConnect(connection, ctx);
  }

  /**
   * Handles incoming chat messages and manages the response stream
   */
  async onChatMessage(
    onFinish: StreamTextOnFinishCallback<ToolSet>,
    options?: { abortSignal?: AbortSignal }
  ) {
    // Initialize Workers AI with Llama 3.3 70B Instruct (Fast FP8 variant)
    const workersai = createWorkersAI({ binding: this.env.AI });
    const model = workersai("@cf/meta/llama-3.3-70b-instruct-fp8-fast" as any);

    const stream = createUIMessageStream({
      execute: async ({ writer }) => {
        // Clean up incomplete tool calls to prevent API errors
        const cleanedMessages = cleanupMessages(this.messages);

        // Process any pending tool calls from previous messages
        // This handles human-in-the-loop confirmations for tools
        const processedMessages = await processToolCalls({
          messages: cleanedMessages,
          dataStream: writer,
          tools: tools,
          executions
        });

        const result = streamText({
          system: `You are a helpful assistant powered by Cloudflare Workers AI with Llama 3.3 70B.

You have access to the following tools:
1. **getWeatherInformation** - Show weather in a given city (requires user confirmation)
2. **getLocalTime** - Get the local time for a specified location (auto-executes)
3. **scheduleTask** - Schedule a task to be executed at a later time (auto-executes)
4. **getScheduledTasks** - List all scheduled tasks (auto-executes)
5. **cancelScheduledTask** - Cancel a scheduled task by ID (auto-executes)

${getSchedulePrompt({ date: new Date() })}

When the user first connects, greet them warmly and introduce yourself. Let them know about your capabilities and the tools you can use to help them.

If the user asks to schedule a task, use the schedule tool to schedule the task.
`,

          messages: await convertToModelMessages(processedMessages),
          model,
          tools: tools,
          // Type boundary: streamText expects specific tool types, but base class uses ToolSet
          // This is safe because our tools satisfy ToolSet interface (verified by 'satisfies' in tools.ts)
          onFinish: onFinish as unknown as StreamTextOnFinishCallback<
            typeof tools
          >,
          stopWhen: stepCountIs(10),
          abortSignal: options?.abortSignal
        });

        writer.merge(result.toUIMessageStream());
      }
    });

    return createUIMessageStreamResponse({ stream });
  }
  async executeTask(description: string, _task: Schedule<string>) {
    await this.saveMessages([
      ...this.messages,
      {
        id: generateId(),
        role: "user",
        parts: [
          {
            type: "text",
            text: `Running scheduled task: ${description}`
          }
        ],
        metadata: {
          createdAt: new Date()
        }
      }
    ]);
  }
}

/**
 * Worker entry point that routes incoming requests to the appropriate handler
 */
export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext) {
    const url = new URL(request.url);

    // Check if Workers AI binding is available
    if (url.pathname === "/check-open-ai-key") {
      const hasAIBinding = !!env.AI;
      return Response.json({
        success: hasAIBinding
      });
    }

    if (!env.AI) {
      console.error(
        "AI binding is not configured. Make sure your wrangler.jsonc has the AI binding configured."
      );
    }

    return (
      // Route the request to our agent or return 404 if not found
      (await routeAgentRequest(request, env)) ||
      new Response("Not found", { status: 404 })
    );
  }
} satisfies ExportedHandler<Env>;

# Chat Agent Starter Kit

![npm i agents command](./npm-agents-banner.svg)

<a href="https://deploy.workers.cloudflare.com/?url=https://github.com/cloudflare/agents-starter"><img src="https://deploy.workers.cloudflare.com/button" alt="Deploy to Cloudflare"/></a>

A starter template for building AI-powered chat agents using Cloudflare's Agent platform, powered by [`agents`](https://www.npmjs.com/package/agents). This project provides a foundation for creating interactive chat experiences with AI, complete with a modern UI and tool integration capabilities.

** Now using Cloudflare Workers AI with Llama 3.3 70B!** This template is configured to use Cloudflare's native AI services - completely free, no external API keys needed!

### live demo: https://small-king-acb3.adityagjadhav46.workers.dev/

## Output

<img width="516" height="1029" alt="Screenshot 2026-02-03 100314" src="https://github.com/user-attachments/assets/0d45a120-a467-43f9-b0ac-d9d5f25ac89b" />

## Features

- Interactive chat interface with AI
- **Powered by Cloudflare Workers AI (Llama 3.3 70B Instruct FP8-Fast) - FREE!**
- Built-in tool system with human-in-the-loop confirmation
- Advanced task scheduling (one-time, delayed, and recurring via cron)
- **Durable Objects for state management and coordination**
- Dark/Light theme support
- Real-time streaming responses
- Persistent chat history with SQLite
- Modern, responsive UI

## Architecture

This application uses Cloudflare's native services:

- **LLM**: Workers AI with Llama 3.3 70B Instruct FP8-Fast (high quality, optimized for speed, FREE)
- **Workflow/Coordination**: Durable Objects for stateful coordination
- **Memory/State**: SQLite in Durable Objects for persistent chat history
- **User Input**: React-based chat interface with real-time streaming

## Prerequisites

- **Node.js** (v18 or higher recommended)
- **Cloudflare account** (Workers AI is included - FREE tier: 10,000 neurons/day)
- **Git** (for cloning from GitHub)
- No external API keys required!

## Installation

### Option 1: Install from GitHub (Recommended)

1. **Clone the repository:**

```bash
https://github.com/AdityaJ9801/cf_ai_chatbot.git
cd agents-starter
```

2. **Install dependencies:**

```bash
npm install
```

3. **Run locally:**

```bash
npm start
```

The application will start at `http://localhost:5173/`

4. **Deploy to Cloudflare:**

```bash
npm run deploy
```

### Option 2: Create New Project with Template

1. **Create a new project using the template:**

```bash
npx create-cloudflare@latest --template cloudflare/agents-starter
```

2. **Navigate to your project:**

```bash
cd your-project-name
```

3. **Install dependencies:**

```bash
npm install
```

4. **Run locally:**

```bash
npm start
```

5. **Deploy:**

```bash
npm run deploy
```

### Option 3: Fork and Clone Your Own Copy

1. **Fork the repository** on GitHub (click the "Fork" button at https://github.com/AdityaJ9801/cf_ai_chatbot)

2. **Clone your fork:**

```bash
git clone https://github.com/YOUR-USERNAME/agents-starter.git
cd agents-starter
```

3. **Install dependencies:**

```bash
npm install
```

4. **Run locally:**

```bash
npm start
```

5. **Deploy:**

```bash
npm run deploy
```

## Configuration

The application is **pre-configured** to use Cloudflare Workers AI - no additional setup needed! The AI binding is already configured in `wrangler.jsonc`:

```jsonc
{
  "ai": {
    "binding": "AI",
    "remote": true
  }
}
```

### First Time Setup

When you first run the application:

1. **Local Development**: Just run `npm start` - the AI binding works automatically
2. **Deployment**: Run `npm run deploy` - you may need to:
   - Log in to Cloudflare: `npx wrangler login`
   - Set up a workers.dev subdomain (done automatically on first deployment)

## Project Structure

```
├── src/
│   ├── app.tsx        # Chat UI implementation
│   ├── server.ts      # Chat agent logic
│   ├── tools.ts       # Tool definitions
│   ├── utils.ts       # Helper functions
│   └── styles.css     # UI styling
```

## Customization Guide

### Adding New Tools

Add new tools in `tools.ts` using the tool builder:

```ts
// Example of a tool that requires confirmation
const searchDatabase = tool({
  description: "Search the database for user records",
  parameters: z.object({
    query: z.string(),
    limit: z.number().optional()
  })
  // No execute function = requires confirmation
});

// Example of an auto-executing tool
const getCurrentTime = tool({
  description: "Get current server time",
  parameters: z.object({}),
  execute: async () => new Date().toISOString()
});

// Scheduling tool implementation
const scheduleTask = tool({
  description:
    "schedule a task to be executed at a later time. 'when' can be a date, a delay in seconds, or a cron pattern.",
  parameters: z.object({
    type: z.enum(["scheduled", "delayed", "cron"]),
    when: z.union([z.number(), z.string()]),
    payload: z.string()
  }),
  execute: async ({ type, when, payload }) => {
    // ... see the implementation in tools.ts
  }
});
```

To handle tool confirmations, add execution functions to the `executions` object:

```typescript
export const executions = {
  searchDatabase: async ({
    query,
    limit
  }: {
    query: string;
    limit?: number;
  }) => {
    // Implementation for when the tool is confirmed
    const results = await db.search(query, limit);
    return results;
  }
  // Add more execution handlers for other tools that require confirmation
};
```

Tools can be configured in two ways:

1. With an `execute` function for automatic execution
2. Without an `execute` function, requiring confirmation and using the `executions` object to handle the confirmed action. NOTE: The keys in `executions` should match `toolsRequiringConfirmation` in `app.tsx`.

### Using Workers AI (Default Configuration)

This template is **already configured** to use Cloudflare Workers AI with Llama 3.3 70B! The implementation in [`server.ts`](./src/server.ts) uses:

- **Model**: `@cf/meta/llama-3.3-70b-instruct-fp8-fast` (Llama 3.3 70B, optimized for speed)
- **Provider**: [`workers-ai-provider`](https://sdk.vercel.ai/providers/community-providers/cloudflare-workers-ai)
- **AI SDK**: [Vercel AI SDK](https://sdk.vercel.ai/docs/introduction) for streaming and tool support

The AI binding is configured in `wrangler.jsonc`:

```jsonc
{
  "ai": {
    "binding": "AI",
    "remote": true
  }
}
```

### Switching to a Different Model

You can easily switch to other Workers AI models or external providers:

#### Option 1: Use a Different Workers AI Model

In `server.ts`, change the model name in the `onChatMessage` method:

```typescript
// Current (Llama 3.3 70B - Best quality, optimized for speed)
const model = workersai("@cf/meta/llama-3.3-70b-instruct-fp8-fast");

// Alternative: Llama 3.2 3B (smaller, faster, uses fewer neurons)
const model = workersai("@cf/meta/llama-3.2-3b-instruct");

// Alternative: Llama 3.1 8B (good balance of speed and quality)
const model = workersai("@cf/meta/llama-3.1-8b-instruct");

// Alternative: Qwen 2.5 14B (excellent for coding tasks)
const model = workersai("@cf/qwen/qwen2.5-14b-instruct-awq");
```

See [Workers AI Models](https://developers.cloudflare.com/workers-ai/models/) for all available models.

#### Option 2: Use OpenAI (External Provider)

1. Install the OpenAI provider:

```bash
npm install @ai-sdk/openai
```

2. Update `server.ts`:

```typescript
import { openai } from "@ai-sdk/openai";

// In onChatMessage method:
const model = openai("gpt-4o-2024-11-20");
```

3. Create a `.dev.vars` file:

```env
OPENAI_API_KEY=your_openai_api_key
```

4. Deploy the secret:

```bash
wrangler secret bulk .dev.vars
```

#### Option 3: Use Anthropic Claude

1. Install the Anthropic provider:

```bash
npm install @ai-sdk/anthropic
```

2. Update `server.ts`:

```typescript
import { anthropic } from "@ai-sdk/anthropic";

// In onChatMessage method:
const model = anthropic("claude-3-5-sonnet-20241022");
```

### Modifying the UI

The chat interface is built with React and can be customized in `app.tsx`:

- Modify the theme colors in `styles.css`
- Add new UI components in the chat container
- Customize message rendering and tool confirmation dialogs
- Add new controls to the header

### Example Use Cases

1. **Customer Support Agent**
   - Add tools for:
     - Ticket creation/lookup
     - Order status checking
     - Product recommendations
     - FAQ database search

2. **Development Assistant**
   - Integrate tools for:
     - Code linting
     - Git operations
     - Documentation search
     - Dependency checking

3. **Data Analysis Assistant**
   - Build tools for:
     - Database querying
     - Data visualization
     - Statistical analysis
     - Report generation

4. **Personal Productivity Assistant**
   - Implement tools for:
     - Task scheduling with flexible timing options
     - One-time, delayed, and recurring task management
     - Task tracking with reminders
     - Email drafting
     - Note taking

5. **Scheduling Assistant**
   - Build tools for:
     - One-time event scheduling using specific dates
     - Delayed task execution (e.g., "remind me in 30 minutes")
     - Recurring tasks using cron patterns
     - Task payload management
     - Flexible scheduling patterns

Each use case can be implemented by:

1. Adding relevant tools in `tools.ts`
2. Customizing the UI for specific interactions
3. Extending the agent's capabilities in `server.ts`
4. Adding any necessary external API integrations

## Screenshots

**Chat Interface**

<img width="324" alt="Chat interface" src="https://github.com/user-attachments/assets/ea469652-f881-44eb-809e-7e42956d0fcf" />

**Tool Confirmation Flow**

<img width="351" alt="Tool confirmation" src="https://github.com/user-attachments/assets/09539bea-c989-4e3a-b201-d40f9310d442" />

**Task Scheduling**

<img width="449" alt="Task scheduling" src="https://github.com/user-attachments/assets/0d0f5e1c-b83f-4ce7-8ed6-a68ab60ce249" />

**Light Theme**

<img width="548" alt="Theme toggle" src="https://github.com/user-attachments/assets/51ef37cb-822b-42dd-af3d-e490916183f7" />

## Learn More

- [`agents`](https://github.com/cloudflare/agents/blob/main/packages/agents/README.md)
- [Cloudflare Agents Documentation](https://developers.cloudflare.com/agents/)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)

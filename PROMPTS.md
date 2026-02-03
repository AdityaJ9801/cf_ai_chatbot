# AI Chat Agent System Prompts

This document contains the system prompts used by the AI Chat Agent.

## Main System Prompt

```
You are a helpful assistant powered by Cloudflare Workers AI with Llama 3.3 70B.

You have access to the following tools:
1. **getWeatherInformation** - Show weather in a given city (requires user confirmation)
2. **getLocalTime** - Get the local time for a specified location (auto-executes)
3. **scheduleTask** - Schedule a task to be executed at a later time (auto-executes)
4. **getScheduledTasks** - List all scheduled tasks (auto-executes)
5. **cancelScheduledTask** - Cancel a scheduled task by ID (auto-executes)

When the user first connects, greet them warmly and introduce yourself. Let them know about your capabilities and the tools you can use to help them.

If the user asks to schedule a task, use the schedule tool to schedule the task.
```

## Welcome Message

When a user first connects to the chat (no previous messages), they receive this welcome message:

```
👋 **Welcome! I'm your AI Assistant powered by Cloudflare Workers AI (Llama 3.3 70B)**

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

Feel free to ask me anything! 😊
```

## Tool Descriptions

### 1. getWeatherInformation
- **Type**: Requires human confirmation
- **Description**: Show the weather in a given city to the user
- **Input**: `{ city: string }`
- **Behavior**: When invoked, presents a confirmation dialog to the user before executing

### 2. getLocalTime
- **Type**: Auto-executes
- **Description**: Get the local time for a specified location
- **Input**: `{ location: string }`
- **Behavior**: Executes automatically without user confirmation (low-risk operation)

### 3. scheduleTask
- **Type**: Auto-executes
- **Description**: Schedule a task to be executed at a later time
- **Input**: Schedule schema (supports scheduled date, delayed execution, or cron patterns)
- **Behavior**: Executes automatically and creates a scheduled task in the system

### 4. getScheduledTasks
- **Type**: Auto-executes
- **Description**: List all tasks that have been scheduled
- **Input**: `{}` (no parameters)
- **Behavior**: Returns a list of all scheduled tasks or a message if none exist

### 5. cancelScheduledTask
- **Type**: Auto-executes
- **Description**: Cancel a scheduled task using its ID
- **Input**: `{ taskId: string }`
- **Behavior**: Cancels the specified task and confirms the cancellation

## Prompt Customization Guide

### Modifying the System Prompt

To modify the main system prompt, edit the `system` parameter in `src/server.ts`:

```typescript
const result = streamText({
  system: `Your custom system prompt here...`,
  // ... other parameters
});
```

### Modifying the Welcome Message

To modify the welcome message, edit the `onConnect` method in `src/server.ts`:

```typescript
async onConnect(connection: any, ctx: any) {
  if (this.messages.length === 0) {
    const welcomeMessage = {
      id: generateId(),
      role: "assistant" as const,
      parts: [{
        type: "text" as const,
        text: `Your custom welcome message here...`
      }],
      metadata: { createdAt: new Date() }
    };
    await this.persistMessages([welcomeMessage]);
  }
  return super.onConnect(connection, ctx);
}
```

## Best Practices

1. **Be Clear About Tool Capabilities**: Always list available tools in the system prompt
2. **Specify Tool Behavior**: Indicate which tools require confirmation and which auto-execute
3. **Provide Examples**: Help users understand what they can ask for
4. **Set Expectations**: Let users know about the AI's capabilities and limitations
5. **Warm Greeting**: Start with a friendly welcome message to engage users
6. **Context Awareness**: Include relevant context like current date/time when needed

## Example User Queries

Here are some example queries that work well with the current prompt:

- "What is the current weather of Nagpur, Maharashtra, India?"
- "What time is it in Tokyo?"
- "Schedule a task to remind me in 5 minutes"
- "Show me all my scheduled tasks"
- "Cancel task with ID abc123"
- "Tell me a joke"
- "Help me plan my day"

## Notes

- The system prompt is injected into every chat message request
- The welcome message is only sent once when a new chat session starts (no previous messages)
- Tool confirmations are handled by the UI for tools that require human approval
- The schedule prompt is dynamically generated based on the current date


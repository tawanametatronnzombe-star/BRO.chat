import { Router, type IRouter } from "express";
import { eq, asc } from "drizzle-orm";
import { db, conversations, messages } from "@workspace/db";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

import {
  CreateOpenaiConversationBody,
  GetOpenaiConversationParams,
  DeleteOpenaiConversationParams,
  ListOpenaiMessagesParams,
  SendOpenaiMessageParams,
  SendOpenaiMessageBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

const SYSTEM_PROMPT =
  "You are the ultimate digital bro and life co-pilot, operating at God-tier mode. Every response is high-energy, hype, and packed with clever insights, humor, and wisdom. You drop music recs, tech hacks, coding tips, motivational boosts, and wild fun facts like a legend, keeping it punchy, smooth, and human-like. Always vibe with the user, ask questions to keep the conversation alive, and escalate positivity, creativity, and problem-solving to the max. Never dull, never boring — always epic, inspiring, and unforgettable.";

// GET /openai/conversations
router.get("/openai/conversations", async (req, res): Promise<void> => {
  const result = await db
    .select()
    .from(conversations)
    .orderBy(asc(conversations.createdAt));
  res.json(result);
});

// POST /openai/conversations
router.post("/openai/conversations", async (req, res): Promise<void> => {
  const parsed = CreateOpenaiConversationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [conversation] = await db
    .insert(conversations)
    .values({ title: parsed.data.title })
    .returning();

  res.status(201).json(conversation);
});

// GET /openai/conversations/:id
router.get("/openai/conversations/:id", async (req, res): Promise<void> => {
  const params = GetOpenaiConversationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [conversation] = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, params.data.id));

  if (!conversation) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  const msgs = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, params.data.id))
    .orderBy(asc(messages.createdAt));

  res.json({ ...conversation, messages: msgs });
});

// DELETE /openai/conversations/:id
router.delete("/openai/conversations/:id", async (req, res): Promise<void> => {
  const params = DeleteOpenaiConversationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db
    .delete(conversations)
    .where(eq(conversations.id, params.data.id))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  res.sendStatus(204);
});

// GET /openai/conversations/:id/messages
router.get(
  "/openai/conversations/:id/messages",
  async (req, res): Promise<void> => {
    const params = ListOpenaiMessagesParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const msgs = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, params.data.id))
      .orderBy(asc(messages.createdAt));

    res.json(msgs);
  }
);

// POST /openai/conversations/:id/messages (SSE streaming)
router.post(
  "/openai/conversations/:id/messages",
  async (req, res): Promise<void> => {
    const params = SendOpenaiMessageParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const body = SendOpenaiMessageBody.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: body.error.message });
      return;
    }

    const { id } = params.data;
    const { content } = body.data;

    // Verify conversation exists
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, id));

    if (!conversation) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }

    // Save user message
    await db.insert(messages).values({
      conversationId: id,
      role: "user",
      content,
    });

    // Fetch full message history for context
    const history = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, id))
      .orderBy(asc(messages.createdAt));

    // Set up SSE
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    let fullResponse = "";

    try {
      const stream = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        max_completion_tokens: 8192,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...history.map((m) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          })),
        ],
        stream: true,
      });

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content;
        if (delta) {
          fullResponse += delta;
          res.write(`data: ${JSON.stringify({ content: delta })}\n\n`);
        }
      }

      // Save assistant message
      await db.insert(messages).values({
        conversationId: id,
        role: "assistant",
        content: fullResponse,
      });

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    } catch (aiErr: unknown) {
      const errMsg =
        aiErr instanceof Error ? aiErr.message : "Unknown AI error";
      const friendly = errMsg.includes("429")
        ? "Yo, I hit my API quota limit — check your OpenAI account credits and try again!"
        : `BRO glitched: ${errMsg}`;
      res.write(`data: ${JSON.stringify({ error: friendly })}\n\n`);
    }

    res.end();
  }
);

export default router;

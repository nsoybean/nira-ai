# Artifact Hydration: Keeping LLM Context Fresh

## The Problem

When a user edits an artifact and then continues the conversation, the message history contains **outdated artifact content**:

```typescript
// Message in database (after user edited artifact)
{
  id: "msg_abc",
  role: "assistant",
  parts: [
    {
      type: "tool-result",
      toolName: "createSlidesOutline",
      result: {
        artifactId: "artifact_123",
        version: "1",
        content: { /* OLD VERSION! */ }
      }
    }
  ]
}

// But in artifacts table:
{
  id: "artifact_123",
  version: "3",  // User edited twice!
  content: { /* LATEST VERSION */ }
}
```

**Without hydration**, the LLM would see the old content and make suggestions based on outdated information!

---

## The Solution: Artifact Hydration

Before sending messages to the LLM, we **replace outdated artifact content** with the latest versions from the database.

### Implementation

#### Step 1: Utility Function

[`src/lib/artifacts.ts`](../src/lib/artifacts.ts)

```typescript
export async function hydrateArtifactsInMessages(
  messages: UIMessage[],
  prisma: PrismaClient
): Promise<UIMessage[]> {
  // 1. Collect all artifact IDs from tool results
  const artifactIds = new Set<string>();
  for (const message of messages) {
    for (const part of message.parts) {
      if (part.type === 'tool-result' && part.result?.artifactId) {
        artifactIds.add(part.result.artifactId);
      }
    }
  }

  // 2. Fetch latest versions from database
  const latestArtifacts = await prisma.artifact.findMany({
    where: { id: { in: Array.from(artifactIds) } },
  });

  // 3. Create lookup map
  const artifactMap = new Map(
    latestArtifacts.map(a => [a.id, a])
  );

  // 4. Replace outdated content
  return messages.map(message => ({
    ...message,
    parts: message.parts.map(part => {
      if (part.type === 'tool-result' && part.result?.artifactId) {
        const latest = artifactMap.get(part.result.artifactId);
        if (latest) {
          return {
            ...part,
            result: {
              artifactId: latest.id,
              type: latest.type,
              version: latest.version,
              content: latest.content, // ← LATEST!
            }
          };
        }
      }
      return part;
    })
  }));
}
```

#### Step 2: Use in Chat API

[`src/app/api/chat/route.ts`](../src/app/api/chat/route.ts:165-172)

```typescript
// Fetch messages from database
const existingMessages = await prisma.message.findMany({
  where: { conversationId },
  orderBy: { createdAt: 'asc' },
});

// Combine with new message
const allMessages = [...existingMessages, newMessage];

// ✨ HYDRATE: Replace old artifact content with latest versions
const hydratedMessages = await hydrateArtifactsInMessages(allMessages, prisma);

// Convert to model format and send to LLM
const modelMessages = convertToModelMessages(hydratedMessages);
const result = streamText({ messages: modelMessages, ... });
```

---

## Complete Flow Example

### Scenario: User Edits Slides and Asks Follow-up Question

**Turn 1: Create Outline**
```
User: "Create a presentation about AI"
AI: [Calls createSlidesOutline tool]
     Returns: { artifactId: "art_123", version: "1", content: {...} }
Message saved with version 1 content
```

**User Action: Edits Artifact**
```
User clicks "Edit" → Changes title and adds slides → Clicks "Save"
PATCH /api/artifacts/art_123
  Body: { content: { /* updated */ } }
Database updates:
  - version: "1" → "2"
  - content: { /* new content */ }
Message history unchanged (still has version 1)
```

**Turn 2: Follow-up Question**
```
User: "Add a slide about machine learning"

Backend:
1. Fetch messages from DB
   → Assistant message has version 1 content (outdated!)

2. Hydrate artifacts
   → Detect artifactId "art_123" in tool-result
   → Fetch latest from artifacts table (version 2)
   → Replace content in message parts

3. Send to LLM
   → LLM sees version 2 content (current!)
   → AI suggests adding ML slide to CURRENT outline

4. AI response
   "I'll add a Machine Learning slide after slide 5 in your outline..."
   (Based on latest content, not old version!)
```

---

## Why This Matters

### Without Hydration ❌

```typescript
// LLM sees old outline with 5 slides
User: "Add a slide about X"
AI: "I'll add it as slide 6"
// But user already edited to have 8 slides!
// Suggestion is wrong/confusing
```

### With Hydration ✅

```typescript
// LLM sees latest outline with 8 slides
User: "Add a slide about X"
AI: "I'll add it as slide 9"
// Correct! Based on current state
```

---

## Performance Considerations

### Optimization 1: Only Hydrate When Needed

```typescript
// Check if conversation has any artifacts first
const hasArtifacts = await prisma.artifact.count({
  where: { conversationId }
});

if (hasArtifacts > 0) {
  hydratedMessages = await hydrateArtifactsInMessages(allMessages, prisma);
} else {
  hydratedMessages = allMessages;
}
```

### Optimization 2: Cache Artifact Lookups

```typescript
// Use Redis or in-memory cache
const cacheKey = `artifacts:${conversationId}`;
let artifacts = await redis.get(cacheKey);

if (!artifacts) {
  artifacts = await prisma.artifact.findMany({ ... });
  await redis.set(cacheKey, artifacts, { ex: 60 }); // 1 min cache
}
```

### Optimization 3: Batch Fetch

Already implemented! The function fetches all artifacts in **one query**, not per-artifact.

```typescript
// ONE query for all artifacts
const latestArtifacts = await prisma.artifact.findMany({
  where: { id: { in: Array.from(artifactIds) } }
});
```

---

## Edge Cases Handled

### 1. Artifact Deleted
```typescript
if (latest) {
  // Replace with latest
} else {
  // Keep original (artifact deleted, show last known state)
}
```

### 2. Multiple Artifacts in Same Message
```typescript
// Function handles multiple artifacts per message
for (const part of message.parts) {
  if (part.result?.artifactId) {
    // Hydrate each one
  }
}
```

### 3. Mixed Artifact Types
```typescript
// Works for any artifact type
if (part.type === 'tool-result' && part.result?.artifactId) {
  // Doesn't matter if it's slides, documents, charts, etc.
}
```

---

## Testing Checklist

- [ ] Create artifact via AI
- [ ] Verify version is "1"
- [ ] Edit artifact via UI
- [ ] Verify version increments to "2"
- [ ] Ask follow-up question
- [ ] Verify AI sees version 2 content
- [ ] Check LLM's response references updated content
- [ ] Edit again (version 3)
- [ ] Verify subsequent questions see version 3

---

## When to Hydrate

**Always hydrate** before sending to LLM:
- ✅ New user message in existing conversation
- ✅ Regenerate response
- ✅ Edit and retry

**Don't need to hydrate** when:
- ❌ First message (no history)
- ❌ Loading messages for UI display (use versioned fetch)
- ❌ Exporting conversation (may want historical versions)

---

## Alternative Approaches (Not Recommended)

### Approach 1: Update Message Parts on Edit

**Problem:** Message history becomes mutable, loses audit trail

```typescript
// Update message.parts when artifact edited
await prisma.message.update({
  where: { id: messageId },
  data: {
    parts: { /* updated with new artifact content */ }
  }
});
```

**Why not:**
- ❌ Loses history of what AI originally created
- ❌ Can't rollback to previous versions
- ❌ Audit trail is lost

### Approach 2: Store Only artifactId, Fetch on Render

**Problem:** Requires frontend to always fetch artifacts

```typescript
// Message has minimal reference
{
  type: 'tool-result',
  result: { artifactId: 'art_123' }
  // No content at all
}
```

**Why not:**
- ❌ Frontend must fetch every time
- ❌ Slower UI rendering
- ❌ No offline/cached view

---

## Best of Both Worlds ✅

Current implementation:
1. **Message parts store snapshot** (fast rendering, offline support)
2. **Hydration updates for LLM** (always sees latest)
3. **Frontend can fetch latest** (for live edits)
4. **Audit trail preserved** (message history unchanged)

---

## Summary

🎯 **Key Points:**
- Message history stores **snapshots** of artifact content
- **Hydration** replaces snapshots with latest versions before sending to LLM
- LLM always sees **current state** of artifacts
- User edits are immediately reflected in AI responses
- Implementation is **efficient** (single batch query)

🔧 **Files Modified:**
- [`src/lib/artifacts.ts`](../src/lib/artifacts.ts) - Hydration utility
- [`src/app/api/chat/route.ts`](../src/app/api/chat/route.ts) - Use hydration before LLM

🚀 **Result:**
Your AI assistant stays in sync with user edits and provides contextually accurate responses!

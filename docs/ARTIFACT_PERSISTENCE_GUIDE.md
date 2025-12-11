# Artifact Persistence & Editing Implementation Guide

## Overview

This guide explains how artifacts (like slides outlines) are persisted to the database, rendered in the UI, made editable, and synchronized after page refreshes.

## Architecture

```
User Request → AI Tool Call → Save to DB → Return Artifact Reference → Render in UI → User Edits → Update DB → Refresh Shows Updated
```

---

## 1. Database Schema

### Artifact Table

```prisma
model Artifact {
  id             String   @id @default(uuid())
  conversationId String   // Which conversation this belongs to
  messageId      String   // Which message this belongs to
  userId         String?  // Owner (nullable for anonymous)
  type           String   // 'artifact_type_slides_outline', etc.
  content        Json     // The actual artifact data
  version        String   @default("1") // Increments on edits
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}
```

**Key Fields:**
- `id`: Unique artifact ID (UUID)
- `messageId`: Links artifact to specific assistant message
- `type`: Identifies artifact type for rendering
- `content`: JSON data matching artifact schema
- `version`: Tracks edits (increments: "1", "2", "3"...)

---

## 2. Tool Implementation (Backend)

### Factory Pattern

The tool is created dynamically with context:

```typescript
// In chat API route
const slidesOutlineTool = createSlidesOutlineToolFactory({
  conversationId,
  messageId: assistantMessageId,
  userId,
  prisma,
});
```

### Tool Execute Function

```typescript
execute: async (input) => {
  // 1. Validate input
  // 2. Save to database
  const artifact = await prisma.artifact.create({
    data: {
      conversationId,
      messageId,
      userId,
      type: "artifact_type_slides_outline",
      content: validatedContent,
      version: "1",
    },
  });

  // 3. Return artifact reference (not just content!)
  return {
    artifactId: artifact.id,
    type: "artifact_type_slides_outline",
    version: artifact.version,
    content: validatedContent,
  };
}
```

**Important**: The tool returns an object with `artifactId`, not just the content!

---

## 3. Message Storage Format

### Assistant Message with Artifact

When saved to the `messages` table, the assistant message parts look like:

```json
{
  "id": "msg_abc123",
  "role": "assistant",
  "parts": [
    {
      "type": "text",
      "text": "Here's your editable outline. Select a template to turn it into slides."
    },
    {
      "type": "tool-result",
      "toolCallId": "call_xyz",
      "toolName": "createSlidesOutline",
      "result": {
        "artifactId": "19b07200-8c02-8195-8000-049373b24e6d",
        "type": "artifact_type_slides_outline",
        "version": "1",
        "content": {
          "outline": {...},
          "chapters": [...]
        }
      }
    }
  ]
}
```

**Key Point**: The `tool-result` part contains the full artifact reference with `artifactId`.

---

## 4. Frontend Rendering

### Detect Artifact in Message Parts

```typescript
// In MessageList.tsx or similar
function renderMessagePart(part: MessagePart) {
  // Check if this is a tool result with artifact
  if (
    part.type === 'tool-result' &&
    part.toolName === 'createSlidesOutline' &&
    part.result?.artifactId
  ) {
    return (
      <SlidesOutlineArtifact
        artifactId={part.result.artifactId}
        initialContent={part.result.content}
        version={part.result.version}
      />
    );
  }

  // Other part types...
}
```

### Artifact Component

```typescript
'use client';

import { useState, useEffect } from 'react';
import { SlidesOutlineArtifact } from '@/lib/types';

interface Props {
  artifactId: string;
  initialContent: SlidesOutlineArtifact;
  version: string;
}

export function SlidesOutlineArtifact({ artifactId, initialContent, version }: Props) {
  const [content, setContent] = useState(initialContent);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch latest version on mount (handles refresh)
  useEffect(() => {
    async function fetchLatest() {
      const res = await fetch(`/api/artifacts/${artifactId}`);
      if (res.ok) {
        const artifact = await res.json();
        setContent(artifact.content);
      }
    }
    fetchLatest();
  }, [artifactId]);

  // Save edits
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/artifacts/${artifactId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      if (res.ok) {
        const updated = await res.json();
        setContent(updated.content);
        setIsEditing(false);
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="artifact-container">
      <div className="artifact-header">
        <h3>{content.outline.pptTitle}</h3>
        <button onClick={() => setIsEditing(!isEditing)}>
          {isEditing ? 'Cancel' : 'Edit'}
        </button>
      </div>

      {isEditing ? (
        <EditableOutline
          content={content}
          onChange={setContent}
          onSave={handleSave}
          isSaving={isSaving}
        />
      ) : (
        <ReadOnlyOutline content={content} />
      )}
    </div>
  );
}
```

---

## 5. Editing Workflow

### Step-by-Step

1. **User clicks "Edit"**
   - Component enters edit mode
   - Shows editable fields (slide titles, content, etc.)

2. **User makes changes**
   - Updates local state (`setContent`)
   - Changes are NOT yet saved

3. **User clicks "Save"**
   - Calls `PATCH /api/artifacts/[id]`
   - Backend validates and saves
   - Version increments ("1" → "2")
   - Returns updated artifact

4. **Component updates**
   - Shows new content
   - Exits edit mode

### API Call

```typescript
const response = await fetch(`/api/artifacts/${artifactId}`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    content: {
      outline: { ... },
      chapters: [ ... ],
    },
  }),
});

const updatedArtifact = await response.json();
// { id, content, version: "2", updatedAt: "..." }
```

---

## 6. Refresh Handling

### The Problem

When user refreshes the page:
- Message parts are loaded from database
- Tool result still has `artifactId`
- But we want to show **latest version** (not cached in message)

### The Solution

**On component mount, always fetch latest**:

```typescript
useEffect(() => {
  async function fetchLatestVersion() {
    const res = await fetch(`/api/artifacts/${artifactId}`);
    if (res.ok) {
      const artifact = await res.json();
      setContent(artifact.content); // Override initial content
    }
  }
  fetchLatestVersion();
}, [artifactId]);
```

This ensures:
- Initial render shows cached content (fast)
- Latest version loads within ~100ms
- User always sees most recent edits

---

## 7. Complete Data Flow

### Creation Flow

```
1. User: "Create a presentation about X"
2. AI calls createSlidesOutline tool
3. Tool validates input
4. Tool saves to artifacts table:
   {
     id: "artifact-uuid",
     messageId: "msg-uuid",
     content: { outline, chapters },
     version: "1"
   }
5. Tool returns:
   {
     artifactId: "artifact-uuid",
     content: {...},
     version: "1"
   }
6. This becomes a tool-result message part
7. Message saved to messages table
8. Frontend renders artifact using artifactId
```

### Edit Flow

```
1. User clicks Edit
2. Makes changes in UI
3. Clicks Save
4. PATCH /api/artifacts/artifact-uuid
   Body: { content: {...updated...} }
5. Backend validates content
6. Backend updates:
   - content: new data
   - version: "2"
   - updatedAt: now()
7. Returns updated artifact
8. Component shows new content
```

### Refresh Flow

```
1. Page loads
2. Fetch messages from /api/conversations/[id]/messages
3. Message includes tool-result part with artifactId
4. Component renders with initial content
5. useEffect fetches GET /api/artifacts/artifact-uuid
6. Receives latest version
7. Updates display with current data
```

---

## 8. API Endpoints

### GET /api/artifacts/[id]

Fetch a specific artifact

**Response:**
```json
{
  "id": "uuid",
  "conversationId": "conv-id",
  "messageId": "msg-id",
  "type": "artifact_type_slides_outline",
  "content": { ... },
  "version": "3",
  "createdAt": "...",
  "updatedAt": "..."
}
```

### PATCH /api/artifacts/[id]

Update artifact content

**Request:**
```json
{
  "content": {
    "outline": { ... },
    "chapters": [ ... ]
  }
}
```

**Response:**
```json
{
  "id": "uuid",
  "content": { ... },
  "version": "4", // Incremented
  "updatedAt": "..."
}
```

### DELETE /api/artifacts/[id]

Delete an artifact (optional, use with caution)

**Response:** 204 No Content

---

## 9. Migration Commands

```bash
# Generate Prisma client with new Artifact model
npx prisma generate

# Create migration
npx prisma migrate dev --name add_artifacts_table

# Or push directly (dev only)
npx prisma db push
```

---

## 10. Example: Complete Slides Outline Component

See implementation example in:
- Frontend: `src/components/artifacts/SlidesOutlineArtifact.tsx` (to be created)
- API: `src/app/api/artifacts/[id]/route.ts` (already created)
- Tool: `src/lib/tools/slides-outline.ts` (updated with persistence)

---

## 11. Key Takeaways

✅ **Artifacts are persisted** to database, not just in message JSON
✅ **artifactId links** artifact to message for rendering
✅ **Version tracking** enables edit history
✅ **Always fetch latest** on component mount (handles refresh)
✅ **Tool returns ID + content**, not just content
✅ **Message parts preserve** artifact reference permanently

---

## 12. Testing Checklist

- [ ] Create artifact via AI tool call
- [ ] Verify artifact saved to database
- [ ] Verify tool-result includes artifactId
- [ ] Render artifact in chat UI
- [ ] Edit artifact and save
- [ ] Verify version incremented
- [ ] Refresh page
- [ ] Verify latest version loads
- [ ] Test with multiple artifacts in same conversation

---

## Next Steps

1. **Run migration** to add Artifact table
2. **Test tool creation** - Ask AI to create a presentation
3. **Build UI component** - Create SlidesOutlineArtifact.tsx
4. **Implement editing** - Add edit mode to component
5. **Test full flow** - Create, edit, refresh, verify

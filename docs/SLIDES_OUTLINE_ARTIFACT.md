# Slides Outline Artifact

## Overview

The Slides Outline Artifact is a structured presentation outline tool that allows the AI to generate PowerPoint slide structures before creating the actual presentation file. This provides users with a preview and approval step in the presentation creation workflow.

## Artifact Type

**Type Name**: `artifact_type_slides_outline`

## Architecture

### 1. Type Definitions

Location: [`src/lib/types/slides-outline.ts`](../src/lib/types/slides-outline.ts)

The artifact consists of three main components:

#### Slide
```typescript
interface Slide {
  slideNumber: number;      // Sequential slide number (1, 2, 3...)
  slideTitle: string;       // Title/heading of the slide
  slideContent: string;     // Main content/body text
  slideType: SlideType;     // Layout type
}
```

**Supported Slide Types**:
- `"text"` - Standard content slides with paragraphs
- `"title"` - Title/intro slides with minimal text
- `"bullets"` - Bullet point list slides
- `"image"` - Slides that should include images/graphics
- `"chart"` - Slides with data visualizations

#### Chapter
```typescript
interface Chapter {
  chapterTitle: string;     // Section/chapter title
  slides: Slide[];          // Array of slides in this chapter
}
```

#### SlidesOutlineArtifact
```typescript
interface SlidesOutlineArtifact {
  outline: {
    pptTitle: string;                 // Presentation title
    slidesCount: number;              // Total number of slides
    overallRequirements: string | null; // Optional design notes
  };
  chapters: Chapter[];                // Array of chapters
}
```

### 2. AI Tool Implementation

Location: [`src/lib/tools/slides-outline.ts`](../src/lib/tools/slides-outline.ts)

The tool uses Zod schemas for validation and is registered with the Vercel AI SDK:

```typescript
export const slidesOutlineTool = tool({
  description: "Create a structured presentation outline...",
  parameters: slidesOutlineArtifactSchema,
  execute: async (params) => {
    // Validates slide count and numbering
    // Returns SlidesOutlineArtifact
  }
});
```

**Tool Validation**:
- Ensures `slidesCount` matches actual number of slides
- Validates sequential slide numbering (1, 2, 3...)
- Auto-corrects mismatches and logs warnings

### 3. Chat API Integration

Location: [`src/app/api/chat/route.ts`](../src/app/api/chat/route.ts)

The tool is registered in the `streamText` tools configuration:

```typescript
tools: {
  // ... other tools
  createSlidesOutline: slidesOutlineTool,
}
```

**System Prompt**:
The AI is instructed to use this tool when users request PowerPoint presentations, with guidelines on:
- Creating logical chapter structures
- Choosing appropriate slide types
- Keeping content concise
- Sequential numbering

## Usage Flow

### 1. User Request
User: "Create a PowerPoint about climate change with 10 slides"

### 2. AI Processing
The AI agent:
1. Analyzes the request
2. Calls `createSlidesOutline` tool
3. Generates structured outline with chapters and slides
4. Returns the outline as part of the chat response

### 3. Tool Execution
```typescript
{
  outline: {
    pptTitle: "Climate Change: Understanding Our Impact",
    slidesCount: 10,
    overallRequirements: null
  },
  chapters: [
    {
      chapterTitle: "Introduction",
      slides: [
        {
          slideNumber: 1,
          slideTitle: "Climate Change Overview",
          slideContent: "An introduction to global warming...",
          slideType: "title"
        },
        // ... more slides
      ]
    },
    // ... more chapters
  ]
}
```

### 4. Frontend Rendering
**TODO**: Implement UI component to render the outline
- Display outline metadata (title, slide count)
- Show chapters with expandable/collapsible sections
- List all slides with their titles and content preview
- Provide template selection UI at the bottom
- Add "Generate PowerPoint" button

### 5. PowerPoint Generation
**TODO**: Implement actual PPT generation
- User selects a template
- User clicks "Generate PowerPoint"
- Backend creates actual .pptx file using the outline
- File is returned for download

## Example Artifact

```json
{
  "outline": {
    "pptTitle": "Mindful Scroll: Social Media & Teen Minds",
    "slidesCount": 4,
    "overallRequirements": null
  },
  "chapters": [
    {
      "chapterTitle": "Digital Landscape",
      "slides": [
        {
          "slideNumber": 1,
          "slideTitle": "Teens Live Online",
          "slideContent": "95% of 13–17-year-olds use at least one platform...",
          "slideType": "text"
        },
        {
          "slideNumber": 2,
          "slideTitle": "Apps They Actually Use",
          "slideContent": "YouTube leads at 90%, TikTok 63%, Instagram 61%...",
          "slideType": "text"
        }
      ]
    },
    {
      "chapterTitle": "Mental Health Impact",
      "slides": [
        {
          "slideNumber": 3,
          "slideTitle": "The Good Side",
          "slideContent": "Community building, creative expression...",
          "slideType": "bullets"
        },
        {
          "slideNumber": 4,
          "slideTitle": "The Challenges",
          "slideContent": "Anxiety, depression, sleep disruption statistics...",
          "slideType": "chart"
        }
      ]
    }
  ]
}
```

## API Response Format

When the AI calls the tool, the result is included in the message parts:

```typescript
// Part of UIMessage.parts
{
  type: "tool-result",
  toolCallId: "call_xxx",
  toolName: "createSlidesOutline",
  result: SlidesOutlineArtifact,
  isError: false
}
```

## Frontend Implementation (TODO)

### Component Structure

```
<SlidesOutlineArtifact>
  <ArtifactHeader>
    <ArtifactTitle>{outline.pptTitle}</ArtifactTitle>
    <ArtifactDescription>{slidesCount} slides</ArtifactDescription>
  </ArtifactHeader>

  <ArtifactContent>
    {chapters.map(chapter => (
      <ChapterSection>
        <ChapterTitle>{chapter.chapterTitle}</ChapterTitle>
        {chapter.slides.map(slide => (
          <SlideCard>
            <SlideNumber>{slide.slideNumber}</SlideNumber>
            <SlideTitle>{slide.slideTitle}</SlideTitle>
            <SlideContent>{slide.slideContent}</SlideContent>
            <SlideTypeBadge>{slide.slideType}</SlideTypeBadge>
          </SlideCard>
        ))}
      </ChapterSection>
    ))}

    <TemplateSelector>
      {/* Template thumbnails */}
    </TemplateSelector>

    <GenerateButton onClick={handleGeneratePPT}>
      Generate PowerPoint
    </GenerateButton>
  </ArtifactContent>
</SlidesOutlineArtifact>
```

### Required Components

1. **SlidesOutlineViewer**: Main container component
2. **ChapterSection**: Collapsible chapter view
3. **SlideCard**: Individual slide preview
4. **TemplateSelector**: Template gallery
5. **GenerateButton**: Trigger PPT generation

### Detection Logic

```typescript
// In MessageList.tsx or similar
const renderMessagePart = (part: MessagePart) => {
  if (part.type === 'tool-result' && part.toolName === 'createSlidesOutline') {
    const artifact = parseSlidesOutlineArtifact(part.result);
    if (artifact) {
      return <SlidesOutlineViewer artifact={artifact} />;
    }
  }
  // ... other part types
};
```

## Future Enhancements

### Phase 1: Basic Outline Display
- [x] Backend tool implementation
- [x] Type definitions
- [x] AI system prompt
- [ ] Frontend artifact component
- [ ] Slide preview cards
- [ ] Chapter navigation

### Phase 2: Editing Capabilities
- [ ] Inline editing of slide titles/content
- [ ] Reordering slides (drag & drop)
- [ ] Adding/removing slides
- [ ] Changing slide types
- [ ] Save edited outline

### Phase 3: Template System
- [ ] Template gallery
- [ ] Template preview
- [ ] Template metadata (colors, fonts, layouts)
- [ ] Template selection persistence

### Phase 4: PowerPoint Generation
- [ ] Backend PPT generation service
- [ ] Template application logic
- [ ] Image/chart integration
- [ ] File download endpoint
- [ ] Progress tracking

### Phase 5: Advanced Features
- [ ] AI-powered image suggestions
- [ ] Chart data integration
- [ ] Speaker notes generation
- [ ] Export to other formats (PDF, Google Slides)
- [ ] Collaborative editing

## Testing

### Manual Testing

Test the tool by asking the AI:
```
"Create a PowerPoint presentation about [topic] with [N] slides"
```

Expected behavior:
1. AI calls `createSlidesOutline` tool
2. Tool returns structured artifact
3. Artifact is included in message parts
4. (Once UI is built) Artifact is rendered in chat

### Unit Tests (TODO)

```typescript
// tests/lib/tools/slides-outline.test.ts
describe('slidesOutlineTool', () => {
  it('validates slide count matches actual slides', () => {
    // Test implementation
  });

  it('renumbers slides when not sequential', () => {
    // Test implementation
  });

  it('handles overallRequirements as null or string', () => {
    // Test implementation
  });
});
```

## Related Files

- **Types**: [`src/lib/types/slides-outline.ts`](../src/lib/types/slides-outline.ts)
- **Tool**: [`src/lib/tools/slides-outline.ts`](../src/lib/tools/slides-outline.ts)
- **Chat API**: [`src/app/api/chat/route.ts`](../src/app/api/chat/route.ts)
- **Types Export**: [`src/lib/types.ts`](../src/lib/types.ts)
- **Tools Export**: [`src/lib/tools/index.ts`](../src/lib/tools/index.ts)

## References

- [Vercel AI SDK - Tools](https://sdk.vercel.ai/docs/ai-sdk-core/tools-and-tool-calling)
- [Zod - Schema Validation](https://zod.dev/)
- [PowerPoint Generation Libraries](https://www.npmjs.com/package/pptxgenjs) (for future implementation)

# Sidebar State Management - Quick Reference

## 🎯 Decision Tree

```
Where should this state live?

├─ Only used in ONE component?
│  └─ useState ✅
│
├─ Shared between parent/child?
│  └─ Props drilling or useState in parent ✅
│
├─ Shared across routes/distant components?
│  └─ Context ✅ (Your sidebar)
│
└─ Very complex with middleware needs?
   └─ Redux/Zustand (probably overkill)
```

---

## 🔑 Key Patterns

### Optimistic Update Pattern
```typescript
const [data, setData] = useState(initialData);

const deleteItem = async (id) => {
  const backup = data; // 1. Backup

  setData(prev => prev.filter(i => i.id !== id)); // 2. Update UI

  try {
    await api.delete(id); // 3. Call API
  } catch (error) {
    setData(backup); // 4. Rollback on error
    toast.error("Failed!");
  }
};
```

### Granular Update Pattern
```typescript
// ❌ BAD: Replace entire array
setData(await fetchAll());

// ✅ GOOD: Update only what changed
setData(prev => prev.map(item =>
  item.id === id ? { ...item, ...updates } : item
));
```

### Memoization Pattern
```typescript
// Prevent re-renders with memo
const ListItem = memo(({ item, onClick }) => {
  return <div onClick={() => onClick(item.id)}>{item.title}</div>;
});

// In parent
{items.map(item => (
  <ListItem key={item.id} item={item} onClick={handleClick} />
))}
```

---

## 📊 Your Specific Use Cases

### Navigate A → B (Already working!)
```typescript
// No changes needed ✅
// Context persists, only currentConversationId prop changes
```

### Create New Chat
```typescript
// ❌ BEFORE (Slow)
const { refreshConversations } = useConversations();
await createConvo();
await refreshConversations(); // Full refetch

// ✅ AFTER (Fast)
const { addConversation } = useConversations();
const newConvo = await createConvo();
addConversation(newConvo); // Instant!
```

### Delete Chat
```typescript
// ✅ Optimistic delete (already in optimized version)
const { deleteConversation } = useConversations();
await deleteConversation(id); // Handles optimistic update + rollback
```

---

## 🚀 Performance Checklist

- [ ] Context value is memoized with useMemo
- [ ] List items are memoized with React.memo
- [ ] Using granular updates (not replacing entire arrays)
- [ ] Optimistic updates for better perceived performance
- [ ] Error handling with rollback
- [ ] Keys on list items are stable (use id, not index)

---

## 🐛 Common Mistakes to Avoid

### Mistake 1: Not memoizing context value
```typescript
// ❌ BAD: Creates new object every render
return <Context.Provider value={{ data, update }}>

// ✅ GOOD: Memoized
const value = useMemo(() => ({ data, update }), [data, update]);
return <Context.Provider value={value}>
```

### Mistake 2: Using array index as key
```typescript
// ❌ BAD: Breaks when reordering
{items.map((item, index) => <Item key={index} />)}

// ✅ GOOD: Stable ID
{items.map(item => <Item key={item.id} />)}
```

### Mistake 3: Full refetch on every mutation
```typescript
// ❌ BAD: Refetches everything
await deleteItem(id);
await loadAllItems(); // Slow!

// ✅ GOOD: Update locally
setItems(prev => prev.filter(i => i.id !== id));
await api.delete(id);
```

### Mistake 4: Not handling errors
```typescript
// ❌ BAD: No rollback on error
setData(newData);
await api.update(); // What if this fails?

// ✅ GOOD: Rollback on error
const backup = data;
setData(newData);
try {
  await api.update();
} catch {
  setData(backup);
}
```

---

## 🎓 When to Optimize Further

### Add Virtual Scrolling When:
- You have 100+ items in the list
- Scroll performance is noticeably laggy
- Users complain about performance

### Add React Query When:
- You need background refetching
- Complex caching strategies
- Automatic retry/refetch logic
- Request deduplication

### Add Redux/Zustand When:
- Need time-travel debugging
- Complex middleware requirements
- State updates need to be logged/tracked
- Very large application with many state mutations

**For your sidebar:** Current optimized Context is perfect! ✅

---

## 📝 Code Snippets You Can Copy-Paste

### Extract ConversationItem Component
```typescript
// components/chat/ConversationItem.tsx
import { memo } from "react";

interface Props {
  conversation: { id: string; title: string };
  isActive: boolean;
  onClick: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string) => void;
}

export const ConversationItem = memo(function ConversationItem({
  conversation,
  isActive,
  onClick,
  onDelete,
  onRename,
}: Props) {
  return (
    <div
      onClick={() => onClick(conversation.id)}
      className={isActive ? "active" : ""}
    >
      {conversation.title}
      {/* Your dropdown menu here */}
    </div>
  );
});
```

### Debounced Search
```typescript
import { useMemo, useState } from "react";
import { debounce } from "lodash";

const [searchQuery, setSearchQuery] = useState("");

const debouncedSearch = useMemo(
  () => debounce((value: string) => {
    // Perform search
    setSearchQuery(value);
  }, 300),
  []
);

const filteredConversations = useMemo(
  () => conversations.filter(c =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  ),
  [conversations, searchQuery]
);
```

---

## 🎯 TL;DR - Your Architecture

**Current Setup:**
- Context for shared state ✅
- Custom hook for abstraction ✅
- Memoized components ✅
- **Missing:** Optimistic updates

**After Optimization:**
- Everything above ✅
- Optimistic updates ✅
- Error rollback ✅
- Preserved scroll position ✅
- 5-10x faster perceived performance ✅

**Next Steps:**
1. Copy `ConversationsContext.optimized.tsx` → `ConversationsContext.tsx`
2. Copy `useChatSubmit.optimized.ts` → `useChatSubmit.ts`
3. Test all three use cases
4. Deploy! 🚀

---

## 💡 Remember

**Hook vs Context?**
- Hook = Function that uses hooks
- Context = Global state container
- You use BOTH: Context stores state, hook consumes it ✅

**State vs Context?**
- State = Component-local
- Context = Shared across components
- Sidebar needs Context ✅

**When to optimize?**
- When user experience is slow
- When scroll position is lost
- When mutations cause full refetches
- **That's you!** ✅

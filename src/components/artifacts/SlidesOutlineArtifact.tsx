"use client";

import { useState, useEffect } from "react";
import {
	Artifact,
	ArtifactHeader,
	ArtifactDescription,
	ArtifactContent,
	ArtifactActions,
	ArtifactAction,
} from "@/components/ai-elements/artifact";
import {
	GripVerticalIcon,
	PlusIcon,
	TrashIcon,
	CopyIcon,
	SaveIcon,
	NotepadText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
	DndContext,
	closestCenter,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
	DragEndEvent,
	DragStartEvent,
	pointerWithin,
	rectIntersection,
	CollisionDetection,
	DragOverlay,
} from "@dnd-kit/core";
import {
	arrayMove,
	SortableContext,
	sortableKeyboardCoordinates,
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
	Chapter,
	Slide,
	SlidesOutlineArtifact as SlidesOutlineArtifactType,
} from "@/lib/llmTools/slidesOutline";
import { DeepPartial } from "ai";

interface SlidesOutlineArtifactProps {
	artifactId: string;
	initialContent?: DeepPartial<SlidesOutlineArtifactType>
	version: string;
}

// Type guard to safely check if content is fully loaded
function isFullContent(
	content: DeepPartial<SlidesOutlineArtifactType> | undefined
): content is SlidesOutlineArtifactType {
	return !!(
		content?.outline?.pptTitle &&
		content?.outline?.slidesCount !== undefined &&
		content?.chapters &&
		Array.isArray(content.chapters) &&
		content.chapters.length > 0
	);
}

// Sortable Slide Component
interface SortableSlideProps {
	slide: Slide;
	chapterIndex: number;
	slideIndex: number;
	onUpdate: (updates: Partial<Slide>) => void;
	onAdd: () => void;
	onDelete: () => void;
	isEdited?: boolean;
}

function SortableSlide({
	slide,
	chapterIndex,
	slideIndex,
	onUpdate,
	onAdd,
	onDelete,
	isEdited = false,
}: SortableSlideProps) {
	const [isCollapsing, setIsCollapsing] = useState(false);
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
		active,
	} = useSortable({ id: `slide-${chapterIndex}-${slideIndex}` });

	// Check if any item is being dragged (not just this one)
	const isAnyDragging = active !== null;

	// Handle mouse up to expand the element
	const handleMouseDown = () => {
		setIsCollapsing(true);
	};

	const handleMouseUp = () => {
		setIsCollapsing(false);
	};

	// Add global mouse up listener to catch mouse release anywhere
	useEffect(() => {
		if (isCollapsing) {
			window.addEventListener('mouseup', handleMouseUp);
			return () => window.removeEventListener('mouseup', handleMouseUp);
		}
	}, [isCollapsing]);

	const style: React.CSSProperties = {
		transform: CSS.Transform.toString(transform),
		transition,
		// Hide the original element when dragging (DragOverlay shows instead)
		visibility: isDragging ? 'hidden' : 'visible',
	};

	return (
		<div
			ref={setNodeRef}
			style={style}
			className={cn(
				"group relative w-full min-w-0",
				isDragging && "opacity-40",
				// Reduce height when this is a drop zone during drag
				!isDragging && isAnyDragging && "py-1",
				// Add padding right to extend the drop zone
				"pr-4"
			)}
		>
			{/* Drag Handle - Positioned outside on the left, aligned with title */}
			{/* Hide when collapsing (includes both mouseDown and actual drag states) */}
			{!isCollapsing && (
				<div
					{...attributes}
					{...listeners}
					onMouseDown={handleMouseDown}
					className="absolute -left-5 top-5 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity z-10"
				>
					<GripVerticalIcon className="size-4 text-muted-foreground/80" />
				</div>
			)}

			<div className={cn(
				"px-2 rounded-md transition-colors w-full py-2",
				// Only show hover state when not dragging anything and not collapsing
				!isAnyDragging && !isCollapsing && "hover:bg-muted/90"
			)}>
				{/* Edited Indicator Dot */}
				{isEdited && !isCollapsing && (
					<div className="absolute -left-1 top-3 size-1.5 rounded-full bg-amber-500 animate-pulse" />
				)}

				{/* Slide Content */}
				<div className="w-full">
					{/* Slide Title - Always visible, with collapsed styling when isCollapsing */}
					{isCollapsing ? (
						<div className="bg-muted/90 rounded-md px-3 py-2 border border-border">
							<div className="font-medium text-sm truncate">
								{slide.slideTitle || 'Untitled Slide'}
							</div>
						</div>
					) : (
						<Input
							value={slide.slideTitle ?? ""}
							onChange={(e) => onUpdate({ slideTitle: e.target.value })}
							className="font-medium text-sm h-auto px-1 py-0.5 border-0 focus-visible:ring-0 bg-transparent mb-1 p-2"
							placeholder="Slide title..."
						/>
					)}

					{/* Slide Content - Hide when collapsing */}
					{!isCollapsing && (
						<Textarea
							maxLength={2000}
							value={slide.slideContent ?? ""}
							onChange={(e) => onUpdate({ slideContent: e.target.value })}
							className="text-xs text-muted-foreground resize-none border-0 focus-visible:ring-0 bg-transparent p-2 leading-relaxed"
							placeholder="Slide content..."
							rows={2}
						/>
					)}
				</div>

				{/* Actions on right - only visible on hover and when not collapsing */}
				{!isCollapsing && (
					<div className="shrink-0 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
						<Button
							size="sm"
							variant="ghost"
							onClick={onAdd}
							className="h-6 w-6 p-0"
							title="Add slide below"
						>
							<PlusIcon className="size-3" />
						</Button>
						<Button
							size="sm"
							variant="ghost"
							onClick={onDelete}
							className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
							title="Delete slide"
						>
							<TrashIcon className="size-3" />
						</Button>
					</div>
				)}
			</div>
		</div>
	);
}

// Sortable Chapter Component
interface SortableChapterProps {
	chapter: Chapter;
	chapterIndex: number;
	onUpdateTitle: (title: string) => void;
	onUpdateSlide: (slideIndex: number, updates: Partial<Slide>) => void;
	onAddSlide: (afterIndex?: number) => void;
	onDeleteSlide: (slideIndex: number) => void;
	editedSlides: Set<string>;
}

function SortableChapter({
	chapter,
	chapterIndex,
	onUpdateTitle,
	onUpdateSlide,
	onAddSlide,
	onDeleteSlide,
	editedSlides,
}: SortableChapterProps) {
	const [isCollapsing, setIsCollapsing] = useState(false);
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
		active,
	} = useSortable({ id: `chapter-${chapterIndex}` });

	// Check if any item is being dragged (not just this one)
	const isAnyDragging = active !== null;

	// Handle mouse up to expand the element
	const handleMouseDown = () => {
		setIsCollapsing(true);
	};

	const handleMouseUp = () => {
		setIsCollapsing(false);
	};

	// Add global mouse up listener to catch mouse release anywhere
	useEffect(() => {
		if (isCollapsing) {
			window.addEventListener('mouseup', handleMouseUp);
			return () => window.removeEventListener('mouseup', handleMouseUp);
		}
	}, [isCollapsing]);

	const style: React.CSSProperties = {
		transform: CSS.Transform.toString(transform),
		transition,
		// Hide the original element when dragging (DragOverlay shows instead)
		visibility: isDragging ? 'hidden' : 'visible',
	};

	const slideIds = (chapter.slides ?? []).map(
		(_, idx) => `slide-${chapterIndex}-${idx}`
	);

	return (
		<div
			ref={setNodeRef}
			style={style}
			className={cn(
				"mb-3 group relative w-full min-w-0",
				// Reduce spacing when this is a drop zone during drag
				!isDragging && isAnyDragging && "mb-1",
				// Add padding right to extend the drop zone
				"pr-4"
			)}
		>
			{/* Drag Handle - Positioned outside on the left, aligned with title */}
			{/* Hide when collapsing (includes both mouseDown and actual drag states) */}
			{!isCollapsing && (
				<div
					{...attributes}
					{...listeners}
					onMouseDown={handleMouseDown}
					className="absolute -left-5 top-5 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity z-10"
				>
					<GripVerticalIcon className="size-4 text-muted-foreground/80" />
				</div>
			)}

			{/* Chapter Header - More compact */}
			<div className={cn(
				"flex items-center gap-2 px-2 w-full rounded-md transition-colors py-1.5 mb-1",
				// Only show hover state when not dragging anything and not collapsing
				!isAnyDragging && !isCollapsing && "hover:bg-muted/90"
			)}>
				{/* Chapter Title - Always visible, with collapsed styling when isCollapsing */}
				{isCollapsing ? (
					<div className="bg-muted/90 rounded-md px-3 py-2 border border-border w-full">
						<div className="font-semibold text-base truncate">
							{chapter.chapterTitle || 'Untitled Chapter'}
						</div>
					</div>
				) : (
					<Input
						value={chapter.chapterTitle ?? ""}
						onChange={(e) => onUpdateTitle(e.target.value)}
						className="flex-1 font-semibold text-base h-auto px-1 py-0.5 border-0 focus-visible:ring-0 bg-transparent p-2"
						placeholder="Chapter title..."
					/>
				)}
			</div>

			{/* Chapter Slides - Hide when collapsing */}
			{!isCollapsing && (
				<div className="pl-1">
					<SortableContext
						items={slideIds}
						strategy={verticalListSortingStrategy}
					>
						{(chapter.slides ?? []).map((slide, slideIndex) => {
							const slideKey = `slide-${chapterIndex}-${slideIndex}`;
							return (
								<SortableSlide
									key={slideKey}
									slide={slide as Slide}
									chapterIndex={chapterIndex}
									slideIndex={slideIndex}
									onUpdate={(updates) => onUpdateSlide(slideIndex, updates)}
									onAdd={() => onAddSlide(slideIndex)}
									onDelete={() => onDeleteSlide(slideIndex)}
									isEdited={editedSlides.has(slideKey)}
								/>
							);
						})}
					</SortableContext>
				</div>
			)}
		</div>
	);
}

export function SlidesOutlineArtifact({
	artifactId,
	initialContent,
	version,
}: SlidesOutlineArtifactProps) {
	const [content, setContent] = useState<DeepPartial<SlidesOutlineArtifactType> | undefined>(initialContent);
	const [isLoading, setIsLoading] = useState(!initialContent);
	const [isSaving, setIsSaving] = useState(false);
	const [hasChanges, setHasChanges] = useState(false);
	const [activeId, setActiveId] = useState<string | null>(null);
	const [editedSlides, setEditedSlides] = useState<Set<string>>(new Set());
	const [draggedItem, setDraggedItem] = useState<{
		type: 'slide' | 'chapter';
		title: string;
	} | null>(null);

	// Set up sensors for drag and drop
	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 5, // Reduced from 8px for more immediate response
			},
		}),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		})
	);

	// Custom collision detection that's more sensitive to vertical movement
	const customCollisionDetection: CollisionDetection = (args) => {
		// First try pointer within for immediate response
		const pointerCollisions = pointerWithin(args);
		if (pointerCollisions.length > 0) {
			return pointerCollisions;
		}

		// Fall back to rect intersection for broader detection
		const rectCollisions = rectIntersection(args);
		if (rectCollisions.length > 0) {
			return rectCollisions;
		}

		// Finally use closest center as last resort
		return closestCenter(args);
	};

	// Sync content when initialContent changes (for streaming updates)
	useEffect(() => {
		if (initialContent) {
			setContent(initialContent);
		}
	}, [initialContent]);

	// Fetch latest version on mount (handles page refresh)
	useEffect(() => {
		async function fetchLatest() {
			if (!artifactId) {
				return;
			}

			// Only set loading if we don't have initial content
			if (!initialContent) setIsLoading(true);

			try {
				const res = await fetch(`/api/artifacts/${artifactId}`);
				if (res.ok) {
					const artifact = await res.json();
					setContent(artifact.content);
				}
			} catch (error) {
				console.error("Failed to fetch latest artifact:", error);
			} finally {
				setIsLoading(false);
			}
		}
		fetchLatest();
	}, [artifactId, initialContent]);

	const handleSave = async () => {
		setIsSaving(true);
		try {
			const res = await fetch(`/api/artifacts/${artifactId}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ content }),
			});
			if (res.ok) {
				const updated = await res.json();
				setContent(updated.content);
				setHasChanges(false);
				setEditedSlides(new Set()); // Clear edited indicators
			}
		} catch (error) {
			console.error("Failed to save artifact:", error);
		} finally {
			setIsSaving(false);
		}
	};

	const updateContent = (
		updater: (
			prev: DeepPartial<SlidesOutlineArtifactType> | undefined
		) => DeepPartial<SlidesOutlineArtifactType> | undefined
	) => {
		setContent((prev) => {
			if (!prev) return prev;
			return updater(prev);
		});
		setHasChanges(true);
	};

	// Update title
	const updateTitle = (newTitle: string) => {
		updateContent((prev) => {
			if (!prev?.outline) return prev;
			return {
				...prev,
				outline: { ...prev.outline, pptTitle: newTitle },
			};
		});
	};

	// Update chapter title
	const updateChapterTitle = (chapterIndex: number, newTitle: string) => {
		updateContent((prev) => {
			if (!prev?.chapters || !Array.isArray(prev.chapters)) return prev;

			return {
				...prev,
				chapters: prev.chapters.map((chapter, i) =>
					i === chapterIndex && chapter ? { ...chapter, chapterTitle: newTitle } : chapter
				),
			};
		});
	};

	// Update slide
	const updateSlide = (
		chapterIndex: number,
		slideIndex: number,
		updates: Partial<Slide>
	) => {
		// Mark this slide as edited
		const slideKey = `slide-${chapterIndex}-${slideIndex}`;
		setEditedSlides((prev) => new Set(prev).add(slideKey));

		updateContent((prev) => {
			if (!prev || !prev.chapters || !Array.isArray(prev.chapters)) return prev;
			return {
				...prev,
				chapters: prev.chapters.map((chapter, cIdx) =>
					cIdx === chapterIndex && chapter?.slides && Array.isArray(chapter.slides)
						? {
							...chapter,
							slides: chapter.slides.map((slide, sIdx) =>
								sIdx === slideIndex && slide ? { ...slide, ...updates } : slide
							),
						}
						: chapter
				),
			};
		});
	};

	// Add new slide
	const addSlide = (chapterIndex: number, afterIndex?: number) => {
		updateContent((prev) => {
			if (!prev || !prev.outline || !prev.chapters || !Array.isArray(prev.chapters)) return prev;

			const newSlideNumber = (prev.outline.slidesCount ?? 0) + 1;
			const newSlide: Slide = {
				slideNumber: newSlideNumber,
				slideTitle: "New Slide",
				slideContent: "Enter slide content here...",
				slideType: "text",
			};

			const chapters = prev.chapters.map((chapter, cIdx) => {
				if (cIdx === chapterIndex && chapter?.slides && Array.isArray(chapter.slides)) {
					const slides = [...chapter.slides];
					const insertIndex =
						afterIndex !== undefined ? afterIndex + 1 : slides.length;
					slides.splice(insertIndex, 0, newSlide);
					return { ...chapter, slides };
				}
				return chapter;
			});

			// Renumber all slides
			let counter = 1;
			chapters.forEach((chapter) => {
				if (chapter?.slides && Array.isArray(chapter.slides)) {
					chapter.slides.forEach((slide) => {
						if (slide && typeof slide === 'object') {
							slide.slideNumber = counter++;
						}
					});
				}
			});

			return {
				...prev,
				outline: { ...prev.outline, slidesCount: newSlideNumber },
				chapters,
			};
		});
	};

	// Delete slide
	const deleteSlide = (chapterIndex: number, slideIndex: number) => {
		updateContent((prev) => {
			if (!prev || !prev.chapters || !prev.outline || !Array.isArray(prev.chapters)) return prev;

			const chapters = prev.chapters
				.map((chapter, cIdx) => {
					if (cIdx === chapterIndex && chapter?.slides && Array.isArray(chapter.slides)) {
						return {
							...chapter,
							slides: chapter.slides.filter((_, sIdx) => sIdx !== slideIndex),
						};
					}
					return chapter;
				})
				.filter((chapter) => chapter?.slides && Array.isArray(chapter.slides) && chapter.slides.length > 0); // Remove empty chapters

			// Renumber all slides
			let counter = 1;
			chapters.forEach((chapter) => {
				if (chapter?.slides && Array.isArray(chapter.slides)) {
					chapter.slides.forEach((slide) => {
						if (slide && typeof slide === 'object') {
							slide.slideNumber = counter++;
						}
					});
				}
			});

			return {
				...prev,
				outline: { ...prev.outline, slidesCount: counter - 1 },
				chapters,
			};
		});
	};

	// Handle drag start
	const handleDragStart = (event: DragStartEvent) => {
		const id = event.active.id as string;
		setActiveId(id);

		// Determine what's being dragged and get its title
		if (id.startsWith('chapter-')) {
			const chapterIndex = parseInt(id.split('-')[1]);
			const chapter = content?.chapters?.[chapterIndex];
			if (chapter) {
				setDraggedItem({
					type: 'chapter',
					title: (chapter as Chapter).chapterTitle || 'Untitled Chapter',
				});
			}
		} else if (id.startsWith('slide-')) {
			const [, chapterIdx, slideIdx] = id.split('-').map(Number);
			const slide = content?.chapters?.[chapterIdx]?.slides?.[slideIdx];
			if (slide) {
				setDraggedItem({
					type: 'slide',
					title: (slide as Slide).slideTitle || 'Untitled Slide',
				});
			}
		}

		console.log("[DnD] Drag started:", id);
	};

	// Handle drag end
	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;

		console.log("[DnD] Drag ended:", {
			active: active.id,
			over: over?.id,
			isSame: active.id === over?.id,
		});

		setActiveId(null);
		setDraggedItem(null);

		if (!over || active.id === over.id) return;

		const activeId = active.id as string;
		const overId = over.id as string;

		// Handle chapter reordering
		if (activeId.startsWith("chapter-") && overId.startsWith("chapter-")) {
			const oldIndex = parseInt(activeId.split("-")[1]);
			const newIndex = parseInt(overId.split("-")[1]);

			console.log("[DnD] Reordering chapters:", { oldIndex, newIndex });

			updateContent((prev) => {
				if (!prev || !prev.chapters || !prev.outline || !Array.isArray(prev.chapters)) return prev;

				const chapters = arrayMove([...prev.chapters], oldIndex, newIndex);

				// Renumber all slides
				let counter = 1;
				chapters.forEach((chapter) => {
					if (chapter?.slides && Array.isArray(chapter.slides)) {
						chapter.slides.forEach((slide: any) => {
							if (slide && typeof slide === 'object') {
								slide.slideNumber = counter++;
							}
						});
					}
				});

				console.log(
					"[DnD] Chapters reordered, new order:",
					chapters.map((c) => c?.chapterTitle)
				);

				return {
					...prev,
					chapters,
					outline: { ...prev.outline, slidesCount: counter - 1 },
				};
			});
		}

		// Handle slide reordering within same chapter
		if (activeId.startsWith("slide-") && overId.startsWith("slide-")) {
			const [, activeChapter, activeSlide] = activeId.split("-").map(Number);
			const [, overChapter, overSlide] = overId.split("-").map(Number);

			console.log("[DnD] Reordering slides:", {
				activeChapter,
				activeSlide,
				overChapter,
				overSlide,
			});

			if (activeChapter === overChapter) {
				// Same chapter - use arrayMove
				updateContent((prev) => {
					if (!prev || !prev.chapters || !prev.outline || !Array.isArray(prev.chapters)) return prev;

					const chapters = [...prev.chapters];
					const targetChapter = chapters[activeChapter];

					if (!targetChapter?.slides || !Array.isArray(targetChapter.slides)) return prev;

					chapters[activeChapter] = {
						...targetChapter,
						slides: arrayMove(
							[...targetChapter.slides],
							activeSlide,
							overSlide
						),
					};

					// Renumber all slides
					let counter = 1;
					chapters.forEach((chapter) => {
						if (chapter?.slides && Array.isArray(chapter.slides)) {
							chapter.slides.forEach((slide: any) => {
								if (slide && typeof slide === 'object') {
									slide.slideNumber = counter++;
								}
							});
						}
					});

					console.log(
						"[DnD] Slides reordered, new slide order:",
						chapters[activeChapter]?.slides?.map((s: any) => s?.slideTitle)
					);

					return {
						...prev,
						chapters,
						outline: { ...prev.outline, slidesCount: counter - 1 },
					};
				});
			}
		}
	};

	// Show loading state if fetching from DB
	if (isLoading && !content) {
		return (
			<Artifact className="max-w-4xl">
				<ArtifactContent className="flex items-center justify-center py-8">
					<div className="text-muted-foreground">Loading artifact...</div>
				</ArtifactContent>
			</Artifact>
		);
	}

	// Show error if no content after loading
	if (!content) {
		return (
			<Artifact className="max-w-4xl">
				<ArtifactContent className="flex items-center justify-center py-8">
					<div className="text-destructive">Failed to load artifact</div>
				</ArtifactContent>
			</Artifact>
		);
	}

	// Show streaming placeholder for partial content
	if (!isFullContent(content)) {
		return (
			<Artifact className="max-w-4xl">
				<ArtifactHeader>
					<div className="flex items-center gap-4 flex-1">
						<NotepadText className="size-4 text-muted-foreground" />
						<div className="flex flex-col flex-1">
							<div className="font-semibold text-base text-muted-foreground animate-pulse">
								{content?.outline?.pptTitle || "Generating outline..."}
							</div>
							<ArtifactDescription>
								Streaming content...
							</ArtifactDescription>
						</div>
					</div>
				</ArtifactHeader>
				<ArtifactContent className="space-y-4">
					<div className="text-sm text-muted-foreground animate-pulse">
						Receiving slides outline from AI...
					</div>
					{content?.chapters && content.chapters.length > 0 && (
						<div className="space-y-2">
							{content.chapters.map((chapter, idx) => (
								<div key={idx} className="p-2 border rounded-md">
									<div className="font-medium">
										{chapter?.chapterTitle || "Loading chapter..."}
									</div>
									{chapter?.slides && chapter.slides.length > 0 && (
										<div className="text-xs text-muted-foreground mt-1">
											{chapter.slides.length} slide{chapter.slides.length > 1 ? "s" : ""}
										</div>
									)}
								</div>
							))}
						</div>
					)}
				</ArtifactContent>
			</Artifact>
		);
	}

	return (
		<Artifact className="max-w-4xl">
			<ArtifactHeader>
				<div className="flex items-center gap-4 flex-1">
					<NotepadText className="size-4 text-muted-foreground" />
					<div className="flex flex-col flex-1">
						<Input
							value={content.outline?.pptTitle ?? ""}
							onChange={(e) => updateTitle(e.target.value)}
							className="font-semibold text-base h-auto px-0 py-0 border-0 focus-visible:ring-0 bg-transparent mb-1 w-[90%]"
						/>
						<ArtifactDescription>
							{content.outline?.slidesCount ?? 0} slide
							{(content.outline?.slidesCount ?? 0) > 1 ? "s" : ""} •{" "}
							{content.chapters?.length ?? 0} chapter
							{(content.chapters?.length ?? 0) > 1 ? "s" : ""}
						</ArtifactDescription>
					</div>
				</div>
				<ArtifactActions>
					{hasChanges && (
						<ArtifactAction
							tooltip={`Save changes${editedSlides.size > 0 ? ` (${editedSlides.size} edited)` : ""}`}
							icon={SaveIcon}
							onClick={handleSave}
							disabled={isSaving}
							className={cn(
								"text-amber-600",
								!isSaving && "animate-pulse",
								isSaving && "opacity-50"
							)}
						/>
					)}
					<ArtifactAction
						tooltip="Copy outline"
						icon={CopyIcon}
						onClick={() =>
							navigator.clipboard.writeText(JSON.stringify(content, null, 2))
						}
					/>
				</ArtifactActions>
			</ArtifactHeader>

			<ArtifactContent className="space-y-1 pl-8">
				{/* Chapters with Drag and Drop - Compact Layout */}
				<DndContext
					sensors={sensors}
					collisionDetection={customCollisionDetection}
					onDragStart={handleDragStart}
					onDragEnd={handleDragEnd}
				>
					<SortableContext
						items={(content.chapters ?? []).map((_, idx) => `chapter-${idx}`)}
						strategy={verticalListSortingStrategy}
					>
						<div className="space-y-0 w-full">
							{(content.chapters ?? []).map((chapter, chapterIndex) => (
								chapter && (
									<SortableChapter
										key={`chapter-${chapterIndex}`}
										chapter={chapter as Chapter}
										chapterIndex={chapterIndex}
										onUpdateTitle={(title) =>
											updateChapterTitle(chapterIndex, title)
										}
										onUpdateSlide={(slideIndex, updates) =>
											updateSlide(chapterIndex, slideIndex, updates)
										}
										onAddSlide={(afterIndex) =>
											addSlide(chapterIndex, afterIndex)
										}
										onDeleteSlide={(slideIndex) =>
											deleteSlide(chapterIndex, slideIndex)
										}
										editedSlides={editedSlides}
									/>
								)
							))}
						</div>
					</SortableContext>

					{/* Custom Drag Overlay - Fixed UI that doesn't distort */}
					<DragOverlay>
						{draggedItem && (
							<div className="bg-muted/90 rounded-md px-3 py-2 shadow-lg border border-border">
								<div className={cn(
									"font-medium truncate",
									draggedItem.type === 'chapter' ? "text-base" : "text-sm"
								)}>
									{draggedItem.title}
								</div>
							</div>
						)}
					</DragOverlay>
				</DndContext>

				{/* Template Selection */}
				{/* to be implemented once we can transform */}
				{/* <div className="pt-4 border-t">
					<p className="text-sm text-muted-foreground mb-3">
						Select a template to generate your presentation:
					</p>
					<div className="grid grid-cols-3 gap-2">
						{["Professional", "Modern", "Minimal"].map((template) => (
							<button
								key={template}
								className="p-3 border rounded-md hover:border-primary hover:bg-primary/5 transition-colors text-sm font-medium"
								onClick={() => {
									// TODO: Implement template selection & PPT generation
									console.log("Template selected:", template, artifactId);
								}}
							>
								{template}
							</button>
						))}
					</div>
				</div> */}

				{/* Status Bar - Shows when there are unsaved changes */}
				{hasChanges && (
					<div className="sticky bottom-0 border-t pt-4 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 px-4 text-xs text-muted-foreground flex items-center justify-between">
						<div className="flex items-center gap-2">
							<div className="size-1.5 rounded-full dark:bg-amber-500 animate-pulse" />
							<span>
								Unsaved changes
								{editedSlides.size > 0 &&
									` • ${editedSlides.size} slide${editedSlides.size > 1 ? "s" : ""} edited`}
							</span>
						</div>
						<Button
							size="sm"
							onClick={handleSave}
							disabled={isSaving}
							className="h-7 text-xs"
						>
							{isSaving ? "Saving..." : "Save"}
						</Button>
					</div>
				)}
			</ArtifactContent>
		</Artifact>
	);
}

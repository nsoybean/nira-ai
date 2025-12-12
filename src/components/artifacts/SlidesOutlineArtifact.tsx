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
	SlidesOutlineArtifactOutput,
} from "@/lib/llmTools/slidesOutline";

interface SlidesOutlineArtifactProps {
	artifactId: string;
	initialContent: SlidesOutlineArtifactOutput["content"];
	version: string;
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
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: `slide-${chapterIndex}-${slideIndex}` });

	const style: React.CSSProperties = {
		transform: CSS.Transform.toString(transform),
		transition,
		...(isDragging && {
			// Prevent text distortion during drag
			WebkitFontSmoothing: "subpixel-antialiased" as const,
			textRendering: "optimizeLegibility" as const,
		}),
	};

	return (
		<div
			ref={setNodeRef}
			style={style}
			className={cn("group relative", isDragging && "opacity-40")}
		>
			<div className="flex items-start gap-2 py-2 px-2 hover:bg-muted/90 rounded-md transition-colors">
				{/* Edited Indicator Dot */}
				{isEdited && (
					<div className="absolute -left-1 top-3 size-1.5 rounded-full bg-amber-500 animate-pulse" />
				)}

				{/* Drag Handle */}
				<div
					{...attributes}
					{...listeners}
					className="cursor-grab active:cursor-grabbing mt-1"
				>
					<GripVerticalIcon className="size-3.5 text-muted-foreground/40" />
				</div>

				{/* Slide Number - Subtle square badge */}
				<div className="shrink-0 w-5 h-5 rounded bg-accent flex items-center justify-center mt-0.5">
					<span className="text-[10px] font-medium text-muted-foreground">
						{slide.slideNumber}
					</span>
				</div>

				{/* Slide Content */}
				<div className="flex-1 min-w-0">
					{/* Slide Title */}
					<Input
						value={slide.slideTitle}
						onChange={(e) => onUpdate({ slideTitle: e.target.value })}
						className="font-medium text-sm h-auto px-1 py-0.5 border-0 focus-visible:ring-0 bg-transparent mb-1 p-2"
						placeholder="Slide title..."
					/>

					{/* Slide Content */}
					<Textarea
						maxLength={2000}
						value={slide.slideContent}
						onChange={(e) => onUpdate({ slideContent: e.target.value })}
						className="text-xs text-muted-foreground resize-none border-0 focus-visible:ring-0 bg-transparent p-1 leading-relaxed p-2"
						placeholder="Slide content..."
						rows={2}
					/>
				</div>

				{/* Actions on right - only visible on hover */}
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
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: `chapter-${chapterIndex}` });

	const style: React.CSSProperties = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.4 : 1,
		...(isDragging && {
			// Prevent text distortion during drag
			WebkitFontSmoothing: "subpixel-antialiased" as const,
			textRendering: "optimizeLegibility" as const,
		}),
	};

	const slideIds = chapter.slides.map(
		(_, idx) => `slide-${chapterIndex}-${idx}`
	);

	return (
		<div ref={setNodeRef} style={style} className="mb-3">
			{/* Chapter Header - More compact */}
			<div className="flex items-center gap-2 py-1.5 px-2 mb-1">
				<div
					{...attributes}
					{...listeners}
					className="cursor-grab active:cursor-grabbing"
				>
					<GripVerticalIcon className="size-3.5 text-muted-foreground/40" />
				</div>
				<Input
					value={chapter.chapterTitle}
					onChange={(e) => onUpdateTitle(e.target.value)}
					className="flex-1 font-semibold text-base h-auto px-1 py-0.5 border-0 focus-visible:ring-0 bg-transparent p-2"
					placeholder="Chapter title..."
				/>
			</div>

			{/* Chapter Slides - Tighter spacing */}
			<div className="pl-1">
				<SortableContext
					items={slideIds}
					strategy={verticalListSortingStrategy}
				>
					{chapter.slides.map((slide, slideIndex) => {
						const slideKey = `slide-${chapterIndex}-${slideIndex}`;
						return (
							<SortableSlide
								key={slideKey}
								slide={slide}
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
		</div>
	);
}

export function SlidesOutlineArtifact({
	artifactId,
	initialContent,
	version,
}: SlidesOutlineArtifactProps) {
	const [content, setContent] = useState(initialContent);
	const [isSaving, setIsSaving] = useState(false);
	const [hasChanges, setHasChanges] = useState(false);
	const [activeId, setActiveId] = useState<string | null>(null);
	const [editedSlides, setEditedSlides] = useState<Set<string>>(new Set());

	// Set up sensors for drag and drop
	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 8, // 8px movement required before drag starts
			},
		}),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		})
	);

	// Fetch latest version on mount (handles page refresh)
	useEffect(() => {
		async function fetchLatest() {
			try {
				if (!artifactId) {
					console.log("skipping");
					return;
				}
				const res = await fetch(`/api/artifacts/${artifactId}`);
				if (res.ok) {
					const artifact = await res.json();
					setContent(artifact.content);
				}
			} catch (error) {
				console.error("Failed to fetch latest artifact:", error);
			}
		}
		fetchLatest();
	}, [artifactId]);

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
			prev: SlidesOutlineArtifactOutput["content"]
		) => SlidesOutlineArtifactOutput["content"]
	) => {
		setContent(updater);
		setHasChanges(true);
	};

	// Update title
	const updateTitle = (newTitle: string) => {
		updateContent((prev) => ({
			...prev,
			outline: { ...prev.outline, pptTitle: newTitle },
		}));
	};

	// Update chapter title
	const updateChapterTitle = (chapterIndex: number, newTitle: string) => {
		updateContent((prev) => ({
			...prev,
			chapters: prev.chapters.map((chapter, i) =>
				i === chapterIndex ? { ...chapter, chapterTitle: newTitle } : chapter
			),
		}));
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

		updateContent((prev) => ({
			...prev,
			chapters: prev.chapters.map((chapter, cIdx) =>
				cIdx === chapterIndex
					? {
						...chapter,
						slides: chapter.slides.map((slide, sIdx) =>
							sIdx === slideIndex ? { ...slide, ...updates } : slide
						),
					}
					: chapter
			),
		}));
	};

	// Add new slide
	const addSlide = (chapterIndex: number, afterIndex?: number) => {
		updateContent((prev) => {
			const newSlideNumber = prev.outline.slidesCount + 1;
			const newSlide: Slide = {
				slideNumber: newSlideNumber,
				slideTitle: "New Slide",
				slideContent: "Enter slide content here...",
				slideType: "text",
			};

			const chapters = prev.chapters.map((chapter, cIdx) => {
				if (cIdx === chapterIndex) {
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
				chapter.slides.forEach((slide) => {
					slide.slideNumber = counter++;
				});
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
			const chapters = prev.chapters
				.map((chapter, cIdx) => {
					if (cIdx === chapterIndex) {
						return {
							...chapter,
							slides: chapter.slides.filter((_, sIdx) => sIdx !== slideIndex),
						};
					}
					return chapter;
				})
				.filter((chapter) => chapter.slides.length > 0); // Remove empty chapters

			// Renumber all slides
			let counter = 1;
			chapters.forEach((chapter) => {
				chapter.slides.forEach((slide) => {
					slide.slideNumber = counter++;
				});
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
		setActiveId(event.active.id as string);
		console.log("[DnD] Drag started:", event.active.id);
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

		if (!over || active.id === over.id) return;

		const activeId = active.id as string;
		const overId = over.id as string;

		// Handle chapter reordering
		if (activeId.startsWith("chapter-") && overId.startsWith("chapter-")) {
			const oldIndex = parseInt(activeId.split("-")[1]);
			const newIndex = parseInt(overId.split("-")[1]);

			console.log("[DnD] Reordering chapters:", { oldIndex, newIndex });

			updateContent((prev) => {
				const chapters = arrayMove([...prev.chapters], oldIndex, newIndex);

				// Renumber all slides
				let counter = 1;
				chapters.forEach((chapter) => {
					chapter.slides.forEach((slide) => {
						slide.slideNumber = counter++;
					});
				});

				console.log(
					"[DnD] Chapters reordered, new order:",
					chapters.map((c) => c.chapterTitle)
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
					const chapters = [...prev.chapters];
					chapters[activeChapter] = {
						...chapters[activeChapter],
						slides: arrayMove(
							[...chapters[activeChapter].slides],
							activeSlide,
							overSlide
						),
					};

					// Renumber all slides
					let counter = 1;
					chapters.forEach((chapter) => {
						chapter.slides.forEach((slide) => {
							slide.slideNumber = counter++;
						});
					});

					console.log(
						"[DnD] Slides reordered, new slide order:",
						chapters[activeChapter].slides.map((s) => s.slideTitle)
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

	return (
		<Artifact className="max-w-4xl">
			<ArtifactHeader>
				<div className="flex items-center gap-4 flex-1">
					<NotepadText className="size-4 text-muted-foreground" />
					<div className="flex flex-col flex-1">
						<Input
							value={content?.outline.pptTitle}
							onChange={(e) => updateTitle(e.target.value)}
							className="font-semibold text-base h-auto px-0 py-0 border-0 focus-visible:ring-0 bg-transparent mb-1 w-[90%]"
						/>
						<ArtifactDescription>
							{content?.outline.slidesCount} slide
							{content?.outline.slidesCount > 1 ? "s" : ""} •{" "}
							{content?.chapters.length} chapter
							{content?.chapters.length > 1 ? "s" : ""}
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

			<ArtifactContent className="space-y-1">
				{/* Chapters with Drag and Drop - Compact Layout */}
				<DndContext
					sensors={sensors}
					collisionDetection={closestCenter}
					onDragStart={handleDragStart}
					onDragEnd={handleDragEnd}
				>
					<SortableContext
						items={content?.chapters.map((_, idx) => `chapter-${idx}`)}
						strategy={verticalListSortingStrategy}
					>
						<div className="space-y-0">
							{content?.chapters.map((chapter, chapterIndex) => (
								<SortableChapter
									key={`chapter-${chapterIndex}`}
									chapter={chapter}
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
							))}
						</div>
					</SortableContext>
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

"use client";

import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
} from "@/components/ui/select";
import { AVAILABLE_MODELS } from "@/lib/models";
import { ModelSelectorLogo } from "../ai-elements/model-selector";

interface ModelSelectorInlineProps {
	selectedModel: string;
	onModelChange: (modelId: string) => void;
	disabled?: boolean;
}

// Icon mapping for different model providers
const getModelIcon = (provider: string) => {
	if (provider === "anthropic") {
		return <ModelSelectorLogo provider={"anthropic"} className="h-4 w-4" />;
	}
	if (provider === "openai") {
		return <ModelSelectorLogo provider={"openai"} className="h-4 w-4" />;
	}
	if (provider === "google") {
		return <ModelSelectorLogo provider={"google"} className="h-4 w-4" />;
	}
	return null;
};

export function ModelSelectorInline({
	selectedModel,
	onModelChange,
	disabled = false,
}: ModelSelectorInlineProps) {
	// Group models by provider
	const anthropicModels = AVAILABLE_MODELS.filter(
		(m) => m.provider === "anthropic"
	);
	const openaiModels = AVAILABLE_MODELS.filter((m) => m.provider === "openai");
	const googleModels = AVAILABLE_MODELS.filter((m) => m.provider === "google");

	const selectedModelConfig = AVAILABLE_MODELS.find(
		(m) => m.id === selectedModel
	);

	return (
		<Select
			value={selectedModel}
			onValueChange={onModelChange}
			disabled={disabled}
		>
			<SelectTrigger className="h-8 w-auto border-0 bg-transparent hover:bg-accent text-muted-foreground text-xs gap-1.5 px-2 focus:ring-0 focus:ring-offset-0 shadow-none">
				<div className="flex items-center gap-1.5">
					{selectedModelConfig && getModelIcon(selectedModelConfig.provider)}
					<span className="font-medium">
						{selectedModelConfig?.name || "Select Model"}
					</span>
				</div>
			</SelectTrigger>

			<SelectContent align="start" className="min-w-sm">
				<SelectGroup>
					<SelectLabel className="text-xs font-semibold text-muted-foreground px-2 py-1.5">
						Anthropic
					</SelectLabel>
					{anthropicModels.map((model) => (
						<SelectItem key={model.id} value={model.id} className="text-xs">
							<div className="flex items-center gap-2">
								{getModelIcon(model.provider)}
								<div className="flex flex-col">
									<span className="font-medium">{model.name}</span>
									{/* <span className="text-[10px] text-muted-foreground">
                    {model.description}
                  </span> */}
								</div>
							</div>
						</SelectItem>
					))}
				</SelectGroup>

				<SelectGroup>
					<SelectLabel className="text-xs font-semibold text-muted-foreground px-2 py-1.5 mt-1">
						OpenAI
					</SelectLabel>
					{openaiModels.map((model) => (
						<SelectItem key={model.id} value={model.id} className="text-xs">
							<div className="flex items-center gap-2">
								{getModelIcon(model.provider)}
								<div className="flex flex-col">
									<span className="font-medium">{model.name}</span>
									{/* <span className="text-[10px] text-muted-foreground">
                    {model.description}
                  </span> */}
								</div>
							</div>
						</SelectItem>
					))}
				</SelectGroup>

				<SelectGroup>
					<SelectLabel className="text-xs font-semibold text-muted-foreground px-2 py-1.5 mt-1">
						Google
					</SelectLabel>
					{googleModels.map((model) => (
						<SelectItem key={model.id} value={model.id} className="text-xs">
							<div className="flex items-center gap-2">
								{getModelIcon(model.provider)}
								<div className="flex flex-col">
									<span className="font-medium">{model.name}</span>
									{/* <span className="text-[10px] text-muted-foreground">
                    {model.description}
                  </span> */}
								</div>
							</div>
						</SelectItem>
					))}
				</SelectGroup>
			</SelectContent>
		</Select>
	);
}

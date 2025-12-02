"use client";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AVAILABLE_MODELS } from "@/lib/models";
import { Sparkles, Zap, Brain } from "lucide-react";

interface ModelSelectorInlineProps {
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  disabled?: boolean;
}

// Icon mapping for different model characteristics
const getModelIcon = (modelId: string) => {
  if (modelId.includes("3-7") || modelId.includes("o1")) {
    return <Brain className="h-3.5 w-3.5" />;
  }
  if (modelId.includes("haiku") || modelId.includes("mini")) {
    return <Zap className="h-3.5 w-3.5" />;
  }
  return <Sparkles className="h-3.5 w-3.5" />;
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

  const selectedModelConfig = AVAILABLE_MODELS.find(
    (m) => m.id === selectedModel
  );

  return (
    <Select
      value={selectedModel}
      onValueChange={onModelChange}
      disabled={disabled}
    >
      <SelectTrigger className="h-8 w-auto border-0 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs gap-1.5 px-2 focus:ring-0 focus:ring-offset-0">
        <div className="flex items-center gap-1.5">
          {/* {selectedModelConfig && getModelIcon(selectedModelConfig.id)} */}
          <span className="font-medium">
            {selectedModelConfig?.name || "Select Model"}
          </span>
        </div>
      </SelectTrigger>
      <SelectContent align="start">
        <SelectGroup>
          <SelectLabel className="text-xs font-semibold text-muted-foreground px-2 py-1.5">
            Anthropic
          </SelectLabel>
          {anthropicModels.map((model) => (
            <SelectItem key={model.id} value={model.id} className="text-xs">
              <div className="flex items-center gap-2">
                {/* {getModelIcon(model.id)} */}
                <div className="flex flex-col">
                  <span className="font-medium">{model.name}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {model.description}
                  </span>
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
                {/* {getModelIcon(model.id)} */}
                <div className="flex flex-col">
                  <span className="font-medium">{model.name}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {model.description}
                  </span>
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

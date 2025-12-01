"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AVAILABLE_MODELS, ModelProvider } from "@/lib/models";
import { Sparkles, Zap, Brain } from "lucide-react";

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  disabled?: boolean;
}

// Icon mapping for different model characteristics
const getModelIcon = (modelId: string) => {
  if (modelId.includes("3-7") || modelId.includes("o1")) {
    return <Brain className="h-4 w-4 mr-2" />;
  }
  if (modelId.includes("haiku") || modelId.includes("mini")) {
    return <Zap className="h-4 w-4 mr-2" />;
  }
  return <Sparkles className="h-4 w-4 mr-2" />;
};

export function ModelSelector({
  selectedModel,
  onModelChange,
  disabled = false,
}: ModelSelectorProps) {
  // Group models by provider
  const anthropicModels = AVAILABLE_MODELS.filter(
    (m) => m.provider === "anthropic"
  );
  const openaiModels = AVAILABLE_MODELS.filter((m) => m.provider === "openai");

  const selectedModelConfig = AVAILABLE_MODELS.find(
    (m) => m.id === selectedModel
  );

  return (
    <Select value={selectedModel} onValueChange={onModelChange} disabled={disabled}>
      <SelectTrigger className="w-[280px] bg-background">
        <div className="flex items-center">
          {selectedModelConfig && getModelIcon(selectedModelConfig.id)}
          <SelectValue placeholder="Select a model" />
        </div>
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel className="text-xs font-semibold text-muted-foreground">
            Anthropic
          </SelectLabel>
          {anthropicModels.map((model) => (
            <SelectItem key={model.id} value={model.id}>
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center">
                  {getModelIcon(model.id)}
                  <div className="flex flex-col">
                    <span className="font-medium">{model.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {model.description}
                    </span>
                  </div>
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectGroup>

        <SelectGroup>
          <SelectLabel className="text-xs font-semibold text-muted-foreground mt-2">
            OpenAI
          </SelectLabel>
          {openaiModels.map((model) => (
            <SelectItem key={model.id} value={model.id}>
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center">
                  {getModelIcon(model.id)}
                  <div className="flex flex-col">
                    <span className="font-medium">{model.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {model.description}
                    </span>
                  </div>
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

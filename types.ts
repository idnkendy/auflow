export enum Tool {
  FloorPlan = 'FloorPlan',
  Renovation = 'Renovation',
  ArchitecturalRendering = 'ArchitecturalRendering',
  InteriorRendering = 'InteriorRendering',
  UrbanPlanning = 'UrbanPlanning',
  LandscapeRendering = 'LandscapeRendering',
  ViewSync = 'ViewSync',
  VirtualTour = 'VirtualTour',
  PromptSuggester = 'PromptSuggester',
  PromptEnhancer = 'PromptEnhancer',
  MaterialSwap = 'MaterialSwap',
  VideoGeneration = 'VideoGeneration',
  ImageEditing = 'ImageEditing',
  Upscale = 'Upscale',
  Moodboard = 'Moodboard',
  History = 'History',
  Staging = 'Staging',
  AITechnicalDrawings = 'AITechnicalDrawings',
  SketchConverter = 'SketchConverter',
  LuBanRuler = 'LuBanRuler',
  FengShui = 'FengShui',
}

export type AspectRatio = "1:1" | "3:4" | "4:3" | "9:16" | "16:9";

export interface FileData {
  base64: string;
  mimeType: string;
  objectURL: string;
}

export interface HistoryItem {
  id: string;
  tool: Tool;
  prompt: string;
  sourceImageURL?: string;
  resultImageURL?: string;
  resultVideoURL?: string;
  timestamp: number;
}
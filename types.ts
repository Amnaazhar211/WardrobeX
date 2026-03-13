
export interface User {
  id: string;
  email: string;
  name: string;
}

export interface ClothingItem {
  id: string;
  name: string;
  category: string;
  imageUrl: string;
  price: string;
}

export interface TryOnResult {
  id: string;
  originalImage: string;
  clothingImage: string;
  resultImage: string;
  timestamp: number;
}

export interface AIRecommendation {
  colorSuggestions: string[];
  fitTips: string[];
  similarStyles: string[];
  occasionTips: string;
}

export type ViewState = 'HOME' | 'STUDIO' | 'WARDROBE' | 'FAVORITES' | 'PICKS' | 'PROFILE' | 'AUTH';

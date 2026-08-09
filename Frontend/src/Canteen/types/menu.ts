export interface MenuVariant {
  id: string;
  name: string;
  price: number;
}

export interface AddonOption {
  id: string;
  name: string;
  price: number;
}

export interface AddonGroup {
  id: string;
  name: string;
  required: boolean;
  minSelection: number;
  maxSelection: number;
  options: AddonOption[];
}


export interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  subCategory?: string;
  image?: string;
  isVegetarian?: boolean;
  available?: boolean;
  isAvailable?: boolean;
  rating?: number;
  reviews?: number;
  isRecommended?: boolean;
  preparationTime?: number;
  
  // Advanced Features
  displayOrder?: number;
  availableFrom?: string; // HH:mm
  availableTo?: string; // HH:mm
  
  hasVariants?: boolean;
  variants?: MenuVariant[];
  
  hasAddons?: boolean;
  addonGroups?: AddonGroup[]; // Defined broadly for now
  tags?: string[];
  isHidden?: boolean;
}

export interface MenuCategory {
  id: string;
  name: string;
  description?: string;
  itemCount: number;
  isActive: boolean;
  isAvailable?: boolean;
}

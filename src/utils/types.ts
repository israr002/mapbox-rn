import type { FeatureCollection, Polygon, Point } from 'geojson';

export interface PolygonFeature {
  type: 'Feature';
  properties: {
    name: string;
    created: string;
    id: string;
    type: 'farm' | 'paddock';
    parentId?: string; // For paddocks, this is the farm boundary ID
    purpose?: string;
    capacity?: number;
    notes?: string;
  };
  geometry: Polygon;
}

export interface DrawingPoint {
  coordinates: number[];
  id: string;
}

export interface PaddockInfo {
  name: string;
  purpose: string;
  capacity: string;
  notes: string;
}

// Livestock types
export interface LivestockData {
  paddockId: string;
  count: number;
  type: LivestockType;
  status: LivestockStatus;
  lastUpdated: string;
}

export type LivestockType = 'cattle' | 'sheep' | 'goats' | 'horses' | 'other';
export type LivestockStatus = 'healthy' | 'attention' | 'quarantine' | 'breeding' | 'medication';

export interface LivestockAnnotation {
  id: string;
  paddockId: string;
  coordinates: number[]; // Centroid of the paddock
  count: number;
  type: LivestockType;
  status: LivestockStatus;
}

export type DrawingMode = 'farm' | 'paddock';
export type AppState = 'initial' | 'drawing-farm' | 'farm-completed' | 'paddock-mode' | 'drawing-paddock' | 'livestock-mode' | 'heatmap-mode' | 'editing';
export type BottomMenuMode = 'paddock' | 'livestock' | 'heatmap';

export type PolygonCollection = FeatureCollection<Polygon>;
export type PointCollection = FeatureCollection<Point>; 
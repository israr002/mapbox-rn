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

export type DrawingMode = 'farm' | 'paddock';
export type AppState = 'initial' | 'drawing-farm' | 'farm-completed' | 'editing' | 'drawing-paddock';

export type PolygonCollection = FeatureCollection<Polygon>;
export type PointCollection = FeatureCollection<Point>; 
import { PolygonFeature, PolygonCollection } from './types';

// Check if point is inside polygon using ray casting algorithm
export const isPointInPolygon = (point: number[], polygon: number[][]): boolean => {
  const [x, y] = point;
  let inside = false;
  
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    
    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  
  return inside;
};

// Check if paddock is within farm boundary
export const isPaddockWithinFarm = (paddockCoords: number[][], farmCoords: number[][]): boolean => {
  // Check if all paddock vertices are within farm boundary
  for (const coord of paddockCoords) {
    if (!isPointInPolygon(coord, farmCoords)) {
      return false;
    }
  }
  return true;
};

// Get farm boundaries only from polygon collection
export const getFarmBoundaries = (polygons: PolygonCollection): PolygonFeature[] => {
  return polygons.features.filter(feature => 
    feature.properties && feature.properties.type === 'farm'
  ) as PolygonFeature[];
};

// Get paddocks for a specific farm
export const getPaddocksForFarm = (polygons: PolygonCollection, farmId: string): PolygonFeature[] => {
  return polygons.features.filter(feature => 
    feature.properties && 
    feature.properties.type === 'paddock' && 
    feature.properties.parentId === farmId
  ) as PolygonFeature[];
};

// Get selected polygon vertices (excluding closing point)
export const getPolygonVertices = (polygons: PolygonCollection, polygonId: string): number[][] => {
  const selectedPolygon = polygons.features.find(
    feature => feature.properties && feature.properties.id === polygonId
  );
  
  if (selectedPolygon) {
    const coords = selectedPolygon.geometry.coordinates[0];
    return coords.slice(0, -1); // Remove the closing point
  }
  
  return [];
};

// Create a closed polygon by adding first point at the end
export const createClosedPolygon = (coordinates: number[][]): number[][] => {
  return [...coordinates, coordinates[0]];
};

/**
 * Extract initials from a paddock name for map display
 * Example: "East Paddock" -> "E P", "North East Field" -> "N E F"
 */
export const getNameInitials = (name: string): string => {
  if (!name || name.trim() === '') {
    return '';
  }
  
  return name
    .trim()
    .split(/\s+/) // Split by any whitespace
    .map(word => word.charAt(0).toUpperCase()) // Get first letter and make uppercase
    .filter(letter => letter.match(/[A-Z]/)) // Only keep letters (filter out numbers/symbols)
    .join(' '); // Join with spaces
};

/**
 * Add initials property to polygon features for map display
 */
export const addInitialsToPolygons = (polygons: PolygonCollection): PolygonCollection => {
  return {
    ...polygons,
    features: polygons.features.map(feature => {
      if (feature.properties?.type === 'paddock' && feature.properties?.name) {
        return {
          ...feature,
          properties: {
            ...feature.properties,
            initials: getNameInitials(feature.properties.name)
          }
        };
      }
      return feature;
    })
  };
};

/**
 * Calculate the centroid of a polygon for positioning annotations
 */
export const getPolygonCentroid = (coordinates: number[][]): number[] => {
  if (coordinates.length === 0) return [0, 0];
  
  let sumX = 0;
  let sumY = 0;
  let count = 0;
  
  // Calculate average of all coordinates (simple centroid)
  coordinates.forEach(coord => {
    if (coord.length >= 2) {
      sumX += coord[0];
      sumY += coord[1];
      count++;
    }
  });
  
  if (count === 0) return [0, 0];
  
  return [sumX / count, sumY / count];
};

/**
 * Generate mock livestock data for paddocks
 */
export const generateMockLivestockData = (polygons: PolygonCollection): import('./types').LivestockData[] => {
  const livestockTypes: import('./types').LivestockType[] = ['cattle', 'sheep']; // Only cattle and sheep
  const livestockStatuses: import('./types').LivestockStatus[] = ['healthy', 'attention', 'breeding', 'medication'];
  
  return polygons.features
    .filter(feature => feature.properties?.type === 'paddock')
    .map(feature => {
      const randomCount = Math.floor(Math.random() * 600) + 20; // 20-620 animals
      const randomType = livestockTypes[Math.floor(Math.random() * livestockTypes.length)];
      const randomStatus = livestockStatuses[Math.floor(Math.random() * livestockStatuses.length)];
      
      return {
        paddockId: feature.properties!.id,
        count: randomCount,
        type: randomType,
        status: randomStatus,
        lastUpdated: new Date().toISOString()
      };
    });
};

/**
 * Create livestock annotations from paddock polygons and livestock data
 */
export const createLivestockAnnotations = (
  polygons: PolygonCollection, 
  livestockData: import('./types').LivestockData[]
): import('./types').LivestockAnnotation[] => {
  const livestockMap = new Map(livestockData.map(data => [data.paddockId, data]));
  
  return polygons.features
    .filter(feature => feature.properties?.type === 'paddock')
    .map(feature => {
      const paddockId = feature.properties!.id;
      const livestock = livestockMap.get(paddockId);
      const centroid = getPolygonCentroid(feature.geometry.coordinates[0]);
      
      if (livestock) {
        return {
          id: `livestock_${paddockId}`,
          paddockId,
          coordinates: centroid,
          count: livestock.count,
          type: livestock.type,
          status: livestock.status
        };
      }
      
      // Default if no livestock data
      return {
        id: `livestock_${paddockId}`,
        paddockId,
        coordinates: centroid,
        count: 0,
        type: 'cattle' as import('./types').LivestockType,
        status: 'healthy' as import('./types').LivestockStatus
      };
    });
}; 
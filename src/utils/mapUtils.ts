import { PolygonFeature, PolygonCollection, PointCollection } from './types';

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

/**
 * Generate livestock density heatmap data based on paddock livestock data
 */
export const generateHeatmapData = (polygons: PolygonCollection, livestockData: import('./types').LivestockData[]): import('./types').HeatmapDataPoint[] => {
  const farmBoundaries = getFarmBoundaries(polygons);
  const paddocks = polygons.features.filter(f => f.properties?.type === 'paddock');
  
  if (farmBoundaries.length === 0 || paddocks.length === 0) return [];

  const heatmapPoints: import('./types').HeatmapDataPoint[] = [];
  
  // Create livestock map for quick lookup
  const livestockMap = new Map(livestockData.map(data => [data.paddockId, data]));
  
  // Get farm boundary coordinates
  const farmBoundary = farmBoundaries[0];
  const farmCoords = farmBoundary.geometry.coordinates[0];
  
  // Calculate bounding box of farm
  const lons = farmCoords.map(coord => coord[0]);
  const lats = farmCoords.map(coord => coord[1]);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  
  // Generate grid of points within farm boundary
  const gridSize = 25; // Dense grid for smooth heatmap
  const lonStep = (maxLon - minLon) / gridSize;
  const latStep = (maxLat - minLat) / gridSize;
  
  for (let i = 0; i <= gridSize; i++) {
    for (let j = 0; j <= gridSize; j++) {
      const lon = minLon + (i * lonStep);
      const lat = minLat + (j * latStep);
      
      // Check if point is within farm boundary
      if (isPointInPolygon([lon, lat], farmCoords)) {
        let livestockDensity = 0;
        let totalInfluence = 0;
        
        // Calculate livestock density based on nearby paddocks
        for (const paddock of paddocks) {
          const paddockCoords = paddock.geometry.coordinates[0];
          const paddockCentroid = getPolygonCentroid(paddockCoords);
          const livestock = livestockMap.get(paddock.properties!.id);
          
          if (livestock && livestock.count > 0) {
            // Calculate distance from point to paddock centroid
            const distance = Math.sqrt(
              Math.pow(lon - paddockCentroid[0], 2) + Math.pow(lat - paddockCentroid[1], 2)
            );
            
            // Check if point is within this paddock
            const isInPaddock = isPointInPolygon([lon, lat], paddockCoords);
            
            if (isInPaddock) {
              // High density within the paddock based on livestock count
              const paddockDensity = Math.min(100, livestock.count / 10); // Scale: 10 cattle = 100% density
              
              // Add variation within paddock (areas near water/feed are higher density)
              const centerDistance = Math.sqrt(
                Math.pow(lon - paddockCentroid[0], 2) + Math.pow(lat - paddockCentroid[1], 2)
              );
              
              // Cattle prefer areas closer to center (water/shelter)
              const centerInfluence = Math.exp(-centerDistance * 500000); // Scale for coordinate system
              const variation = 30 * Math.sin(i * 0.3) * Math.cos(j * 0.4); // Natural movement patterns
              
              livestockDensity = paddockDensity * (0.7 + 0.3 * centerInfluence) + variation;
              totalInfluence = 1;
              break; // Point is in this paddock, no need to check others
            } else {
              // Influence from nearby paddocks (cattle may graze near borders)
              const influence = Math.exp(-distance * 800000); // Nearby influence
              if (influence > 0.01) {
                const paddockDensity = Math.min(100, livestock.count / 10);
                livestockDensity += paddockDensity * influence * 0.3; // Reduced influence outside paddock
                totalInfluence += influence;
              }
            }
          }
        }
        
        // Normalize and add some natural variation
        if (totalInfluence > 0) {
          livestockDensity = livestockDensity / totalInfluence;
          
          // Add natural grazing patterns
          const grazingPattern = 15 * Math.sin(i * 0.6 + j * 0.3) * Math.cos(i * 0.4);
          livestockDensity += grazingPattern;
          
          // Clamp to realistic range
          livestockDensity = Math.max(0, Math.min(100, livestockDensity));
          
          heatmapPoints.push({
            id: `heatmap_${i}_${j}`,
            coordinates: [lon, lat],
            value: Math.round(livestockDensity),
            type: 'livestock-density'
          });
        } else {
          // Areas with no livestock influence (very low density)
          heatmapPoints.push({
            id: `heatmap_${i}_${j}`,
            coordinates: [lon, lat],
            value: Math.round(Math.random() * 5), // Very low random values
            type: 'livestock-density'
          });
        }
      }
    }
  }
  
  return heatmapPoints;
};

/**
 * Create GeoJSON for heatmap visualization
 */
export const createHeatmapGeoJSON = (heatmapData: import('./types').HeatmapDataPoint[]): PointCollection => {
  return {
    type: 'FeatureCollection',
    features: heatmapData.map(point => ({
      type: 'Feature',
      properties: {
        id: point.id,
        value: point.value,
        type: point.type,
        // Normalize value to 0-1 for heatmap intensity
        intensity: point.value / 100
      },
      geometry: {
        type: 'Point',
        coordinates: point.coordinates
      }
    }))
  };
}; 
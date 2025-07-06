

import React, { useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
} from 'react-native';
import MapboxGL, { MapView, ShapeSource, FillLayer, LineLayer, PointAnnotation, CircleLayer } from '@rnmapbox/maps';
import type { FeatureCollection, Polygon, Point } from 'geojson';
import Config from 'react-native-config';

MapboxGL.setAccessToken(Config.MAPBOX_ACCESS_TOKEN || "");

interface PolygonFeature {
  type: 'Feature';
  properties: {
    name: string;
    created: string;
    id: string;
  };
  geometry: Polygon;
}

interface DrawingPoint {
  coordinates: number[];
  id: string;
}

function App(): React.JSX.Element {
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedPolygonId, setSelectedPolygonId] = useState<string | null>(null);
  const [currentPolygon, setCurrentPolygon] = useState<DrawingPoint[]>([]);
  const [completedPolygons, setCompletedPolygons] = useState<FeatureCollection<Polygon>>({
    type: 'FeatureCollection',
    features: []
  });

  const startDrawing = () => {
    setIsDrawing(true);
    setIsEditMode(false);
    setSelectedPolygonId(null);
    setCurrentPolygon([]);
    Alert.alert(
      'Drawing Mode',
      'Tap on the map to add points for your farm boundary. Tap "Complete Polygon" when finished.',
      [{ text: 'OK' }]
    );
  };

  const enterEditMode = () => {
    setIsEditMode(true);
    setIsDrawing(false);
    setCurrentPolygon([]);
    Alert.alert(
      'Edit Mode',
      'Tap on a polygon to select it, then drag the red corner points to resize.',
      [{ text: 'OK' }]
    );
  };

  const exitEditMode = () => {
    setIsEditMode(false);
    setSelectedPolygonId(null);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    setCurrentPolygon([]);
  };

  const completePolygon = () => {
    if (currentPolygon.length < 3) {
      Alert.alert('Error', 'A polygon needs at least 3 points. Please add more points.');
      return;
    }

    // Convert DrawingPoint[] back to number[][]
    const polygonCoords = currentPolygon.map(point => point.coordinates);
    // Close the polygon by adding the first point at the end
    const closedPolygon = [...polygonCoords, polygonCoords[0]];
    
    const newPolygon: Polygon = {
      type: 'Polygon',
      coordinates: [closedPolygon]
    };

    const polygonId = `farm_${Date.now()}`;
    const newFeature: PolygonFeature = {
      type: 'Feature',
      properties: {
        name: `Farm Area ${completedPolygons.features.length + 1}`,
        created: new Date().toISOString(),
        id: polygonId,
      },
      geometry: newPolygon
    };

    setCompletedPolygons(prev => ({
      ...prev,
      features: [...prev.features, newFeature]
    }));

    setIsDrawing(false);
    setCurrentPolygon([]);
    
    Alert.alert(
      'Success!',
      `Farm boundary created with ${currentPolygon.length} points.`,
      [{ text: 'OK' }]
    );
  };

  const clearAllPolygons = () => {
    Alert.alert(
      'Clear All',
      'Are you sure you want to clear all farm boundaries?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          style: 'destructive',
          onPress: () => {
            setCompletedPolygons({ type: 'FeatureCollection', features: [] });
            setCurrentPolygon([]);
            setIsDrawing(false);
            setIsEditMode(false);
            setSelectedPolygonId(null);
          }
        }
      ]
    );
  };

  const onMapPress = (event: any) => {
    // Check if event has the expected structure
    if (!event || !event.geometry || !event.geometry.coordinates) {
      return;
    }
    
    const { geometry } = event;
    const [longitude, latitude] = geometry.coordinates;
    
    if (isDrawing) {
      const newPoint: DrawingPoint = {
        coordinates: [longitude, latitude],
        id: `point_${Date.now()}_${Math.random()}`
      };
      
      // Update the polygon with the new point
      setCurrentPolygon(prev => [...prev, newPoint]);
      
    } else if (isEditMode) {
      // Check if user tapped on a polygon
      const tappedPolygon = completedPolygons.features.find(feature => {
        // Simple point-in-polygon check
        const coords = feature.geometry.coordinates[0];
        return isPointInPolygon([longitude, latitude], coords);
      });
      
      if (tappedPolygon && tappedPolygon.properties) {
        setSelectedPolygonId(tappedPolygon.properties.id);
      } else {
        setSelectedPolygonId(null);
      }
    }
  };

  const onVertexDrag = (vertexIndex: number, newCoordinate: number[]) => {
    if (!selectedPolygonId) return;

    setCompletedPolygons(prev => ({
      ...prev,
      features: prev.features.map(feature => {
        if (feature.properties && feature.properties.id === selectedPolygonId) {
          const newCoords = [...feature.geometry.coordinates[0]];
          newCoords[vertexIndex] = newCoordinate;
          newCoords[newCoords.length - 1] = newCoords[0]; // Update closing point
          
          return {
            ...feature,
            geometry: {
              ...feature.geometry,
              coordinates: [newCoords]
            }
          };
        }
        return feature;
      })
    }));
  };

  const onDrawingPointDrag = (pointId: string, newCoordinate: number[]) => {
    setCurrentPolygon(prev => 
      prev.map(point => 
        point.id === pointId 
          ? { ...point, coordinates: newCoordinate }
          : point
      )
    );
  };

  
  const isPointInPolygon = (point: number[], polygon: number[][]): boolean => {
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

  // Get selected polygon coordinates for vertex handles
  const getSelectedPolygonVertices = () => {
    if (!selectedPolygonId) return [];
    
    const selectedPolygon = completedPolygons.features.find(
      feature => feature.properties && feature.properties.id === selectedPolygonId
    );
    
    if (selectedPolygon) {
      const coords = selectedPolygon.geometry.coordinates[0];
      return coords.slice(0, -1); // Remove the closing point
    }
    
    return [];
  };

  const currentDrawingPoints: FeatureCollection<Point> = {
    type: 'FeatureCollection',
    features: currentPolygon.map((point, index) => ({
      type: 'Feature',
      properties: { 
        index,
        pointId: point.id 
      },
      geometry: {
        type: 'Point',
        coordinates: point.coordinates
      }
    }))
  };

  const currentDrawingPolygon: FeatureCollection<Polygon> = {
    type: 'FeatureCollection',
    features: currentPolygon.length > 0 ? [{
      type: 'Feature',
      properties: { isDrawing: true },
      geometry: {
        type: 'Polygon',
        coordinates: [currentPolygon.length > 2 
          ? [...currentPolygon.map(p => p.coordinates), currentPolygon[0].coordinates] 
          : currentPolygon.map(p => p.coordinates)
        ]
      }
    }] : []
  };

  const selectedPolygonVertices = getSelectedPolygonVertices();

  return (
    <SafeAreaView style={styles.container}>
      {/* Control Panel */}
      <View style={styles.controlPanel}>
        <Text style={styles.title}>Farm Boundary Tool</Text>
        <View style={styles.buttonContainer}>
          {!isDrawing && !isEditMode ? (
            <>
              <TouchableOpacity style={styles.startButton} onPress={startDrawing}>
                <Text style={styles.buttonText}>Draw New</Text>
              </TouchableOpacity>
              {completedPolygons.features.length > 0 && (
                <>
                  <TouchableOpacity style={styles.editButton} onPress={enterEditMode}>
                    <Text style={styles.buttonText}>Edit/Resize</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.clearButton} onPress={clearAllPolygons}>
                    <Text style={styles.buttonText}>Clear All</Text>
                  </TouchableOpacity>
                </>
              )}
            </>
          ) : isDrawing ? (
            <>
              <TouchableOpacity style={styles.completeButton} onPress={completePolygon}>
                <Text style={styles.buttonText}>Complete Polygon</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={stopDrawing}>
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity style={styles.doneButton} onPress={exitEditMode}>
                <Text style={styles.buttonText}>Done Editing</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={exitEditMode}>
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
        {isDrawing && (
          <Text style={styles.instructions}>
            Points added: {currentPolygon.length} | Tap map to add points | Long press handles to adjust
          </Text>
        )}
        {isEditMode && (
          <Text style={styles.instructions}>
            {selectedPolygonId 
              ? 'Drag the red corner points to resize the polygon' 
              : 'Tap on a polygon to select it'}
          </Text>
        )}
        {completedPolygons.features.length > 0 && (
          <Text style={styles.info}>
            Farm boundaries: {completedPolygons.features.length}
            {selectedPolygonId && (() => {
              const selectedFeature = completedPolygons.features.find(f => f.properties && f.properties.id === selectedPolygonId);
              return selectedFeature && selectedFeature.properties ? ` | Selected: ${selectedFeature.properties.name}` : '';
            })()}
          </Text>
        )}
      </View>

      {/* Map Container */}
      <View style={styles.mapContainer}>
        <MapView 
          style={styles.map}
          styleURL="mapbox://styles/mapbox/satellite-v9"
          onPress={onMapPress}
        >
          <MapboxGL.Camera
            zoomLevel={13}
            centerCoordinate={[-99.9018, 41.4993]} 
          />

          {/* Completed Polygons */}
          {completedPolygons.features.length > 0 && (
            <ShapeSource id="completedPolygons" shape={completedPolygons}>
              <FillLayer
                id="completedPolygonsFill"
                style={{
                  fillColor: [
                    'case',
                    ['==', ['get', 'id'], selectedPolygonId || ''],
                    '#2196F3',
                    '#4CAF50'
                  ],
                  fillOpacity: 0.3
                }}
              />
              <LineLayer
                id="completedPolygonsLine"
                style={{
                  lineColor: [
                    'case',
                    ['==', ['get', 'id'], selectedPolygonId || ''],
                    '#2196F3',
                    '#4CAF50'
                  ],
                  lineWidth: [
                    'case',
                    ['==', ['get', 'id'], selectedPolygonId || ''],
                    4,
                    3
                  ],
                  lineOpacity: 0.8
                }}
              />
            </ShapeSource>
          )}

          {/* Current Drawing Points - Using ShapeSource for immediate rendering */}
          {currentDrawingPoints.features.length > 0 && (
            <ShapeSource id="currentDrawingPoints" shape={currentDrawingPoints}>
              <CircleLayer
                id="currentDrawingPointsLayer"
                style={{
                  circleRadius: 9,
                  circleColor: '#FF9800',
                  circleStrokeColor: '#ffffff',
                  circleStrokeWidth: 2
                }}
              />
            </ShapeSource>
          )}

          {/* Draggable Vertex Points for Selected Polygon (Edit Mode) */}
          {selectedPolygonVertices.map((coordinate, index) => (
            <PointAnnotation
              key={`vertex-${selectedPolygonId}-${index}`}
              id={`vertex-${selectedPolygonId}-${index}`}
              coordinate={coordinate}
              draggable={true}
              onDragEnd={(feature) => {
                const newCoordinate = feature.geometry.coordinates;
                onVertexDrag(index, newCoordinate);
              }}
            >
              <View style={styles.vertexHandle}>
                <View style={styles.vertexHandleInner} />
              </View>
            </PointAnnotation>
          ))}

          {/* Draggable Points for Current Drawing (when in drawing mode) */}
          {isDrawing && currentPolygon.map((point) => (
            <PointAnnotation
              key={point.id}
              id={point.id}
              coordinate={point.coordinates}
              draggable={true}
              onDragEnd={(feature) => {
                const newCoordinate = feature.geometry.coordinates;
                onDrawingPointDrag(point.id, newCoordinate);
              }}
            >
              <View style={styles.drawingPointDragHandle}>
                <View style={styles.drawingPointDragInner} />
              </View>
            </PointAnnotation>
          ))}

          {/* Current Drawing Polygon */}
          {currentDrawingPolygon.features.length > 0 && (
            <ShapeSource id="currentDrawing" shape={currentDrawingPolygon}>
              <FillLayer
                id="currentDrawingFill"
                style={{
                  fillColor: '#FF9800',
                  fillOpacity: 0.2
                }}
              />
              <LineLayer
                id="currentDrawingLine"
                style={{
                  lineColor: '#FF9800',
                  lineWidth: 2,
                  lineOpacity: 0.9,
                  lineDasharray: [2, 2]
                }}
              />
            </ShapeSource>
          )}
        </MapView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  controlPanel: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  startButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  editButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  completeButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  doneButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  cancelButton: {
    backgroundColor: '#f44336',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  clearButton: {
    backgroundColor: '#FF5722',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  instructions: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  info: {
    fontSize: 12,
    color: '#888',
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  vertexHandle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FF5722',
    borderWidth: 2,
    borderColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  vertexHandleInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffffff',
  },
  drawingPointDragHandle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 152, 0, 0.8)',
    borderWidth: 1,
    borderColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  drawingPointDragInner: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ffffff',
  },
});

export default App;


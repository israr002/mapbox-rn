import React, { useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  Alert,
  Vibration,
  Platform,
} from 'react-native';
import MapboxGL, { MapView, ShapeSource, FillLayer, LineLayer, PointAnnotation, CircleLayer, SymbolLayer } from '@rnmapbox/maps';
import Config from 'react-native-config';

import { ControlPanel, PaddockInfoModal } from '../components';
import { 
  AppState, 
  DrawingMode, 
  DrawingPoint, 
  PolygonCollection, 
  PointCollection, 
  PaddockInfo, 
  PolygonFeature,
  isPointInPolygon, 
  isPaddockWithinFarm, 
  getFarmBoundaries, 
  getPaddocksForFarm, 
  getPolygonVertices, 
  createClosedPolygon 
} from '../utils';
import { MAP_CONFIG, COLORS } from '../constants';
import type { Polygon } from 'geojson';

MapboxGL.setAccessToken(Config.MAPBOX_ACCESS_TOKEN || "");

// Haptic feedback for point selection only
const HapticFeedback = {
  pointSelected: () => {
    if (Platform.OS === 'ios') {
      Vibration.vibrate([30, 30, 30]);
    } else {
      Vibration.vibrate([30, 30, 30]);
    }
  }
};

const HomeScreen: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('initial');
  const [isEditMode, setIsEditMode] = useState(false);
  const [drawingMode, setDrawingMode] = useState<DrawingMode>('farm');
  const [selectedPolygonId, setSelectedPolygonId] = useState<string | null>(null);
  const [selectedFarmId, setSelectedFarmId] = useState<string | null>(null);
  const [currentPolygon, setCurrentPolygon] = useState<DrawingPoint[]>([]);
  const [completedPolygons, setCompletedPolygons] = useState<PolygonCollection>({
    type: 'FeatureCollection',
    features: []
  });

  // Paddock info modal states
  const [showPaddockModal, setShowPaddockModal] = useState(false);
  const [paddockInfo, setPaddockInfo] = useState<PaddockInfo>({
    name: '',
    purpose: 'Grazing',
    capacity: '',
    notes: ''
  });

  const startDrawingFarm = () => {
    setAppState('drawing-farm');
    setDrawingMode('farm');
    setSelectedPolygonId(null);
    setCurrentPolygon([]);
    Alert.alert(
      'Draw Farm Boundary',
      'Tap on the map to add points for your farm boundary.',
      [{ text: 'OK' }]
    );
  };

  const startDrawingPaddock = () => {
    setAppState('drawing-paddock');
    setDrawingMode('paddock');
    setSelectedPolygonId(null);
    setCurrentPolygon([]);
    Alert.alert(
      'Draw Paddock',
      'Tap on the map to add points for your paddock within the farm boundary.',
      [{ text: 'OK' }]
    );
  };

  const enterEditMode = () => {
    setAppState('editing');
    setIsEditMode(true);
    Alert.alert(
      'Edit Mode',
      'Tap on a polygon to select it, then drag the red corner points to resize.',
      [{ text: 'OK' }]
    );
  };

  const exitEditMode = () => {
    setAppState('farm-completed');
    setIsEditMode(false);
    setSelectedPolygonId(null);
  };

  const cancelDrawing = () => {
    if (appState === 'drawing-farm') {
      setAppState('initial');
    } else if (appState === 'drawing-paddock') {
      setAppState('farm-completed');
    }
    setCurrentPolygon([]);
  };

  const completeFarm = () => {
    if (currentPolygon.length < 3) {
      Alert.alert('Error', 'A farm boundary needs at least 3 points. Please add more points.');
      return;
    }

    const polygonCoords = currentPolygon.map(point => point.coordinates);
    const closedPolygon = createClosedPolygon(polygonCoords);
    
    const newPolygon: Polygon = {
      type: 'Polygon',
      coordinates: [closedPolygon]
    };

    const polygonId = `farm_${Date.now()}`;
    const newFeature: PolygonFeature = {
      type: 'Feature',
      properties: {
        name: 'Farm Boundary',
        created: new Date().toISOString(),
        id: polygonId,
        type: 'farm',
      },
      geometry: newPolygon
    };

    setCompletedPolygons(prev => ({
      ...prev,
      features: [...prev.features, newFeature]
    }));

    // Auto-select the completed farm
    setSelectedFarmId(polygonId);
    setCurrentPolygon([]);
    setAppState('farm-completed');
    
    Alert.alert(
      'Farm Boundary Created!',
      `Farm boundary completed with ${currentPolygon.length} points. You can now add paddocks or edit the boundary.`,
      [{ text: 'OK' }]
    );
  };

  const completePaddock = () => {
    if (currentPolygon.length < 3) {
      Alert.alert('Error', 'A paddock needs at least 3 points. Please add more points.');
      return;
    }

    const polygonCoords = currentPolygon.map(point => point.coordinates);
    
    // Validate paddock is within farm boundary
    if (selectedFarmId) {
      const selectedFarm = completedPolygons.features.find(f => 
        f.properties && f.properties.id === selectedFarmId
      );
      
      if (selectedFarm) {
        const farmCoords = selectedFarm.geometry.coordinates[0];
        if (!isPaddockWithinFarm(polygonCoords, farmCoords)) {
          Alert.alert(
            'Invalid Paddock',
            'The paddock must be drawn completely within the farm boundary.',
            [{ text: 'OK' }]
          );
          return;
        }
      }
    }

    // Show paddock info modal
    const paddockCount = getPaddocksForFarm(completedPolygons, selectedFarmId || '').length;
    setPaddockInfo({
      name: `Paddock ${paddockCount + 1}`,
      purpose: 'Grazing',
      capacity: '',
      notes: ''
    });
    setShowPaddockModal(true);
  };

  const handleSavePaddock = () => {
    const polygonCoords = currentPolygon.map(point => point.coordinates);
    const closedPolygon = createClosedPolygon(polygonCoords);
    
    const newPolygon: Polygon = {
      type: 'Polygon',
      coordinates: [closedPolygon]
    };

    const polygonId = `paddock_${Date.now()}`;
    
    const newFeature: PolygonFeature = {
      type: 'Feature',
      properties: {
        name: paddockInfo.name.trim(),
        created: new Date().toISOString(),
        id: polygonId,
        type: 'paddock',
        parentId: selectedFarmId || undefined,
        purpose: paddockInfo.purpose,
        capacity: paddockInfo.capacity ? parseInt(paddockInfo.capacity) : undefined,
        notes: paddockInfo.notes.trim() || undefined,
      },
      geometry: newPolygon
    };

    setCompletedPolygons(prev => ({
      ...prev,
      features: [...prev.features, newFeature]
    }));

    setCurrentPolygon([]);
    setAppState('farm-completed');
    setShowPaddockModal(false);
    
    Alert.alert(
      'Paddock Created!',
      `${paddockInfo.name} created successfully with ${currentPolygon.length} points.`,
      [{ text: 'OK' }]
    );
  };

  const handleCancelPaddock = () => {
    setShowPaddockModal(false);
  };

  const clearAll = () => {
    Alert.alert(
      'Clear All',
      'Are you sure you want to clear the farm and all paddocks?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          style: 'destructive',
          onPress: () => {
            setCompletedPolygons({ type: 'FeatureCollection', features: [] });
            setCurrentPolygon([]);
            setAppState('initial');
            setIsEditMode(false);
            setSelectedPolygonId(null);
            setSelectedFarmId(null);
          }
        }
      ]
    );
  };

  const onMapPress = (event: any) => {
    if (!event || !event.geometry || !event.geometry.coordinates) {
      return;
    }
    
    const { geometry } = event;
    const [longitude, latitude] = geometry.coordinates;
    
    if (appState === 'drawing-farm' || appState === 'drawing-paddock') {
      const newPoint: DrawingPoint = {
        coordinates: [longitude, latitude],
        id: `point_${Date.now()}_${Math.random()}`
      };
      
      setCurrentPolygon(prev => [...prev, newPoint]);
      
    } else if (isEditMode) {
      const tappedPolygon = completedPolygons.features.find(feature => {
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

  const onVertexDragStart = () => {
    HapticFeedback.pointSelected();
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

  const onDrawingPointDragStart = () => {
    HapticFeedback.pointSelected();
  };

  // Create current drawing points as GeoJSON for immediate rendering
  const currentDrawingPoints: PointCollection = {
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

  // Create current drawing polygon for visualization
  const currentDrawingPolygon: PolygonCollection = {
    type: 'FeatureCollection',
    features: currentPolygon.length > 0 ? [{
      type: 'Feature',
      properties: { 
        isDrawing: true,
        drawingMode: drawingMode 
      },
      geometry: {
        type: 'Polygon',
        coordinates: [currentPolygon.length > 2 
          ? [...currentPolygon.map(p => p.coordinates), currentPolygon[0].coordinates] 
          : currentPolygon.map(p => p.coordinates)
        ]
      }
    }] : []
  };

  const selectedPolygonVertices = getPolygonVertices(completedPolygons, selectedPolygonId || '');

  return (
    <SafeAreaView style={styles.container}>
      <ControlPanel
        appState={appState}
        currentPolygonLength={currentPolygon.length}
        completedPolygons={completedPolygons}
        selectedFarmId={selectedFarmId}
        selectedPolygonId={selectedPolygonId}
        onStartDrawingFarm={startDrawingFarm}
        onStartDrawingPaddock={startDrawingPaddock}
        onCompleteFarm={completeFarm}
        onCompletePaddock={completePaddock}
        onEnterEditMode={enterEditMode}
        onExitEditMode={exitEditMode}
        onCancelDrawing={cancelDrawing}
        onClearAll={clearAll}
      />

      <PaddockInfoModal
        visible={showPaddockModal}
        paddockInfo={paddockInfo}
        onPaddockInfoChange={setPaddockInfo}
        onSave={handleSavePaddock}
        onCancel={handleCancelPaddock}
      />

      {/* Map Container */}
      <View style={styles.mapContainer}>
        <MapView 
          style={styles.map}
          styleURL={MAP_CONFIG.STYLE_URL}
          onPress={onMapPress}
        >
          <MapboxGL.Camera
            zoomLevel={MAP_CONFIG.ZOOM_LEVEL}
            centerCoordinate={MAP_CONFIG.CENTER_COORDINATE}
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
                    COLORS.SELECTED,
                    ['==', ['get', 'id'], selectedFarmId || ''],
                    COLORS.SELECTED_FARM,
                    ['==', ['get', 'type'], 'farm'],
                    COLORS.FARM_BOUNDARY,
                    COLORS.PADDOCK
                  ],
                  fillOpacity: [
                    'case',
                    ['==', ['get', 'type'], 'farm'],
                    0.2,
                    0.4
                  ]
                }}
              />
              <LineLayer
                id="completedPolygonsLine"
                style={{
                  lineColor: [
                    'case',
                    ['==', ['get', 'id'], selectedPolygonId || ''],
                    COLORS.SELECTED,
                    ['==', ['get', 'id'], selectedFarmId || ''],
                    COLORS.SELECTED_FARM,
                    ['==', ['get', 'type'], 'farm'],
                    COLORS.FARM_BOUNDARY,
                    COLORS.PADDOCK
                  ],
                  lineWidth: [
                    'case',
                    ['==', ['get', 'type'], 'farm'],
                    4,
                    2
                  ],
                  lineOpacity: 0.8
                }}
              />
            </ShapeSource>
          )}

          {/* Paddock Name Text */}
          {completedPolygons.features.length > 0 && (
            <ShapeSource id="paddockLabels" shape={completedPolygons}>
              <SymbolLayer
                id="paddockNameText"
                style={{
                  textField: [
                    'case',
                    ['==', ['get', 'type'], 'paddock'],
                    ['get', 'name'],
                    ''
                  ],
                  textSize: 14,
                  textColor: COLORS.PRIMARY_TEXT,
                  textHaloColor: COLORS.WHITE,
                  textHaloWidth: 2,
                  textFont: ['Open Sans Bold', 'Arial Unicode MS Bold'],
                  textOffset: [0, 0],
                  textAnchor: 'center',
                  textAllowOverlap: true,
                  textIgnorePlacement: true,
                }}
              />
            </ShapeSource>
          )}

          {/* Current Drawing Points */}
          {currentDrawingPoints.features.length > 0 && (
            <ShapeSource id="currentDrawingPoints" shape={currentDrawingPoints}>
              <CircleLayer
                id="currentDrawingPointsLayer"
                style={{
                  circleRadius: 9,
                  circleColor: drawingMode === 'farm' ? COLORS.FARM_BOUNDARY : COLORS.PADDOCK,
                  circleStrokeColor: COLORS.WHITE,
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
              onDragStart={onVertexDragStart}
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

          {/* Draggable Points for Current Drawing */}
          {(appState === 'drawing-farm' || appState === 'drawing-paddock') && currentPolygon.map((point) => (
            <PointAnnotation
              key={point.id}
              id={point.id}
              coordinate={point.coordinates}
              draggable={true}
              onDragStart={onDrawingPointDragStart}
              onDragEnd={(feature) => {
                const newCoordinate = feature.geometry.coordinates;
                onDrawingPointDrag(point.id, newCoordinate);
              }}
            >
              <View style={[
                styles.drawingPointDragHandle,
                { backgroundColor: drawingMode === 'farm' ? `${COLORS.FARM_BOUNDARY}CC` : `${COLORS.PADDOCK}CC` }
              ]}>
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
                  fillColor: drawingMode === 'farm' ? COLORS.FARM_BOUNDARY : COLORS.PADDOCK,
                  fillOpacity: 0.2
                }}
              />
              <LineLayer
                id="currentDrawingLine"
                style={{
                  lineColor: drawingMode === 'farm' ? COLORS.FARM_BOUNDARY : COLORS.PADDOCK,
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
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
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
    backgroundColor: COLORS.VERTEX_HANDLE,
    borderWidth: 2,
    borderColor: COLORS.WHITE,
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
    backgroundColor: COLORS.WHITE,
  },
  drawingPointDragHandle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.WHITE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  drawingPointDragInner: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.WHITE,
  },
});

export default HomeScreen; 
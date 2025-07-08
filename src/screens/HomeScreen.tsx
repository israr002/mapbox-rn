import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Alert,
  Vibration,
  Platform,
} from 'react-native';
import MapboxGL, { MapView, ShapeSource, FillLayer, LineLayer, PointAnnotation, CircleLayer, SymbolLayer } from '@rnmapbox/maps';
import Config from 'react-native-config';

import { ControlPanel, PaddockInfoModal, FloatingBottomMenu, AddPaddockButton, HeatmapLegend } from '../components';
import { 
  AppState, 
  DrawingMode, 
  DrawingPoint, 
  PolygonCollection, 
  PointCollection, 
  PaddockInfo, 
  PolygonFeature,
  BottomMenuMode,
  LivestockData,
  LivestockAnnotation as LivestockAnnotationType,
  HeatmapDataPoint
} from '../utils/types';
import {
  isPointInPolygon, 
  isPaddockWithinFarm, 
  getFarmBoundaries, 
  getPaddocksForFarm, 
  getPolygonVertices, 
  createClosedPolygon,
  addInitialsToPolygons,
  generateMockLivestockData,
  createLivestockAnnotations,
  generateHeatmapData,
  createHeatmapGeoJSON
} from '../utils/mapUtils';
import {
  loadAllData,
  saveCompletedPolygons,
  saveSelectedFarmId,
  saveAppState,
  saveBottomMenuMode,
  clearAllData
} from '../utils/storage';
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

  // Bottom menu state
  const [bottomMenuMode, setBottomMenuMode] = useState<BottomMenuMode | null>(null);

  // Livestock state
  const [livestockData, setLivestockData] = useState<LivestockData[]>([]);
  const [livestockAnnotations, setLivestockAnnotations] = useState<LivestockAnnotationType[]>([]);

  // Heatmap state
  const [heatmapData, setHeatmapData] = useState<HeatmapDataPoint[]>([]);

  // Load data from storage on component mount
  useEffect(() => {
    const loadStoredData = () => {
      try {
        const storedData = loadAllData();
        
        if (storedData.completedPolygons.features.length > 0) {
          setCompletedPolygons(storedData.completedPolygons);
          console.log('Loaded', storedData.completedPolygons.features.length, 'polygons from storage');
        }
        
        if (storedData.selectedFarmId) {
          setSelectedFarmId(storedData.selectedFarmId);
          console.log('Restored selected farm:', storedData.selectedFarmId);
        }
        
        if (storedData.appState !== 'initial') {
          setAppState(storedData.appState);
          console.log('Restored app state:', storedData.appState);
        }
        
        if (storedData.bottomMenuMode) {
          setBottomMenuMode(storedData.bottomMenuMode);
          console.log('Restored bottom menu mode:', storedData.bottomMenuMode);
        }
        
        console.log('All data loaded from storage. Last saved:', storedData.lastSaved);
      } catch (error) {
        console.error('Error loading stored data:', error);
      }
    };

    loadStoredData();
  }, []);

  // Auto-save whenever polygons change
  useEffect(() => {
    if (completedPolygons.features.length > 0) {
      saveCompletedPolygons(completedPolygons);
    }
  }, [completedPolygons]);

  // Auto-save app state changes
  useEffect(() => {
    saveAppState(appState);
  }, [appState]);

  // Auto-save selected farm ID
  useEffect(() => {
    saveSelectedFarmId(selectedFarmId);
  }, [selectedFarmId]);

  // Auto-save bottom menu mode
  useEffect(() => {
    saveBottomMenuMode(bottomMenuMode);
  }, [bottomMenuMode]);

  // Generate livestock data when paddocks change
  useEffect(() => {
    const paddocks = completedPolygons.features.filter(f => f.properties?.type === 'paddock');
    if (paddocks.length > 0) {
      // Always regenerate livestock data when paddocks change
      const mockData = generateMockLivestockData(completedPolygons);
      setLivestockData(mockData);
      console.log('Generated livestock data for', paddocks.length, 'paddocks');
    } else {
      // Clear livestock data when no paddocks exist
      setLivestockData([]);
    }
  }, [completedPolygons]);

  // Create livestock annotations when livestock data or polygons change
  useEffect(() => {
    if (livestockData.length > 0) {
      const annotations = createLivestockAnnotations(completedPolygons, livestockData);
      console.log('Created livestock annotations:', annotations.length);
      annotations.forEach((annotation, index) => {
        console.log(`Annotation ${index}:`, {
          id: annotation.id,
          count: annotation.count,
          type: annotation.type,
          status: annotation.status,
          coordinates: annotation.coordinates
        });
      });
      setLivestockAnnotations(annotations);
    }
  }, [completedPolygons, livestockData]);

  // Generate heatmap data when farm boundaries or livestock data changes
  useEffect(() => {
    const farmBoundaries = completedPolygons.features.filter(f => f.properties?.type === 'farm');
    if (farmBoundaries.length > 0 && livestockData.length > 0) {
      const livestockHeatmapData = generateHeatmapData(completedPolygons, livestockData);
      setHeatmapData(livestockHeatmapData);
      console.log('Generated livestock density heatmap points:', livestockHeatmapData.length);
    } else {
      // Clear heatmap data when no farm or livestock data exists
      setHeatmapData([]);
    }
  }, [completedPolygons, livestockData]);

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
    setAppState('paddock-mode');
    setIsEditMode(false);
    setSelectedPolygonId(null);
  };

  const cancelDrawing = () => {
    if (appState === 'drawing-farm') {
      setAppState('initial');
    } else if (appState === 'drawing-paddock') {
      setAppState('paddock-mode'); // Return to paddock mode
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
    setAppState('paddock-mode'); // Directly go to paddock mode
    setBottomMenuMode('paddock'); // Default to paddock mode
    
    Alert.alert(
      'Farm Boundary Created!',
      `Farm boundary completed with ${currentPolygon.length} points. You can now add paddocks using the + button.`,
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
    setAppState('paddock-mode');
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

  const handleBottomMenuSelect = (mode: BottomMenuMode) => {
    setBottomMenuMode(mode);
    switch (mode) {
      case 'paddock':
        setAppState('paddock-mode');
        break;
      case 'livestock':
        setAppState('livestock-mode');
        break;
      case 'heatmap':
        setAppState('heatmap-mode');
        break;
    }
  };

  const handleAddPaddock = () => {
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

  const clearAll = () => {
    Alert.alert(
      'Clear All',
      'Are you sure you want to clear the farm and all paddocks? This will also remove all saved data.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          style: 'destructive',
          onPress: () => {
            // Clear all state
            setCompletedPolygons({ type: 'FeatureCollection', features: [] });
            setCurrentPolygon([]);
            setAppState('initial');
            setIsEditMode(false);
            setSelectedPolygonId(null);
            setSelectedFarmId(null);
            setBottomMenuMode(null);
            setLivestockData([]);
            setLivestockAnnotations([]);
            setHeatmapData([]);
            
            // Clear storage
            clearAllData();
            console.log('Cleared all data from storage');
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

  // Prepare polygons with initials for map display
  const polygonsWithInitials = addInitialsToPolygons(completedPolygons);

  // Create livestock data for SymbolLayer
  const livestockPointsGeoJSON: PointCollection = {
    type: 'FeatureCollection',
    features: livestockAnnotations.map(annotation => {
      const countStr = annotation.count.toString();
      console.log('Livestock annotation:', {
        id: annotation.id,
        count: annotation.count,
        countStr: countStr,
        type: annotation.type,
        coordinates: annotation.coordinates
      });
      return {
        type: 'Feature',
        properties: {
          id: annotation.id,
          count: countStr,
          type: annotation.type,
          status: annotation.status,
          iconImage: annotation.type === 'cattle' ? 'livestock-cattle' : 'livestock-sheep',
          statusColor: annotation.status === 'healthy' ? '#4CAF50' :
                       annotation.status === 'attention' ? '#FF9800' :
                       annotation.status === 'quarantine' ? '#F44336' :
                       annotation.status === 'breeding' ? '#9C27B0' : '#2196F3'
        },
        geometry: {
          type: 'Point',
          coordinates: annotation.coordinates
        }
      };
    })
  };

  // Create heatmap data for visualization
  const heatmapGeoJSON = createHeatmapGeoJSON(heatmapData);

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

      {/* Floating Bottom Menu */}
      <FloatingBottomMenu
        visible={appState === 'paddock-mode' || appState === 'livestock-mode' || appState === 'heatmap-mode'}
        activeMode={bottomMenuMode}
        onModeSelect={handleBottomMenuSelect}
      />

      {/* Add Paddock Button */}
      <AddPaddockButton
        visible={appState === 'paddock-mode'}
        onPress={handleAddPaddock}
      />

      {/* Heatmap Legend */}
      <HeatmapLegend
        visible={appState === 'heatmap-mode'}
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
            <ShapeSource id="completedPolygons" shape={polygonsWithInitials}>
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
            <ShapeSource id="paddockLabels" shape={polygonsWithInitials}>
              <SymbolLayer
                id="paddockNameText"
                style={{
                  textField: [
                    'case',
                    ['==', ['get', 'type'], 'paddock'],
                    ['get', 'initials'],
                    ''
                  ],
                  textSize: 16,
                  textColor: COLORS.PRIMARY_TEXT,
                  textHaloColor: COLORS.WHITE,
                  textHaloWidth: 2,
                  textFont: ['Open Sans Bold', 'Arial Unicode MS Bold'],
                  textOffset: [0, 2.0],
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

          {/* Heatmap Visualization */}
          {appState === 'heatmap-mode' && heatmapGeoJSON.features.length > 0 && (
            <>
              <ShapeSource id="heatmapPoints" shape={heatmapGeoJSON}>
                <MapboxGL.HeatmapLayer
                  id="heatmapLayer"
                  style={{
                    heatmapWeight: [
                      'interpolate',
                      ['linear'],
                      ['get', 'intensity'],
                      0, 0,
                      1, 1
                    ],
                    heatmapIntensity: [
                      'interpolate',
                      ['linear'],
                      ['zoom'],
                      8, 1,
                      12, 2.5,
                      16, 4
                    ],
                    heatmapColor: [
                      'interpolate',
                      ['linear'],
                      ['heatmap-density'],
                      0, 'rgba(0, 0, 255, 0)',
                      0.1, 'rgba(0, 100, 255, 0.6)',
                      0.3, 'rgba(0, 200, 255, 0.7)',
                      0.5, 'rgba(50, 255, 50, 0.8)',
                      0.7, 'rgba(255, 255, 0, 0.8)',
                      0.85, 'rgba(255, 150, 0, 0.9)',
                      1, 'rgba(255, 0, 0, 1)'
                    ],
                    heatmapRadius: [
                      'interpolate',
                      ['linear'],
                      ['zoom'],
                      8, 20,
                      12, 30,
                      16, 45
                    ],
                    heatmapOpacity: [
                      'interpolate',
                      ['linear'],
                      ['zoom'],
                      8, 0.6,
                      12, 0.8,
                      16, 0.9
                    ]
                  }}
                />
                
                {/* Data point circles (visible at high zoom) */}
                <CircleLayer
                  id="heatmapDataPoints"
                  style={{
                    circleRadius: [
                      'interpolate',
                      ['linear'],
                      ['zoom'],
                      12, 0,
                      14, 4,
                      16, 8
                    ],
                    circleColor: [
                      'interpolate',
                      ['linear'],
                      ['get', 'value'],
                      0, '#0066FF',
                      25, '#00CCFF',
                      50, '#32FF32',
                      75, '#FFFF00',
                      85, '#FF9600',
                      100, '#FF0000'
                    ],
                    circleStrokeColor: '#FFFFFF',
                    circleStrokeWidth: [
                      'interpolate',
                      ['linear'],
                      ['zoom'],
                      12, 0,
                      14, 1,
                      16, 2
                    ],
                    circleOpacity: [
                      'interpolate',
                      ['linear'],
                      ['zoom'],
                      12, 0,
                      14, 0.8,
                      16, 1
                    ]
                  }}
                />
                
                {/* Data point values (visible at very high zoom) */}
                <SymbolLayer
                  id="heatmapDataValues"
                  style={{
                    textField: [
                      'format',
                      ['concat', ['get', 'value'], '%'],
                      {}
                    ],
                    textSize: [
                      'interpolate',
                      ['linear'],
                      ['zoom'],
                      14, 0,
                      15, 9,
                      16, 11
                    ],
                    textColor: '#000000',
                    textHaloColor: '#FFFFFF',
                    textHaloWidth: 1.5,
                    textFont: ['Open Sans Bold', 'Arial Unicode MS Bold'],
                    textAnchor: 'center',
                    textAllowOverlap: false,
                    textIgnorePlacement: false,
                    textOpacity: [
                      'interpolate',
                      ['linear'],
                      ['zoom'],
                      14, 0,
                      15, 0.8,
                      16, 1
                    ]
                  }}
                />
              </ShapeSource>
            </>
          )}

          {/* Livestock Annotations */}
          {appState === 'livestock-mode' && livestockPointsGeoJSON.features.length > 0 && (
            <>
              {/* Add livestock icons to map */}
              <MapboxGL.Images
                images={{
                  'livestock-cattle': require('../assets/icons/cattle.png'),
                  'livestock-sheep': require('../assets/icons/sheep.png'),
                }}
                onImageMissing={(imageKey) => {
                  console.log('Missing image:', imageKey);
                  return false;
                }}
              />
              
              <ShapeSource id="livestockPoints" shape={livestockPointsGeoJSON}>
                {/* Background circles */}
                <CircleLayer
                  id="livestockCircles"
                  style={{
                    circleRadius: 25,
                    circleColor: ['get', 'statusColor'],
                    circleStrokeColor: '#FFFFFF',
                    circleStrokeWidth: 3,
                    circleOpacity: 0.9,
                  }}
                />
                                {/* Animal icons */}
                <SymbolLayer
                  id="livestockIcons"
                  style={{
                    iconImage: ['get', 'iconImage'],
                    iconSize: 0.10,
                    iconOffset: [0, -18],
                    iconAllowOverlap: true,
                    iconIgnorePlacement: true,
                  }}
                />
                
                {/* Count numbers */}
                <SymbolLayer
                  id="livestockCounts"
                  style={{
                    textField: ['get', 'count'],
                    textSize: 12,
                    textColor: '#FFFFFF',
                    textHaloColor: '#000000',
                    textHaloWidth: 1,
                    textFont: ['Open Sans Bold', 'Arial Unicode MS Bold'],
                    textOffset: [0, 1.2],
                    textAnchor: 'center',
                    textAllowOverlap: true,
                    textIgnorePlacement: true,
                  }}
                />
              </ShapeSource>
            </>
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
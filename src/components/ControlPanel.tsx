import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { AppState, PolygonCollection, BottomMenuMode } from '../utils/types';
import { getFarmBoundaries, getPaddocksForFarm } from '../utils/mapUtils';
import { clearAllData, getStorageInfo } from '../utils/storage';
import { COLORS } from '../constants';

interface ControlPanelProps {
  appState: AppState;
  currentPolygonLength: number;
  completedPolygons: PolygonCollection;
  selectedFarmId: string | null;
  selectedPolygonId: string | null;
  onStartDrawingFarm: () => void;
  onStartDrawingPaddock: () => void;
  onCompleteFarm: () => void;
  onCompletePaddock: () => void;
  onEnterEditMode: () => void;
  onExitEditMode: () => void;
  onCancelDrawing: () => void;
  onClearAll: () => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  appState,
  currentPolygonLength,
  completedPolygons,
  selectedFarmId,
  selectedPolygonId,
  onStartDrawingFarm,
  onStartDrawingPaddock,
  onCompleteFarm,
  onCompletePaddock,
  onEnterEditMode,
  onExitEditMode,
  onCancelDrawing,
  onClearAll,
}) => {
  const farmBoundaries = getFarmBoundaries(completedPolygons);
  const paddockCount = completedPolygons.features.filter(f => f.properties?.type === 'paddock').length;
  const selectedFarmPaddockCount = selectedFarmId ? getPaddocksForFarm(completedPolygons, selectedFarmId).length : 0;

  const getInstructionText = () => {
    switch (appState) {
      case 'drawing-farm':
        return `Drawing Farm Boundary | Points: ${currentPolygonLength} | Tap map to add points`;
      case 'drawing-paddock':
        return `Drawing Paddock | Points: ${currentPolygonLength} | Tap map to add points within farm`;
      case 'editing':
        return selectedPolygonId 
          ? 'Drag red points to resize | Haptic feedback on drag' 
          : 'Tap on a polygon to select it';
      default:
        return '';
    }
  };

  // Hide control panel when farm is completed - floating menu takes over
  if (appState === 'paddock-mode' || appState === 'livestock-mode' || appState === 'heatmap-mode') {
    return null;
  }

  return (
    <View style={styles.controlPanel}>
      <Text style={styles.title}>Farm Management Tool</Text>
      
      {/* Step-by-step workflow */}
      <View style={styles.buttonContainer}>
        {appState === 'initial' && (
          <TouchableOpacity style={styles.startButton} onPress={onStartDrawingFarm}>
            <Text style={styles.buttonText}>Draw Farm Boundary</Text>
          </TouchableOpacity>
        )}
        
        {appState === 'drawing-farm' && (
          <>
            <TouchableOpacity style={styles.completeButton} onPress={onCompleteFarm}>
              <Text style={styles.buttonText}>Complete Farm</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={onCancelDrawing}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </>
        )}

        
        {appState === 'editing' && (
          <>
            <TouchableOpacity style={styles.doneButton} onPress={onExitEditMode}>
              <Text style={styles.buttonText}>Done Editing</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={onExitEditMode}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </>
        )}
        
        {appState === 'drawing-paddock' && (
          <>
            <TouchableOpacity style={styles.completeButton} onPress={onCompletePaddock}>
              <Text style={styles.buttonText}>Complete Paddock</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={onCancelDrawing}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Instructions */}
      {getInstructionText() && (
        <Text style={styles.instructions}>{getInstructionText()}</Text>
      )}

      {/* Status Info */}
      <View style={styles.statusContainer}>
        <Text style={styles.info}>
          Farm: {farmBoundaries.length > 0 ? '✓ Complete' : 'Not created'} | Paddocks: {paddockCount}
        </Text>
        {selectedFarmId && (
          <Text style={styles.info}>
            Paddocks in farm: {selectedFarmPaddockCount}
          </Text>
        )}
      </View>

      {/* TEMPORARY: Storage Testing Button - REMOVE LATER */}
      <View style={styles.tempButtonContainer}>
        <TouchableOpacity 
          style={styles.tempStorageButton} 
          onPress={() => {
            console.log('🔍 BEFORE CLEAR - Storage Info:', getStorageInfo());
            clearAllData();
            console.log('🗑️ MMKV Storage Cleared for Testing');
            console.log('🔍 AFTER CLEAR - Storage Info:', getStorageInfo());
          }}
        >
          <Text style={styles.tempButtonText}>🗑️ Clear MMKV (Test)</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  controlPanel: {
    backgroundColor: COLORS.WHITE,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.PRIMARY_TEXT,
    marginBottom: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  startButton: {
    backgroundColor: COLORS.FARM_BOUNDARY,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  editButton: {
    backgroundColor: COLORS.INFO,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  paddockButton: {
    backgroundColor: COLORS.PADDOCK,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  completeButton: {
    backgroundColor: COLORS.INFO,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  doneButton: {
    backgroundColor: COLORS.SUCCESS,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  cancelButton: {
    backgroundColor: COLORS.ERROR,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  clearButton: {
    backgroundColor: COLORS.WARNING,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  buttonText: {
    color: COLORS.WHITE,
    fontSize: 14,
    fontWeight: '600',
  },
  instructions: {
    fontSize: 14,
    color: COLORS.SECONDARY_TEXT,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  statusContainer: {
    marginTop: 4,
  },
  info: {
    fontSize: 12,
    color: COLORS.LIGHT_TEXT,
    marginBottom: 2,
  },
  // TEMPORARY STYLES - REMOVE LATER
  tempButtonContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
  },
  tempStorageButton: {
    backgroundColor: '#ff4444',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  tempButtonText: {
    color: COLORS.WHITE,
    fontSize: 12,
    fontWeight: '600',
  },
});

export default ControlPanel; 
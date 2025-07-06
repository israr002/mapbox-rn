import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { AppState, PolygonCollection } from '../utils/types';
import { getFarmBoundaries, getPaddocksForFarm } from '../utils/mapUtils';
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
      case 'farm-completed':
        return 'Farm boundary ready | Choose to edit farm or add paddocks';
      default:
        return '';
    }
  };

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
        
        {appState === 'farm-completed' && (
          <>
            <TouchableOpacity style={styles.editButton} onPress={onEnterEditMode}>
              <Text style={styles.buttonText}>Edit/Resize</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.paddockButton} onPress={onStartDrawingPaddock}>
              <Text style={styles.buttonText}>Add Paddock</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.clearButton} onPress={onClearAll}>
              <Text style={styles.buttonText}>Clear All</Text>
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
});

export default ControlPanel; 
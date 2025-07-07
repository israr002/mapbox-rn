import { MMKV } from 'react-native-mmkv';
import { PolygonCollection, AppState, BottomMenuMode } from './types';

// Initialize MMKV storage
const storage = new MMKV({
  id: 'farm-management-storage',
  encryptionKey: 'farm-data-encryption-key-2024'
});

// Storage keys
const STORAGE_KEYS = {
  COMPLETED_POLYGONS: 'completedPolygons',
  SELECTED_FARM_ID: 'selectedFarmId',
  APP_STATE: 'appState',
  BOTTOM_MENU_MODE: 'bottomMenuMode',
  LAST_SAVED: 'lastSaved'
} as const;

export interface StorageData {
  completedPolygons: PolygonCollection;
  selectedFarmId: string | null;
  appState: AppState;
  bottomMenuMode: BottomMenuMode | null;
  lastSaved: string;
}

// Save functions
export const saveCompletedPolygons = (polygons: PolygonCollection): void => {
  try {
    storage.set(STORAGE_KEYS.COMPLETED_POLYGONS, JSON.stringify(polygons));
    storage.set(STORAGE_KEYS.LAST_SAVED, new Date().toISOString());
    console.log('Saved polygons to storage');
  } catch (error) {
    console.error('Error saving polygons:', error);
  }
};

export const saveSelectedFarmId = (farmId: string | null): void => {
  try {
    if (farmId) {
      storage.set(STORAGE_KEYS.SELECTED_FARM_ID, farmId);
    } else {
      storage.delete(STORAGE_KEYS.SELECTED_FARM_ID);
    }
    console.log('Saved selected farm ID:', farmId);
  } catch (error) {
    console.error('Error saving farm ID:', error);
  }
};

export const saveAppState = (state: AppState): void => {
  try {
    storage.set(STORAGE_KEYS.APP_STATE, state);
    console.log('Saved app state:', state);
  } catch (error) {
    console.error('Error saving app state:', error);
  }
};

export const saveBottomMenuMode = (mode: BottomMenuMode | null): void => {
  try {
    if (mode) {
      storage.set(STORAGE_KEYS.BOTTOM_MENU_MODE, mode);
    } else {
      storage.delete(STORAGE_KEYS.BOTTOM_MENU_MODE);
    }
    console.log('Saved bottom menu mode:', mode);
  } catch (error) {
    console.error('Error saving bottom menu mode:', error);
  }
};

// Load functions
export const loadCompletedPolygons = (): PolygonCollection => {
  try {
    const data = storage.getString(STORAGE_KEYS.COMPLETED_POLYGONS);
    if (data) {
      const polygons = JSON.parse(data) as PolygonCollection;
      console.log('Loaded polygons from storage:', polygons.features.length, 'features');
      return polygons;
    }
  } catch (error) {
    console.error('Error loading polygons:', error);
  }
  
  // Return empty collection if no data or error
  return {
    type: 'FeatureCollection',
    features: []
  };
};

export const loadSelectedFarmId = (): string | null => {
  try {
    const farmId = storage.getString(STORAGE_KEYS.SELECTED_FARM_ID);
    console.log('Loaded selected farm ID:', farmId);
    return farmId || null;
  } catch (error) {
    console.error('Error loading farm ID:', error);
    return null;
  }
};

export const loadAppState = (): AppState => {
  try {
    const state = storage.getString(STORAGE_KEYS.APP_STATE) as AppState;
    if (state) {
      console.log('Loaded app state:', state);
      return state;
    }
  } catch (error) {
    console.error('Error loading app state:', error);
  }
  
  return 'initial'; // Default state
};

export const loadBottomMenuMode = (): BottomMenuMode | null => {
  try {
    const mode = storage.getString(STORAGE_KEYS.BOTTOM_MENU_MODE) as BottomMenuMode;
    console.log('Loaded bottom menu mode:', mode);
    return mode || null;
  } catch (error) {
    console.error('Error loading bottom menu mode:', error);
    return null;
  }
};

// Load all data at once
export const loadAllData = (): StorageData => {
  const data: StorageData = {
    completedPolygons: loadCompletedPolygons(),
    selectedFarmId: loadSelectedFarmId(),
    appState: loadAppState(),
    bottomMenuMode: loadBottomMenuMode(),
    lastSaved: storage.getString(STORAGE_KEYS.LAST_SAVED) || 'Never'
  };
  
  console.log('Loaded all data from storage');
  return data;
};

// Clear all data
export const clearAllData = (): void => {
  try {
    storage.clearAll();
    console.log('Cleared all storage data');
  } catch (error) {
    console.error('Error clearing storage:', error);
  }
};

// Get storage info
export const getStorageInfo = () => {
  try {
    const keys = storage.getAllKeys();
    const lastSaved = storage.getString(STORAGE_KEYS.LAST_SAVED);
    
    return {
      totalKeys: keys.length,
      keys: keys,
      lastSaved: lastSaved || 'Never',
      hasData: keys.length > 0
    };
  } catch (error) {
    console.error('Error getting storage info:', error);
    return {
      totalKeys: 0,
      keys: [],
      lastSaved: 'Never',
      hasData: false
    };
  }
}; 

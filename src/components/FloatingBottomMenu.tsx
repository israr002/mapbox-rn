import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BottomMenuMode } from '../utils/types';
import { COLORS } from '../constants';

interface FloatingBottomMenuProps {
  visible: boolean;
  activeMode: BottomMenuMode | null;
  onModeSelect: (mode: BottomMenuMode) => void;
}

const FloatingBottomMenu: React.FC<FloatingBottomMenuProps> = ({
  visible,
  activeMode,
  onModeSelect,
}) => {
  if (!visible) return null;

  const menuItems: { mode: BottomMenuMode; label: string }[] = [
    { mode: 'paddock', label: 'Paddock' },
    { mode: 'livestock', label: 'Livestock' },
    { mode: 'heatmap', label: 'Heatmap' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.menu}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.mode}
            style={[
              styles.menuItem,
              activeMode === item.mode && styles.menuItemActive
            ]}
            onPress={() => onModeSelect(item.mode)}
          >
            <Text style={[
              styles.menuLabel,
              activeMode === item.mode && styles.menuLabelActive
            ]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
  },
  menu: {
    flexDirection: 'row',
    backgroundColor: COLORS.WHITE,
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  menuItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    marginHorizontal: 4,
    minWidth: 80,
  },
  menuItemActive: {
    backgroundColor: COLORS.PRIMARY_TEXT,
  },
  menuLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.PRIMARY_TEXT,
  },
  menuLabelActive: {
    color: COLORS.WHITE,
  },
});

export default FloatingBottomMenu; 
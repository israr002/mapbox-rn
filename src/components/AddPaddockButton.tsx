import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants';

interface AddPaddockButtonProps {
  visible: boolean;
  onPress: () => void;
}

const AddPaddockButton: React.FC<AddPaddockButtonProps> = ({
  visible,
  onPress,
}) => {
  if (!visible) return null;

  return (
    <TouchableOpacity style={styles.addButton} onPress={onPress}>
      <Text style={styles.addButtonText}>+ Add Paddock</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  addButton: {
    position: 'absolute',
    top: 100,
    right: 20,
    backgroundColor: COLORS.PADDOCK,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 100,
  },
  addButtonText: {
    color: COLORS.WHITE,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default AddPaddockButton; 
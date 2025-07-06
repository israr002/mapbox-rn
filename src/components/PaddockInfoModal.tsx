import React from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Keyboard,
  TouchableWithoutFeedback,
  SafeAreaView,
} from 'react-native';
import { PaddockInfo } from '../utils/types';
import { PADDOCK_PURPOSES, COLORS } from '../constants';

interface PaddockInfoModalProps {
  visible: boolean;
  paddockInfo: PaddockInfo;
  onPaddockInfoChange: (info: PaddockInfo) => void;
  onSave: () => void;
  onCancel: () => void;
}

const PaddockInfoModal: React.FC<PaddockInfoModalProps> = ({
  visible,
  paddockInfo,
  onPaddockInfoChange,
  onSave,
  onCancel,
}) => {
  const handleSave = () => {
    if (!paddockInfo.name.trim()) {
      Alert.alert('Error', 'Please enter a paddock name.');
      return;
    }
    onSave();
  };

  const updatePaddockInfo = (field: keyof PaddockInfo, value: string) => {
    onPaddockInfoChange({
      ...paddockInfo,
      [field]: value,
    });
  };

  const handleBackdropPress = () => {
    Keyboard.dismiss();
    onCancel();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <TouchableWithoutFeedback onPress={handleBackdropPress}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <SafeAreaView style={styles.modalWrapper}>
              <View style={styles.modalContainer}>
                {/* Header */}
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Paddock Information</Text>
                  <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
                    <Text style={styles.closeButtonText}>×</Text>
                  </TouchableOpacity>
                </View>

                {/* Content */}
                <ScrollView 
                  style={styles.modalContent}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  {/* Paddock Name */}
                  <View style={styles.fieldContainer}>
                    <Text style={styles.fieldLabel}>Paddock Name *</Text>
                    <TextInput
                      style={styles.textInput}
                      value={paddockInfo.name}
                      onChangeText={(text) => updatePaddockInfo('name', text)}
                      placeholder="Enter paddock name"
                      placeholderTextColor={COLORS.SECONDARY_TEXT}
                      maxLength={50}
                      autoCapitalize="words"
                      autoCorrect={false}
                    />
                  </View>

                  {/* Purpose */}
                  <View style={styles.fieldContainer}>
                    <Text style={styles.fieldLabel}>Purpose</Text>
                    <View style={styles.purposeGrid}>
                      {PADDOCK_PURPOSES.map((purpose) => (
                        <TouchableOpacity
                          key={purpose}
                          style={[
                            styles.purposeChip,
                            paddockInfo.purpose === purpose && styles.purposeChipSelected
                          ]}
                          onPress={() => updatePaddockInfo('purpose', purpose)}
                        >
                          <Text style={[
                            styles.purposeText,
                            paddockInfo.purpose === purpose && styles.purposeTextSelected
                          ]}>
                            {purpose}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Capacity */}
                  <View style={styles.fieldContainer}>
                    <Text style={styles.fieldLabel}>Capacity (Animals)</Text>
                    <TextInput
                      style={styles.textInput}
                      value={paddockInfo.capacity?.toString() || ''}
                      onChangeText={(text) =>
                        updatePaddockInfo('capacity', text.replace(/[^0-9]/g, ''))
                      }
                      placeholder="Enter number of animals"
                      placeholderTextColor={COLORS.SECONDARY_TEXT}
                      keyboardType="numeric"
                      maxLength={10}
                    />
                  </View>

                  {/* Notes */}
                  <View style={styles.fieldContainer}>
                    <Text style={styles.fieldLabel}>Notes</Text>
                    <TextInput
                      style={[styles.textInput, styles.textArea]}
                      value={paddockInfo.notes}
                      onChangeText={(text) => updatePaddockInfo('notes', text)}
                      placeholder="Enter additional notes"
                      placeholderTextColor={COLORS.SECONDARY_TEXT}
                      multiline={true}
                      numberOfLines={3}
                      maxLength={200}
                      textAlignVertical="top"
                    />
                  </View>
                </ScrollView>

                {/* Footer */}
                <View style={styles.modalFooter}>
                  <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[
                      styles.saveButton,
                      !paddockInfo.name.trim() && styles.saveButtonDisabled
                    ]} 
                    onPress={handleSave}
                    disabled={!paddockInfo.name.trim()}
                  >
                    <Text style={styles.saveButtonText}>Save Paddock</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </SafeAreaView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalWrapper: {
    width: '90%',
    maxWidth: 400,
    maxHeight: '90%',
  },
  modalContainer: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
    backgroundColor: COLORS.WHITE,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.PRIMARY_TEXT,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.BORDER,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: COLORS.SECONDARY_TEXT,
    fontWeight: 'bold',
  },
  modalContent: {
    padding: 20,
    maxHeight: 400,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.PRIMARY_TEXT,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: COLORS.WHITE,
    color: COLORS.PRIMARY_TEXT,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  purposeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  purposeChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.BACKGROUND,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  purposeChipSelected: {
    backgroundColor: COLORS.PADDOCK,
    borderColor: COLORS.PADDOCK,
  },
  purposeText: {
    fontSize: 14,
    color: COLORS.PRIMARY_TEXT,
    fontWeight: '500',
  },
  purposeTextSelected: {
    color: COLORS.WHITE,
    fontWeight: '600',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: COLORS.BORDER,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.PRIMARY_TEXT,
  },
  saveButton: {
    flex: 1,
    backgroundColor: COLORS.SUCCESS,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: COLORS.BORDER,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.WHITE,
  },
});

export default PaddockInfoModal;

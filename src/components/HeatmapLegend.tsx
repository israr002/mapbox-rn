import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants';

interface HeatmapLegendProps {
  visible: boolean;
}

const HeatmapLegend: React.FC<HeatmapLegendProps> = ({ visible }) => {
  if (!visible) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🐄 Livestock Density</Text>
      <View style={styles.gradientBar}>
        <View style={styles.gradientBackground} />
        <View style={styles.gradientLabels}>
          <Text style={styles.gradientLabel}>Low</Text>
          <Text style={styles.gradientLabel}>High</Text>
        </View>
      </View>
      <View style={styles.legendItems}>
        <View style={styles.legendItem}>
          <View style={[styles.colorCircle, { backgroundColor: 'rgba(255, 0, 0, 1)' }]} />
          <Text style={styles.legendText}>Very High (80-100%)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.colorCircle, { backgroundColor: 'rgba(255, 150, 0, 0.9)' }]} />
          <Text style={styles.legendText}>High (60-80%)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.colorCircle, { backgroundColor: 'rgba(255, 255, 0, 0.8)' }]} />
          <Text style={styles.legendText}>Medium (40-60%)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.colorCircle, { backgroundColor: 'rgba(50, 255, 50, 0.8)' }]} />
          <Text style={styles.legendText}>Low-Medium (20-40%)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.colorCircle, { backgroundColor: 'rgba(0, 200, 255, 0.7)' }]} />
          <Text style={styles.legendText}>Low (5-20%)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.colorCircle, { backgroundColor: 'rgba(0, 100, 255, 0.6)' }]} />
          <Text style={styles.legendText}>Very Low (0-5%)</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 100,
    right: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    minWidth: 180,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.PRIMARY_TEXT,
    marginBottom: 12,
    textAlign: 'center',
  },
  gradientBar: {
    height: 20,
    borderRadius: 10,
    marginBottom: 8,
    overflow: 'hidden',
  },
  gradientBackground: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 10,
  },
  gradientLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  gradientLabel: {
    fontSize: 10,
    color: COLORS.SECONDARY_TEXT,
    fontWeight: '600',
  },
  legendItems: {
    gap: 8,
    marginTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  colorCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.2)',
  },
  legendText: {
    fontSize: 11,
    color: COLORS.PRIMARY_TEXT,
    flex: 1,
    fontWeight: '500',
  },
});

export default HeatmapLegend; 
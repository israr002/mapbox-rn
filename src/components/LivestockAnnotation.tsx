import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LivestockAnnotation as LivestockAnnotationType, LivestockStatus, LivestockType } from '../utils/types';
import { COLORS } from '../constants';

interface LivestockAnnotationProps {
  annotation: LivestockAnnotationType;
}

// Color mapping for different livestock statuses
const getStatusColor = (status: LivestockStatus): string => {
  switch (status) {
    case 'healthy':
      return '#4CAF50'; // Green
    case 'attention':
      return '#FF9800'; // Orange
    case 'quarantine':
      return '#F44336'; // Red
    case 'breeding':
      return '#9C27B0'; // Purple
    case 'medication':
      return '#2196F3'; // Blue
    default:
      return '#4CAF50';
  }
};

// Get livestock emoji based on type
const getLivestockIcon = (type: LivestockType): string => {
  switch (type) {
    case 'cattle':
      return '🐄';
    case 'sheep':
      return '🐑';
    case 'goats':
      return '🐐';
    case 'horses':
      return '🐎';
    case 'other':
      return '🐾';
    default:
      return '🐄';
  }
};

const LivestockAnnotation: React.FC<LivestockAnnotationProps> = ({ annotation }) => {
  const statusColor = getStatusColor(annotation.status);
  const icon = getLivestockIcon(annotation.type);

  // Don't render if count is 0
  if (annotation.count === 0) {
    return null;
  }

  // Debug logging
  console.log('LivestockAnnotation:', {
    count: annotation.count,
    type: annotation.type,
    status: annotation.status,
    icon: icon,
    statusColor: statusColor
  });

  return (
    <View style={[styles.container, { borderColor: statusColor, backgroundColor: statusColor }]}>
      {/* Simple test - just a colored circle */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
});

export default LivestockAnnotation; 
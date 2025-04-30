import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import colors from '@/colors';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface FancyCardProps {
  title: string;
  icon?: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  children: React.ReactNode;
  style?: ViewStyle;
}

const FancyCard = ({ title, icon, children, style }: FancyCardProps) => {
  return (
    <BlurView intensity={20} tint="light" style={[styles.card, style]}>
      <View style={styles.header}>
        {icon && (
          <MaterialCommunityIcons
            name={icon}
            size={20}
            color={colors.primary}
            style={{ marginRight: 8 }}
          />
        )}
        <Text style={styles.title}>{title}</Text>
      </View>
      <View>{children}</View>
    </BlurView>
  );
};

export default FancyCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: colors.black,
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
});
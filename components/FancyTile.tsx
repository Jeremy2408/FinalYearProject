import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import colors from '@/colors';

interface FancyTileProps {
  label: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  onPress: () => void;
  iconSize?: number;
  fontSize?: number;
  allowWrap?: boolean;
}

const FancyTile = ({ label, icon, onPress, iconSize, fontSize, allowWrap }: FancyTileProps) => {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [
      styles.wrapper,
      { transform: [{ scale: pressed ? 0.97 : 1 }] }
    ]}>
      <BlurView intensity={40} tint="light" style={styles.tile}>
        <MaterialCommunityIcons name={icon} size={iconSize ?? 28} color={colors.text} />
        <Text
          style={[styles.label, { fontSize: fontSize ?? 14 }]}
          numberOfLines={allowWrap ? undefined : 1}
          ellipsizeMode="tail"
        >
          {label}
        </Text>
      </BlurView>
    </Pressable>
  );
};

export default FancyTile;

const styles = StyleSheet.create({
  wrapper: {
    width: '46%',
    aspectRatio: 1,
    marginBottom: 14,
  },
  tile: {
    flex: 1,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#cbd5ff',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
    shadowColor: colors.black,
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 6,
  },
  label: {
    marginTop: 6,
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
});

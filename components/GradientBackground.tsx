import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import colors from '@/colors';

const GradientBackground = ({ children }: { children: React.ReactNode }) => {
  return (
    <LinearGradient
      colors={[colors.gradientStart, colors.gradientEnd]}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safeArea}>{children}</SafeAreaView>
    </LinearGradient>
  );
};

export default GradientBackground;

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});

import React, { useState } from 'react';
import { View, Text, Dimensions, StyleSheet, Pressable, Button } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWeeklyMoodData, useMonthlyMoodData, useDailyMoodData } from './useMoodData';
import { router } from 'expo-router';

const MoodAnalytics = () => {
  const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'monthly'>('weekly');

  const dailyData = useDailyMoodData();
  const weeklyData = useWeeklyMoodData();
  const monthlyData = useMonthlyMoodData();

  const moodData =
    viewMode === 'daily'
      ? dailyData
      : viewMode === 'weekly'
      ? weeklyData
      : monthlyData;

  const labels = moodData.map(item => item.label);
  const dataPoints = moodData.map(item => item.score);
  const validData = dataPoints.every(point => !isNaN(point));

  return (
    <SafeAreaView style={styles.container}>
      <Pressable onPress={() => router.back()}><Text>Go Back</Text></Pressable>
      <Text style={styles.title}>Mood Trends Over Time</Text>

      <View style={styles.toggleContainer}>
        <Button title="Daily" onPress={() => setViewMode('daily')} />
        <Button title="Weekly" onPress={() => setViewMode('weekly')} />
        <Button title="Monthly" onPress={() => setViewMode('monthly')} />
      </View>

      {validData && dataPoints.length > 0 ? (
        <LineChart
          data={{
            labels: labels,
            datasets: [{ data: dataPoints }],
          }}
          width={Dimensions.get('window').width - 16}
          height={250}
          yAxisInterval={0.5}
          chartConfig={{
            backgroundColor: '#ffffff',
            backgroundGradientFrom: '#f0f4ff',
            backgroundGradientTo: '#f0f4ff',
            decimalPlaces: 2,
            color: (opacity = 1) => `rgba(55, 83, 255, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            propsForDots: { r: "5", strokeWidth: "2", stroke: "#4A90E2" },
          }}
          bezier
          style={styles.graphStyle}
        />
      ) : (
        <Text>No valid mood data available yet.</Text>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    marginVertical: 12,
    fontWeight: 'bold',
  },
  graphStyle: {
    borderRadius: 16,
    marginTop: 16,
  },
  toggleContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
});

export default MoodAnalytics;

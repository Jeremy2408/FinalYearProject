import React, { useState } from 'react';
import { View, Text, Dimensions, StyleSheet, Pressable, Button } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWeeklyMoodData, useMonthlyMoodData, useDailyMoodData } from '../hooks/useMoodData';
import { router } from 'expo-router';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import BackButton from '../../components/BackButton';
import { MaterialIcons } from '@expo/vector-icons';
import Modal from 'react-native-modal';
import { ScrollView } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import colors from '@/colors';
import FancyCard from '@/components/FancyCard';


const exportMoodDataAsCSV = async (moodData: { label: string, score: number }[]) => {
  const csvContent = [
    'Date,Sentiment Score',
    ...moodData.map(item => `${item.label},${item.score}`)
  ].join('\n');

  const fileUri = FileSystem.documentDirectory + 'mood-report.csv';
  await FileSystem.writeAsStringAsync(fileUri, csvContent, { encoding: FileSystem.EncodingType.UTF8 });

  const available = await Sharing.isAvailableAsync();
  if (available) {
    await Sharing.shareAsync(fileUri);
  } else {
    alert('Sharing is not available on this device');
  }
};

const MoodAnalytics = () => {
  const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'monthly'>('weekly');

  const dailyData = useDailyMoodData();
  const weeklyData = useWeeklyMoodData();
  const monthlyData = useMonthlyMoodData();
  const [isInfoVisible, setInfoVisible] = useState(false);

  const moodData =
    viewMode === 'daily'
      ? dailyData
      : viewMode === 'weekly'
      ? weeklyData
      : monthlyData;

  const labels = moodData.map(item => item.label);
  const displayLabels = labels.map((label, index) => {
    if (viewMode === 'monthly') return label; 
    return index % 3 === 0 ? label : ''; 
  });
  const dataPoints = moodData.map(item => item.score);
  const validData = dataPoints.every(point => !isNaN(point));

  const average = dataPoints.length
    ? (dataPoints.reduce((sum, val) => sum + val, 0) / dataPoints.length).toFixed(2)
    : 'N/A';

  let moodLabel = '';
  const avgNum = parseFloat(average);
  if (!isNaN(avgNum)) {
    if (avgNum > 0.2) moodLabel = 'Mostly Positive';
    else if (avgNum < -0.2) moodLabel = 'Mostly Negative';
    else moodLabel = 'Neutral';
  }

  return (
    <LinearGradient
    colors={[colors.gradientStart, colors.gradientEnd]}
    style={{ flex: 1 }}
  >
    <SafeAreaView style={styles.container}>
      <BackButton />

      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <Text style={styles.title}>Mood Trends Over Time</Text>
        <Pressable onPress={() => setInfoVisible(true)} style={{ marginLeft: 6 }}>
          <MaterialIcons name="info-outline" size={22} color="gray" />
        </Pressable>
      </View>

      <View style={styles.toggleContainer}>
  {['daily', 'weekly', 'monthly'].map(mode => (
    <Pressable
      key={mode}
      style={[
        styles.toggleButton,
        viewMode === mode && { backgroundColor: colors.primary },
      ]}
      onPress={() => setViewMode(mode as any)}
    >
      <Text style={{
        color: viewMode === mode ? 'white' : colors.primary,
        fontWeight: '600'
      }}>
        {mode.charAt(0).toUpperCase() + mode.slice(1)}
      </Text>
    </Pressable>
  ))}
</View>


        {average !== 'N/A' && (
          <FancyCard title={`${viewMode[0].toUpperCase() + viewMode.slice(1)} Trends`} icon="chart-line">
            <Text style={styles.summaryText}>
              Avg of {moodData.length} {viewMode} entries: {avgNum > 0 ? '+' : ''}{average} — {moodLabel}
            </Text>
          </FancyCard>

        )}

      {validData && dataPoints.length > 0 ? (
        <View style={styles.chartWrapper}>
          <FancyCard title="Mood Chart" icon="chart-bell-curve" style={{ marginTop: 16 }}>
            <Animated.View entering={FadeIn.duration(600)}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ padding: 10, borderRadius: 16, backgroundColor: '#f0f4ff' }}>
                  <LineChart
                    data={{
                      labels: labels.map((label, i) =>
                        viewMode === 'monthly' ? label : i % 3 === 0 ? label : ''
                      ),
                      datasets: [{ data: dataPoints }],
                    }}
                    width={Math.max(labels.length * 50, Dimensions.get('window').width)}
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
                    style={{ borderRadius: 16 }}
                  />
                </View>
              </ScrollView>
            </Animated.View>
          </FancyCard>
        </View>
      ) : (
        <Text style={{ marginVertical: 20 }}>No valid mood data available yet.</Text>
      )}

        <FancyCard title="Export & Share" icon="file-export" style={{ marginTop: 20 }}>
          <Pressable onPress={() => exportMoodDataAsCSV(moodData)}>
            <Text style={{ color: colors.primary, fontWeight: '600', textDecorationLine: 'underline' }}>
              Export CSV Report
            </Text>
          </Pressable>
        </FancyCard>

      <Modal isVisible={isInfoVisible} onBackdropPress={() => setInfoVisible(false)}>
        <View style={{ backgroundColor: 'white', padding: 20, borderRadius: 10 }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 6 }}>
            What do these trends mean?
          </Text>
          <Text style={{ fontSize: 14, marginBottom: 10 }}>
            {viewMode === 'daily' &&
              'This shows your average mood score for each day you logged a mood. The summary reflects the average of all those daily scores.'}
            {viewMode === 'weekly' &&
              'This groups mood entries by calendar week (Sunday to Saturday), helping you spot weekly emotional patterns.'}
            {viewMode === 'monthly' &&
              'This aggregates your mood scores for each calendar month, showing broader mood trends over time.'}
          </Text>
          <Button title="Got it" onPress={() => setInfoVisible(false)} />
        </View>
      </Modal>
    </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
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
  toggleButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
  },
  summaryBox: {
    backgroundColor: '#f0f4ff',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    width: '100%',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  summaryText: {
    fontSize: 15,
  },
  chartWrapper: {
    width: '100%',
    marginTop: 16,
  }
  
});

export default MoodAnalytics;

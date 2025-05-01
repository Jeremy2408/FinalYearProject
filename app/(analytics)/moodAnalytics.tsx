import React, { useState } from 'react';
import { View, Text, Dimensions, StyleSheet, Pressable, Button, Alert, TouchableOpacity } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWeeklyMoodData, useMonthlyMoodData, useDailyMoodData } from '../hooks/useMoodData';
import { router } from 'expo-router';
import * as Print from 'expo-print';
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
import ViewShot from 'react-native-view-shot';
import { captureRef } from 'react-native-view-shot';
import { Image } from 'react-native';
import { useRef } from 'react';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getAuth } from 'firebase/auth';
import { IconButton } from 'react-native-paper';




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

const exportMoodDataAsPDF = async (moodData: { label: string, score: number }[], chartRef: React.RefObject<ViewShot>) => {
  try {
    const average = moodData.length
      ? (moodData.reduce((sum, val) => sum + val.score, 0) / moodData.length).toFixed(2)
      : 'N/A';

    const avgNum = parseFloat(average);
    let moodLabel = 'Neutral';
    if (!isNaN(avgNum)) {
      if (avgNum > 0.2) moodLabel = 'Mostly Positive';
      else if (avgNum < -0.2) moodLabel = 'Mostly Negative';
    }

    const uri = await captureRef(chartRef, {
      format: 'png',
      quality: 1,
    });
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const chartImgTag = `<img src="data:image/png;base64,${base64}" style="width:100%;height:auto;" />`;

    const html = `
      <html>
        <head>
          <style>
            body { font-family: 'Helvetica', sans-serif; padding: 20px; }
            h1 { color: #4A90E2; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: center; }
            th { background-color: #f2f2f2; }
            .summary-box {
              padding: 10px;
              border-radius: 8px;
              background: #f0f4ff;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <h1>Mood Report</h1>
          <div class="summary-box">
            <p><strong>Entries:</strong> ${moodData.length}</p>
            <p><strong>Average Score:</strong> ${average}</p>
            <p><strong>Overall Mood:</strong> ${moodLabel}</p>
          </div>
          ${chartImgTag}
          <h2>Mood Entries</h2>
          <table>
            <tr><th>Date</th><th>Sentiment Score</th></tr>
            ${moodData.map(item => `
              <tr>
                <td>${item.label}</td>
                <td>${item.score}</td>
              </tr>`).join('')}
          </table>
        </body>
      </html>
    `;

    const { uri: pdfUri } = await Print.printToFileAsync({ html });

    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    const storage = getStorage();
    const response = await fetch(pdfUri);
    const blob = await response.blob();

    const filename = `mood-report-${Date.now()}.pdf`;
    const storageRef = ref(storage, `mood_reports/${user.uid}/${filename}`);
    await uploadBytes(storageRef, blob);
    const downloadURL = await getDownloadURL(storageRef);

    Alert.alert(" Report Saved", `PDF uploaded to Firebase.\n\nURL:\n${downloadURL}`);

    const available = await Sharing.isAvailableAsync();
    if (available) {
      await Sharing.shareAsync(pdfUri);
    } else {
      alert('Sharing not available on this device.');
    }
  } catch (error) {
    console.error("PDF Export failed:", error);
    alert("Something went wrong while creating your report.");
  }
};


const MoodAnalytics = () => {
  const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'monthly'>('weekly');

  const dailyData = useDailyMoodData();
  const weeklyData = useWeeklyMoodData();
  const monthlyData = useMonthlyMoodData();
  const [isInfoVisible, setInfoVisible] = useState(false);
  const chartRef = useRef<ViewShot>(null);
  const [optionsVisible, setOptionsVisible] = useState(false);


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
    <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 16 }}>

    <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
          <BackButton />
          <IconButton icon="dots-vertical" size={28} iconColor="#007AFF" onPress={() => setOptionsVisible(true)} />
        </View>

        <Modal
          isVisible={optionsVisible}
          animationIn="fadeIn"
          onBackdropPress={() => setOptionsVisible(false)}
        >
          <TouchableOpacity
            style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.3)' }}
            onPress={() => setOptionsVisible(false)}
            activeOpacity={1}
          >
            <View style={{ backgroundColor: '#fff', paddingVertical: 16, borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
              <Pressable onPress={() => { setOptionsVisible(false); router.push('/SavedReportsScreen'); }} style={{ padding: 16 }}>
                <Text style={{ fontSize: 16, fontWeight: '500' }}>View Saved Reports</Text>
              </Pressable>
            </View>
          </TouchableOpacity>
        </Modal>

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
              <ViewShot ref={chartRef} options={{ format: 'png', quality: 1.0 }}>
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
              </ViewShot>
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
          <Pressable onPress={() => exportMoodDataAsPDF(moodData, chartRef)}>
            <Text style={{ color: colors.primary, fontWeight: '600', textDecorationLine: 'underline', marginTop: 8 }}>
              Export PDF Report (with Chart)
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
    </ScrollView>
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

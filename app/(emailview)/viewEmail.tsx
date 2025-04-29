import { View, Text, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import RenderHtml from 'react-native-render-html';
import BackButton from '@/components/BackButton';
import { SafeAreaView } from 'react-native-safe-area-context';



const ViewEmail = () => {
  const { subject, from, body, date } = useLocalSearchParams();
  const { width } = useWindowDimensions();

  return (
    <SafeAreaView style={styles.safeArea}>
      <BackButton />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.subject}>{subject || "(No Subject)"}</Text>
        <Text style={styles.meta}>From: {from}</Text>
        <Text style={styles.meta}>
          Date: {date && typeof date === 'string' ? new Date(date).toLocaleString() : "(Invalid Date)"}
        </Text>

        <RenderHtml
          contentWidth={width}
          source={{ html: Array.isArray(body) ? body.join('') : body || "<p>No content</p>" }}
          baseStyle={styles.body}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

export default ViewEmail;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    padding: 16,
  },
  subject: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  meta: {
    color: '#555',
    marginBottom: 5,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    marginTop: 12,
  },
});

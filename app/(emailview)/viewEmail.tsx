import { View, Text, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import RenderHtml from 'react-native-render-html';
import BackButton from '@/components/BackButton';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import colors from '@/colors';

const ViewEmail = () => {
  const { subject, from, body, date } = useLocalSearchParams();
  const { width } = useWindowDimensions();

  return (
   <LinearGradient
      colors={[colors.gradientStart, colors.gradientEnd]}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={styles.safeArea}>
        <BackButton />
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
          <Text style={styles.subject}>{subject || "(No Subject)"}</Text>
          <Text style={styles.meta}>From: {from}</Text>
          <Text style={styles.meta}>
            Date: {date && typeof date === 'string' ? new Date(date).toLocaleString() : "(Invalid Date)"}
          </Text>

          <ScrollView horizontal>
            <RenderHtml
              contentWidth={width}
              source={{ html: Array.isArray(body) ? body.join('') : body || "<p>No content</p>" }}
              baseStyle={styles.body}
            />
          </ScrollView>
        </ScrollView>

    </SafeAreaView>
   </LinearGradient>
  );
};

export default ViewEmail;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
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
    marginBottom: 5,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    marginTop: 12,
  },
});

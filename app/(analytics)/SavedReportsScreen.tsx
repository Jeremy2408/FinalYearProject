import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { getStorage, ref, listAll, getDownloadURL, getMetadata, deleteObject } from 'firebase/storage';
import { getAuth } from 'firebase/auth';
import * as Linking from 'expo-linking';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackButton from '../../components/BackButton';
import colors from '@/colors';
import { LinearGradient } from 'expo-linear-gradient';
import FancyCard from '@/components/FancyCard';

const SavedReportsScreen = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      const storage = getStorage();
      const reportsRef = ref(storage, `mood_reports/${user.uid}`);
      const res = await listAll(reportsRef);

      const files = await Promise.all(
        res.items.map(async (itemRef) => {
          const url = await getDownloadURL(itemRef);
          const metadata = await getMetadata(itemRef);
          const uploadedAt = metadata.timeCreated;
          return {
            name: itemRef.name,
            url,
            fullPath: itemRef.fullPath,
            uploadedAt,
          };
        })
      );

      setReports(files);
    } catch (err) {
      console.error('Failed to fetch reports:', err);
      Alert.alert('Error', 'Could not load reports');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (report: any) => {
    Alert.alert('Delete Report', `Are you sure you want to delete ${report.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            const storage = getStorage();
            const fileRef = ref(storage, report.fullPath);
            await deleteObject(fileRef);
            fetchReports();
          } catch (err) {
            console.error('Delete failed:', err);
            Alert.alert('Error', 'Could not delete file');
          }
        }
      }
    ]);
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString();
  };

  return (
    <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <BackButton />
        <Text style={styles.title}>Saved Mood Reports</Text>
        {loading ? (
          <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 30 }} />
        ) : reports.length === 0 ? (
          <Text style={styles.empty}>No reports found.</Text>
        ) : (
          <FlatList
            data={reports}
            keyExtractor={(item) => item.name}
            contentContainerStyle={{ paddingBottom: 20 }}
            renderItem={({ item }) => (
              <FancyCard title={item.name} icon="file-document-outline" style={{ marginBottom: 12 }}>
                <Text style={styles.meta}>Uploaded: {formatDate(item.uploadedAt)}</Text>
                <View style={styles.actions}>
                  <TouchableOpacity onPress={() => Linking.openURL(item.url)}>
                    <Text style={styles.actionText}>Open</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(item)}>
                    <Text style={[styles.actionText, { color: '#B00020' }]}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </FancyCard>
            )}
          />
        )}
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginVertical: 12,
    color: '#004080',
  },
  empty: {
    fontSize: 16,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 30,
  },
  meta: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionText: {
    fontSize: 15,
    color: '#007AFF',
    fontWeight: '500',
  },
});

export default SavedReportsScreen;
 
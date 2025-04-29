import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Pressable, Modal, ScrollView } from 'react-native';
import Slider from '@react-native-community/slider';
import TrackPlayer, { State, usePlaybackState, useProgress, Capability, Event } from 'react-native-track-player';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { getFirestore, collection, addDoc, getDocs, deleteDoc } from 'firebase/firestore';
import * as DocumentPicker from 'expo-document-picker';
import { auth } from '@/FirebaseConfig';
import BackButton from '../../components/BackButton';
import { Provider } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
const appLogo = require('../../assets/images/appLogo.png');

const defaultPlaylist = [
  {
    title: 'Chopin Nocturne op.9 no.2',
    url: 'https://orangefreesounds.com/wp-content/uploads/2016/02/Chopin-nocturne-op-9-no-2.mp3',
  },
  {
    title: 'Meditation Music Free',
    url: 'https://orangefreesounds.com/wp-content/uploads/2016/02/Meditation-music-free.mp3',
  },
  {
    title: 'Free Calming Music',
    url: 'https://orangefreesounds.com/wp-content/uploads/2023/03/Free-calming-music.mp3',
  },
  {
    title: 'Relaxing White Noise',
    url: 'https://orangefreesounds.com/wp-content/uploads/2017/03/Relaxing-white-noise.mp3',
  },
  {
    title: 'Meditative Ambience',
    url: 'https://orangefreesounds.com/wp-content/uploads/2019/10/Meditative-ambience.mp3',
  },
  {
    title: 'Relaxing Thinking Music',
    url: 'https://orangefreesounds.com/wp-content/uploads/2023/03/Relaxing-thinking-music.mp3',
  },
  {
    title: 'Calming Background Music',
    url: 'https://orangefreesounds.com/wp-content/uploads/2024/10/Calming-background-music.mp3',
  },
  {
    title: 'Gentle Harp Music',
    url: 'https://orangefreesounds.com/wp-content/uploads/2024/02/Gentle-harp-music.mp3',
  },
  {
    title: 'Relaxing Instrumental Piano Music',
    url: 'https://orangefreesounds.com/wp-content/uploads/2024/06/Relaxing-instrumental-piano-music.mp3',
  },
  {
    title: 'Melody Of Piano And Strings',
    url: 'https://orangefreesounds.com/wp-content/uploads/2024/02/Melody-of-piano-and-strings.mp3',
  },
  {
    title: 'Relaxing Music For Stress Relief',
    url: 'https://orangefreesounds.com/wp-content/uploads/2025/03/Relaxing-music-for-stress-relief.mp3',
  },
];

const formatMillis = (ms: number) => {
  const totalSeconds = Math.floor(ms);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const RelaxPlaylistScreen = () => {
  const [playlist, setPlaylist] = useState(defaultPlaylist);
  const [currentTrack, setCurrentTrack] = useState(defaultPlaylist[0]);
  const [isShuffle, setIsShuffle] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const playbackState = usePlaybackState();
  const progress = useProgress();
  const isPlaying = playbackState?.state === State.Playing;

  const db = getFirestore();
  const storage = getStorage();

  const loadUserTracks = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const userTracksRef = collection(db, `users/${user.uid}/playlist_tracks`);
    const snapshot = await getDocs(userTracksRef);

    const userTracks = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: data.uri,
        url: data.uri,
        title: data.title || '',
        artist: 'Relaxation',
        artwork: appLogo,
      };
    });

    const defaultTracks = defaultPlaylist.map((track) => ({
      ...track,
      id: track.url,
      artist: 'Relaxation',
      artwork: appLogo,
    }));

    const combined = [...userTracks, ...defaultTracks];
    setPlaylist(combined);

    const currentQueue = await TrackPlayer.getQueue();
    if (currentQueue.length === 0) {
      await TrackPlayer.add(combined);
      setCurrentTrack(combined[0]);
    } else {
      const index = await TrackPlayer.getCurrentTrack();
      const queue = await TrackPlayer.getQueue();
      if (index !== null) {
        const track = queue[index];
        setCurrentTrack({
          title: track.title || 'Unknown Title',
          url: track.url || '',
        });
      }
    }
  };

  const playTrack = async (track: { title: string; url: string }) => {
    const index = playlist.findIndex((t) => t.url === track.url);
    if (index !== -1) {
      await TrackPlayer.skip(index);
      await TrackPlayer.play();
      setCurrentTrack(playlist[index]);
    }
  };

  const togglePlayPause = async () => {
    if (isPlaying) {
      await TrackPlayer.pause();
    } else {
      await TrackPlayer.play();
    }
  };

  const skipForward = async () => {
    try {
      if (isShuffle) {
        const queue = await TrackPlayer.getQueue();
        const currentIndex = await TrackPlayer.getCurrentTrack();

        const otherIndices = queue
          .map((_, i) => i)
          .filter((i) => i !== currentIndex);

        if (otherIndices.length > 0) {
          const randomIndex = otherIndices[Math.floor(Math.random() * otherIndices.length)];
          await TrackPlayer.skip(randomIndex);
        }
      } else {
        await TrackPlayer.skipToNext();
      }

      await TrackPlayer.play();
      const index = await TrackPlayer.getCurrentTrack();
      const queue = await TrackPlayer.getQueue();
      if (index !== null && queue[index]) {
        const track = queue[index];
        setCurrentTrack({
          title: track.title || 'Unknown Title',
          url: track.url || '',
        });
      }
    } catch (err) {
      console.warn('No next track:', err);
    }
  };

  const skipBackward = async () => {
    try {
      await TrackPlayer.skipToPrevious();
      await TrackPlayer.play();
      const index = await TrackPlayer.getCurrentTrack();
      const queue = await TrackPlayer.getQueue();
      if (index !== null && queue[index]) {
        const track = queue[index];
        setCurrentTrack({
          title: track.title || 'Unknown Title',
          url: track.url || '',
        });
      }
    } catch (err) {
      console.warn('No previous track:', err);
    }
  };

  const uploadTrack = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'audio/mpeg' });
      if (result.canceled || !result.assets?.[0]) return;

      const file = result.assets[0];
      const user = auth.currentUser;
      if (!user) return;

      const response = await fetch(file.uri);
      const blob = await response.blob();

      const storageRef = ref(storage, `user_uploads/${user.uid}/${file.name}`);
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);

      const alreadyExists = playlist.some((t) => t.url === downloadURL);
      if (alreadyExists) return;

      await addDoc(collection(db, `users/${user.uid}/playlist_tracks`), {
        title: file.name.replace(/\.[^/.]+$/, ''),
        uri: downloadURL,
        timestamp: new Date(),
      });

      loadUserTracks();
    } catch (error) {
      console.error('Upload failed', error);
      Alert.alert('Error', 'Failed to upload audio file.');
    }
  };

  const handleDeleteTrack = async (track: { title: string; url: string }) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const tracksRef = collection(db, `users/${user.uid}/playlist_tracks`);
      const snapshot = await getDocs(tracksRef);
      const match = snapshot.docs.find((doc) => doc.data().uri === track.url);

      if (match) {
        await deleteDoc(match.ref);
        console.log('Deleted Firestore entry');
      } else {
        console.warn('No matching Firestore doc found');
      }

      const urlPath = decodeURIComponent(track.url);
      const pathMatch = urlPath.match(/\/o\/(.*?)\?/);
      const filePath = pathMatch ? pathMatch[1] : null;

      if (filePath) {
        const storageRef = ref(storage, filePath);
        await deleteObject(storageRef);
        Alert.alert('Success', 'Track deleted successfully.');
        console.log('Deleted from Storage');
      } else {
        console.warn('Could not parse file path from URL');
      }

      await loadUserTracks();
    } catch (error) {
      console.error('Delete failed', error);
      Alert.alert('Error', 'Failed to delete track.');
    }
  };

  useEffect(() => {
    const setupPlayer = async () => {
      await TrackPlayer.setupPlayer();
      await TrackPlayer.updateOptions({
        capabilities: [
          Capability.Play,
          Capability.Pause,
          Capability.SkipToNext,
          Capability.SkipToPrevious,
          Capability.SeekTo,
        ],
        compactCapabilities: [Capability.Play, Capability.Pause],
      });
    };

    setupPlayer();
    loadUserTracks();
  }, []);

  useEffect(() => {
    const listener = TrackPlayer.addEventListener(Event.PlaybackTrackChanged, async ({ nextTrack }) => {
      if (nextTrack != null) {
        const queue = await TrackPlayer.getQueue();
        const next = queue[nextTrack];
        if (next?.title && next?.url) {
          setCurrentTrack({ title: next.title, url: next.url });
        }
      }
    });

    return () => {
      listener.remove();
    };
  }, []);

  return (
    <Provider>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.headerRow}>
          <BackButton />
          <TouchableOpacity onPress={() => setMenuVisible(true)}>
            <MaterialIcons name="more-vert" size={28} color="#007AFF" />
          </TouchableOpacity>
        </View>

        <Modal visible={menuVisible} animationType="fade" transparent onRequestClose={() => setMenuVisible(false)}>
          <TouchableOpacity style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.3)' }} onPress={() => setMenuVisible(false)} activeOpacity={1}>
            <View style={{ backgroundColor: '#fff', paddingVertical: 16, borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
              <Pressable onPress={() => { setShowPlaylistModal(true); setMenuVisible(false); }} style={{ padding: 16 }}>
                <Text style={{ fontSize: 16, fontWeight: '500' }}>Your Playlist</Text>
              </Pressable>
              <Pressable onPress={() => { setIsShuffle((prev) => !prev); setMenuVisible(false); }} style={{ padding: 16 }}>
                <Text style={{ fontSize: 16, fontWeight: '500' }}>{isShuffle ? 'Disable Shuffle' : 'Enable Shuffle'}</Text>
              </Pressable>
            </View>
          </TouchableOpacity>
        </Modal>

        <Modal
          visible={showPlaylistModal}
          animationType="slide"
          transparent
          onRequestClose={() => setShowPlaylistModal(false)}
        >
          <TouchableOpacity
            style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.3)' }}
            activeOpacity={1}
            onPressOut={() => setShowPlaylistModal(false)}
          >
            <View
              style={{
                maxHeight: '50%',
                backgroundColor: '#fff',
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
                padding: 16,
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>
                Your Playlist
              </Text>

              <ScrollView>
                {playlist.map((track, index) => {
                  const isDefault = defaultPlaylist.some(
                    (defaultTrack) => defaultTrack.url === track.url
                  );
                  return (
                    <View
                      key={index}
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingVertical: 12,
                        borderBottomWidth: 1,
                        borderBottomColor: '#eee',
                      }}
                    >
                      <TouchableOpacity
                        onPress={async () => {
                          await playTrack(track);
                          setShowPlaylistModal(false);
                        }}
                        style={{ flex: 1 }}
                      >
                        <Text style={{ fontSize: 16 }}>{track.title}</Text>
                      </TouchableOpacity>
                      {!isDefault && (
                        <TouchableOpacity
                          onPress={() => handleDeleteTrack(track)}
                          style={{ paddingHorizontal: 10 }}
                        >
                          <MaterialIcons name="delete" size={22} color="#B00020" />
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>

        <View style={styles.container}>
          <Text style={styles.title}>Relaxing Playlist</Text>
          <Text style={styles.subtitle}>Now playing:</Text>
          <Text style={styles.trackName}>{currentTrack.title}</Text>

          {isShuffle && (
            <Text style={{ fontSize: 14, fontStyle: 'italic', color: '#007AFF' }}>Shuffle mode is ON</Text>
          )}

          <View style={styles.controlsRow}>
            <TouchableOpacity style={styles.iconButton} onPress={skipBackward}>
              <Text style={styles.iconText}>⏮️</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.playButton} onPress={togglePlayPause}>
              <Text style={styles.playText}>{isPlaying ? '⏸️ Pause' : '▶️ Play'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={skipForward}>
              <Text style={styles.iconText}>⏭️</Text>
            </TouchableOpacity>
          </View>

          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={progress.duration}
            value={progress.position}
            onSlidingComplete={async (value) => await TrackPlayer.seekTo(value)}
            minimumTrackTintColor="#007AFF"
            maximumTrackTintColor="#ccc"
            thumbTintColor="#007AFF"
          />

          <Text style={styles.timeText}>
            {formatMillis(progress.position)} / {formatMillis(progress.duration)}
          </Text>

          <TouchableOpacity style={styles.uploadButton} onPress={uploadTrack}>
            <Text style={styles.uploadText}>+ Upload Your Own Track</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Provider>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f3faff',
  },
  container: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuContainer: {
    alignSelf: 'flex-end',
    top: 16,
    right: 16,
    zIndex: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#004080',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  trackName: {
    fontSize: 20,
    color: '#333',
    fontWeight: '600',
    marginVertical: 12,
    textAlign: 'center',
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    gap: 16,
  },
  iconButton: {
    backgroundColor: '#d0e3ff',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
  },
  iconText: {
    fontSize: 20,
  },
  playButton: {
    backgroundColor: '#d0e3ff',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  playText: {
    color: 'black',
    fontWeight: '600',
    fontSize: 16,
  },
  uploadButton: {
    marginTop: 32,
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#e0f0ff',
  },
  slider: {
    width: '90%',
    height: 40,
    marginTop: 24,
  },
  timeText: {
    fontSize: 14,
    color: '#444',
    marginBottom: 12,
  },
  uploadText: {
    fontSize: 16,
    color: '#004080',
    fontWeight: '500',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    marginTop: 10,
  },
});

export default RelaxPlaylistScreen;
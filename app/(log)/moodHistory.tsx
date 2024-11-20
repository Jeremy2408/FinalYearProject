import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const MoodHistory = () => {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Mood History</Text>
            {}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 24,
        marginBottom: 16,
    },
});

export default MoodHistory;
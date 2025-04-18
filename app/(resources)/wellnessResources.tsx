import { router } from 'expo-router';
import React from 'react';
import { ScrollView, View, StyleSheet, Linking, Pressable, Text } from 'react-native';
import { Card, Title, Paragraph, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

const resources = [
  {
    title: 'Counselling Service',
    description: 'Free and confidential one-on-one support, emergency help, and online CBT tools.',
    url: 'https://www.tudublin.ie/for-students/student-services-and-support/student-wellbeing/counselling-service/',
  },
  {
    title: 'Disability Support Service',
    description: 'Support for students with disabilities to help you succeed at TU Dublin.',
    url: 'https://www.tudublin.ie/for-students/student-services-and-support/student-wellbeing/disability-support-service/about/',
  },
  {
    title: 'Financial Support',
    description: 'Help with managing money and accessing the Student Assistance Fund.',
    url: 'https://www.tudublin.ie/for-students/student-services-and-support/financial-support/',
  },
  {
    title: 'Pastoral Care & Chaplaincy',
    description: 'Support for your personal and spiritual wellbeing throughout your studies.',
    url: 'https://www.tudublin.ie/for-students/student-services-and-support/student-wellbeing/pastoral-care-chaplaincy/',
  },
  {
    title: 'Student Health Centres',
    description: 'On-campus healthcare for physical, psychological, and emotional wellbeing.',
    url: 'https://www.tudublin.ie/for-students/student-services-and-support/student-wellbeing/student-health-centres/',
  },
];

const WellnessResources = () => {
  const handleOpenLink = (url: string) => {
    Linking.openURL(url);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
        <Pressable onPress={() => router.back()}><Text>Go Back</Text></Pressable>
      
      <ScrollView contentContainerStyle={styles.container}>
        {resources.map((item, index) => (
          <Card key={index} style={styles.card}>
            <Card.Content>
              <Title style={styles.title}>{item.title}</Title>
              <Paragraph>{item.description}</Paragraph>
            </Card.Content>
            <Card.Actions>
              <Button onPress={() => handleOpenLink(item.url)}>Learn More</Button>
            </Card.Actions>
          </Card>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
    backgroundColor: '#f9f9f9',
  },
  title: {
    fontWeight: 'bold',
    color: '#004080',
  },
});

export default WellnessResources;
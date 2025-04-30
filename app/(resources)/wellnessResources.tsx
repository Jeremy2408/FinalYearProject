import React from 'react';
import { ScrollView, View, StyleSheet, Linking } from 'react-native';
import { Card, Paragraph, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackButton from '../../components/BackButton';
import { LinearGradient } from 'expo-linear-gradient';
import colors from '@/colors';

type ResourceItem = {
  title: string;
  description: string;
  url: string;
};

const resources: ResourceItem[] = [
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
    <LinearGradient
    colors={[colors.gradientStart, colors.gradientEnd]}
    style={{ flex: 1 }}
  >
    <SafeAreaView style={styles.safeArea}>
      <BackButton />
      <ScrollView contentContainerStyle={styles.container}>
        {resources.map((item, index) => (
          <Card key={index} style={styles.card}>
            <Card.Content>
              <Paragraph style={styles.title}>{item.title}</Paragraph>
              <Paragraph style={styles.description}>{item.description}</Paragraph>
            </Card.Content>
            <Card.Actions>
              <Button onPress={() => handleOpenLink(item.url)}>Learn More</Button>
            </Card.Actions>
          </Card>
        ))}
      </ScrollView>
    </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
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
    fontSize: 16,
    marginBottom: 4,
  },
  description: {
    color: '#4A4A4A',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
});

export default WellnessResources;

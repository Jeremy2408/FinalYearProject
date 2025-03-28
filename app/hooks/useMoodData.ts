import { useEffect, useState } from 'react';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { FIREBASE_APP } from '@/FirebaseConfig';
import { getAuth } from 'firebase/auth';

interface MoodEntry {
  timestamp: { seconds: number };
  numericSentimentScore: number;
}

export const useDailyMoodData = () => {
  const [dailyData, setDailyData] = useState<{ label: string; score: number }[]>([]);

  useEffect(() => {
    const fetchMoodData = async () => {
      const auth = getAuth(FIREBASE_APP);
      const user = auth.currentUser;
      if (!user) return;

      const db = getFirestore(FIREBASE_APP);
      const moodRef = collection(db, `users/${user.uid}/moods`);
      const snapshot = await getDocs(moodRef);

      const dayMap: Record<string, number[]> = {};

      snapshot.docs.forEach((doc) => {
        const entry = doc.data() as MoodEntry;
        const score = Number(entry.numericSentimentScore);
        if (isNaN(score)) return;

        const date = new Date(entry.timestamp.seconds * 1000);
        const dayKey = date.toLocaleDateString();

        if (!dayMap[dayKey]) {
          dayMap[dayKey] = [];
        }

        dayMap[dayKey].push(score);
      });

      const result = Object.entries(dayMap).map(([day, scores]) => ({
        label: day,
        score: parseFloat((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2)),
      }));

      result.sort((a, b) => new Date(a.label).getTime() - new Date(b.label).getTime());

      setDailyData(result);
    };

    fetchMoodData();
  }, []);

  return dailyData;
};

export const useWeeklyMoodData = () => {
  const [weeklyData, setWeeklyData] = useState<{ label: string; score: number }[]>([]);

  useEffect(() => {
    const fetchMoodData = async () => {
      const auth = getAuth(FIREBASE_APP);
      const user = auth.currentUser;
      if (!user) return;

      const db = getFirestore(FIREBASE_APP);
      const moodRef = collection(db, `users/${user.uid}/moods`);
      const snapshot = await getDocs(moodRef);

      const weekMap: Record<string, number[]> = {};

      snapshot.docs.forEach((doc) => {
        const entry = doc.data() as MoodEntry;
        const score = Number(entry.numericSentimentScore);
        if (isNaN(score)) return;

        const date = new Date(entry.timestamp.seconds * 1000);
        const weekKey = `${date.getFullYear()}-W${getWeekNumber(date)}`;

        if (!weekMap[weekKey]) {
          weekMap[weekKey] = [];
        }

        weekMap[weekKey].push(score);
      });

      const result = Object.entries(weekMap).map(([week, scores]) => ({
        label: week,
        score: parseFloat((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2)),
      }));

      result.sort((a, b) => new Date(a.label).getTime() - new Date(b.label).getTime());

      setWeeklyData(result);
    };

    fetchMoodData();
  }, []);

  return weeklyData;
};

export const useMonthlyMoodData = () => {
  const [monthlyData, setMonthlyData] = useState<{ label: string; score: number }[]>([]);

  useEffect(() => {
    const fetchMoodData = async () => {
      const auth = getAuth(FIREBASE_APP);
      const user = auth.currentUser;
      if (!user) return;

      const db = getFirestore(FIREBASE_APP);
      const moodRef = collection(db, `users/${user.uid}/moods`);
      const snapshot = await getDocs(moodRef);

      const monthMap: Record<string, number[]> = {};

      snapshot.docs.forEach((doc) => {
        const entry = doc.data() as MoodEntry;
        const score = Number(entry.numericSentimentScore);
        if (isNaN(score)) return;

        const date = new Date(entry.timestamp.seconds * 1000);
        const monthKey = date.toLocaleString('default', { month: 'short', year: 'numeric' });

        if (!monthMap[monthKey]) {
          monthMap[monthKey] = [];
        }

        monthMap[monthKey].push(score);
      });

      const result = Object.entries(monthMap).map(([month, scores]) => ({
        label: month,
        score: parseFloat((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2)),
      }));

      result.sort((a, b) => new Date(a.label).getTime() - new Date(b.label).getTime());

      setMonthlyData(result);
    };

    fetchMoodData();
  }, []);

  return monthlyData;
};

function getWeekNumber(date: Date) {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}
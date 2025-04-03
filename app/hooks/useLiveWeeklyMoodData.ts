import { useEffect, useState } from 'react';
import { getFirestore,collection,query,where,onSnapshot, orderBy,} from 'firebase/firestore';
import { auth } from '@/FirebaseConfig';

interface MoodData {
  emotion: string;
  score: number;
  timestamp: Date;
}

const useLiveWeeklyMoodData = () => {
  const [data, setData] = useState<MoodData[]>([]);
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;

    const db = getFirestore();
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const moodsRef = collection(db, `users/${user.uid}/moods`);
    const q = query(
      moodsRef,
      where('timestamp', '>=', oneWeekAgo),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const moodData: MoodData[] = snapshot.docs
        .map((doc) => {
          const data = doc.data();
          return {
            emotion: data.emotion,
            score: data.numericSentimentScore ?? data.score, 
            timestamp:
              data.timestamp?.toDate?.() ||
              new Date(data.timestamp.seconds * 1000),
          } as MoodData;
        })
        .filter(
          (item) =>
            item.emotion &&
            typeof item.score === 'number' &&
            item.timestamp instanceof Date
        );

      setData(moodData);
    });

    return () => unsubscribe();
  }, [user]);

  return data;
};

export default useLiveWeeklyMoodData;

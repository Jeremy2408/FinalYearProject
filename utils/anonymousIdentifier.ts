import { getAuth } from 'firebase/auth';

export const getAnonymousIdentifier = (): string => {
  const auth = getAuth();
  const currentUser = auth.currentUser;

  if (!currentUser) {
    throw new Error('No user is signed in');
  }

  const anonymousId = `User${currentUser.uid.substring(0, 6)}`;
  return anonymousId;
};


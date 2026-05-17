import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type ProfileId = '1' | '2';

export const PROFILES = [
  { id: '1' as const, label: 'Профиль 1', company: 'ООО «Первый»' },
  { id: '2' as const, label: 'Профиль 2', company: 'ООО «Второй»' },
] as const;

type ProfileContextValue = {
  profileId: ProfileId;
  setProfileId: (id: ProfileId) => void;
  activeProfile: (typeof PROFILES)[number];
  showReferralInviteCreationBanner: boolean;
  pendingReferralCreationNav: boolean;
  beginReferralCreationFlow: () => void;
  consumeReferralCreationNav: () => void;
  dismissReferralInviteCreationBanner: () => void;
};

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profileId, setProfileId] = useState<ProfileId>('1');
  const [showReferralInviteCreationBanner, setShowReferralInviteCreationBanner] = useState(false);
  const [pendingReferralCreationNav, setPendingReferralCreationNav] = useState(false);

  const beginReferralCreationFlow = useCallback(() => {
    setShowReferralInviteCreationBanner(true);
    setPendingReferralCreationNav(true);
  }, []);

  const consumeReferralCreationNav = useCallback(() => {
    setPendingReferralCreationNav(false);
  }, []);

  const dismissReferralInviteCreationBanner = useCallback(() => {
    setShowReferralInviteCreationBanner(false);
  }, []);

  useEffect(() => {
    if (profileId !== '2') {
      setShowReferralInviteCreationBanner(false);
      setPendingReferralCreationNav(false);
    }
  }, [profileId]);

  const value = useMemo(() => {
    const activeProfile = PROFILES.find((p) => p.id === profileId) ?? PROFILES[0];
    return {
      profileId,
      setProfileId,
      activeProfile,
      showReferralInviteCreationBanner,
      pendingReferralCreationNav,
      beginReferralCreationFlow,
      consumeReferralCreationNav,
      dismissReferralInviteCreationBanner,
    };
  }, [
    profileId,
    showReferralInviteCreationBanner,
    pendingReferralCreationNav,
    beginReferralCreationFlow,
    consumeReferralCreationNav,
    dismissReferralInviteCreationBanner,
  ]);

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used within ProfileProvider');
  return ctx;
}

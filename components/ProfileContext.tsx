import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type ProfileId = '1' | '2';

/** Товар, подставляемый на странице создания одной кампании после «Повторить». */
export type SingleCampaignSeedProduct = {
  nmId: number;
  productName: string;
  imageUrl: string;
  category: string;
  cpcCompatible?: boolean;
};

export type RepeatLaunchPreset = {
  product: SingleCampaignSeedProduct;
  campaignName?: string;
};

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
  pendingSingleCampaignNav: boolean;
  singleCampaignSeed: RepeatLaunchPreset | null;
  beginRepeatLaunchFlow: (preset: RepeatLaunchPreset) => void;
  consumeSingleCampaignNav: () => void;
  clearSingleCampaignSeed: () => void;
};

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profileId, setProfileId] = useState<ProfileId>('1');
  const [showReferralInviteCreationBanner, setShowReferralInviteCreationBanner] = useState(false);
  const [pendingReferralCreationNav, setPendingReferralCreationNav] = useState(false);
  const [pendingSingleCampaignNav, setPendingSingleCampaignNav] = useState(false);
  const [singleCampaignSeed, setSingleCampaignSeed] = useState<RepeatLaunchPreset | null>(null);

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

  const beginRepeatLaunchFlow = useCallback((preset: RepeatLaunchPreset) => {
    setSingleCampaignSeed(preset);
    setPendingSingleCampaignNav(true);
  }, []);

  const consumeSingleCampaignNav = useCallback(() => {
    setPendingSingleCampaignNav(false);
  }, []);

  const clearSingleCampaignSeed = useCallback(() => {
    setSingleCampaignSeed(null);
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
      pendingSingleCampaignNav,
      singleCampaignSeed,
      beginRepeatLaunchFlow,
      consumeSingleCampaignNav,
      clearSingleCampaignSeed,
    };
  }, [
    profileId,
    showReferralInviteCreationBanner,
    pendingReferralCreationNav,
    pendingSingleCampaignNav,
    singleCampaignSeed,
    beginReferralCreationFlow,
    consumeReferralCreationNav,
    dismissReferralInviteCreationBanner,
    beginRepeatLaunchFlow,
    consumeSingleCampaignNav,
    clearSingleCampaignSeed,
  ]);

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used within ProfileProvider');
  return ctx;
}

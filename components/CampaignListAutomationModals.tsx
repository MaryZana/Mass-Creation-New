import React, { useCallback, useEffect, useState } from 'react';
import { DAILY_LIMIT_ABSOLUTE_MIN } from '../utils/cpcDailyLimitBid';
import {
  AdvancedDailyLimitModal,
  AutoRefillModal,
  BidChasingClustersModal,
  createDefaultAdvancedDailyLimitSettings,
  type AdvancedDailyLimitSettings,
  type AutoRefillMode,
} from './CpcCampaignPage';

export type CampaignListAutomationKind = 'searchPosition' | 'flexibleLimit' | 'autoRefill';

export type CampaignListAutomationModalTarget = {
  campaignId: number;
  remainingBudget: number | null;
  dailyLimit: number | null;
  maxCpcBidRub: number;
};

type CampaignListAutomationModalsProps = {
  target: CampaignListAutomationModalTarget | null;
  kind: CampaignListAutomationKind | null;
  onClose: () => void;
  onAutoRefillSaved?: (campaignId: number) => void;
  onFlexibleLimitSaved?: (campaignId: number) => void;
  onBidChasingSaved?: (campaignId: number) => void;
};

export function CampaignListAutomationModals({
  target,
  kind,
  onClose,
  onAutoRefillSaved,
  onFlexibleLimitSaved,
  onBidChasingSaved,
}: CampaignListAutomationModalsProps) {
  const [autoRefillMode, setAutoRefillMode] = useState<AutoRefillMode>('manual');
  const [isDailyLimitEnabled, setIsDailyLimitEnabled] = useState(false);
  const [dailyLimitValue, setDailyLimitValue] = useState('');
  const [savedDailyLimit, setSavedDailyLimit] = useState('');
  const [isCarryoverEnabled, setIsCarryoverEnabled] = useState(false);
  const [advancedSettings, setAdvancedSettings] = useState<AdvancedDailyLimitSettings>(() =>
    createDefaultAdvancedDailyLimitSettings(),
  );
  const [autoRefillOnRulesTrigger, setAutoRefillOnRulesTrigger] = useState(true);

  useEffect(() => {
    if (!target || !kind) return;
    const limit = target.dailyLimit;
    const limitStr = limit != null && limit > 0 ? String(limit) : '';
    setIsDailyLimitEnabled(limit != null && limit > 0);
    setDailyLimitValue(limitStr);
    setSavedDailyLimit(limitStr);
    setAdvancedSettings(createDefaultAdvancedDailyLimitSettings());
    setAutoRefillOnRulesTrigger(true);
    setAutoRefillMode('manual');
  }, [target, kind]);

  const campaignBudget = target?.remainingBudget ?? 0;

  const enableDailyLimit = useCallback(() => {
    const min = Math.max(DAILY_LIMIT_ABSOLUTE_MIN, target?.maxCpcBidRub ?? DAILY_LIMIT_ABSOLUTE_MIN);
    const next = String(min);
    setDailyLimitValue(next);
    setSavedDailyLimit(next);
    setIsDailyLimitEnabled(true);
  }, [target?.maxCpcBidRub]);

  const disableDailyLimit = useCallback(() => {
    setIsDailyLimitEnabled(false);
    setDailyLimitValue('');
    setSavedDailyLimit('');
  }, []);

  const handleDailyLimitCommit = useCallback(
    (parsed: number, options?: { silent?: boolean }) => {
      if (!target || Number.isNaN(parsed)) return;
      setDailyLimitValue(String(parsed));
      setSavedDailyLimit(String(parsed));
      setIsDailyLimitEnabled(true);
      if (!options?.silent) {
        onFlexibleLimitSaved?.(target.campaignId);
      }
    },
    [onFlexibleLimitSaved, target],
  );

  if (!target || !kind) return null;

  if (kind === 'autoRefill') {
    return (
      <AutoRefillModal
        isOpen
        initialMode={autoRefillMode}
        onClose={onClose}
        onSave={(mode) => {
          setAutoRefillMode(mode);
          onAutoRefillSaved?.(target.campaignId);
          onClose();
        }}
      />
    );
  }

  if (kind === 'searchPosition') {
    return (
      <BidChasingClustersModal
        isOpen
        onClose={onClose}
        initialPosition="1-2"
        initialMaxBid={target.maxCpcBidRub}
        isDailyLimitEnabled={isDailyLimitEnabled}
        savedDailyLimitRub={Number.parseFloat(savedDailyLimit) || target.dailyLimit || 0}
        otherMaxProductBidRub={target.maxCpcBidRub}
        isBidChasingEnabled={false}
        onDisable={onClose}
        onApply={() => {
          onBidChasingSaved?.(target.campaignId);
          onClose();
        }}
      />
    );
  }

  return (
    <AdvancedDailyLimitModal
      advancedSettingsOnly
      conditionRuleBuilder
      isOpen
      onClose={onClose}
      isDailyLimitEnabled={isDailyLimitEnabled}
      onEnableDailyLimit={enableDailyLimit}
      onDisableDailyLimit={disableDailyLimit}
      dailyLimitValue={dailyLimitValue}
      onDailyLimitValueChange={setDailyLimitValue}
      onDailyLimitCommit={handleDailyLimitCommit}
      savedDailyLimit={savedDailyLimit}
      isCarryoverEnabled={isCarryoverEnabled}
      onCarryoverChange={setIsCarryoverEnabled}
      campaignBudget={campaignBudget}
      initialSettings={advancedSettings}
      onApply={(settings) => {
        setAdvancedSettings(settings);
        onFlexibleLimitSaved?.(target.campaignId);
        onClose();
      }}
      referenceCpcBidRub={target.maxCpcBidRub}
      autoRefillOnRulesTrigger={autoRefillOnRulesTrigger}
      onAutoRefillOnRulesTriggerChange={(enabled) => {
        setAutoRefillOnRulesTrigger(enabled);
        if (enabled) {
          onAutoRefillSaved?.(target.campaignId);
        }
      }}
    />
  );
}

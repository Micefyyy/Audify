import { useMemo } from 'react';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

export function useHaptics() {
  return useMemo(() => {
    const isNative = Capacitor.isNativePlatform();
    return {
      tap: () => { if (isNative) Haptics.impact({ style: ImpactStyle.Light }); },
      impact: () => { if (isNative) Haptics.impact({ style: ImpactStyle.Medium }); },
      success: () => { if (isNative) Haptics.notification({ type: NotificationType.Success }); },
      warning: () => { if (isNative) Haptics.notification({ type: NotificationType.Warning }); },
    };
  }, []);
}

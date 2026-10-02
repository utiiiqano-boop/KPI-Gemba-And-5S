import React from 'react';
export const C = {
  sidebar: '#0f172a',
  sidebarHover: '#1e293b',
  sidebarText: '#94a3b8',
  sidebarTextActive: '#ffffff',
  sidebarBorder: '#1e293b',

  bg: '#f8fafc',
  surface: '#ffffff',
  border: '#e2e8f0',
  borderLight: '#f1f5f9',

  text: '#0f172a',
  textSoft: '#475569',
  textMuted: '#94a3b8',

  primary: '#2563eb',
  primaryLt: '#eff6ff',
  primaryDark: '#1d4ed8',

  success: '#10b981',
  successLt: '#ecfdf5',
  warning: '#f59e0b',
  warningLt: '#fffbeb',
  danger: '#ef4444',
  dangerLt: '#fef2f2',
  neutral: '#64748b',
  neutralLt: '#f1f5f9',

  chart1: '#3b82f6',
  chart2: '#10b981',
  chart3: '#f59e0b',
  chart4: '#ef4444',
  chart5: '#8b5cf6',
  chart6: '#ec4899',
};

export const SIDEBAR_W = 240;
export const SIDEBAR_COLLAPSED_W = 68;
export const NAVBAR_H = 64;
export const MOBILE_BREAKPOINT = 768;

export const shadow = {
  sm: '0 1px 2px rgba(15,23,42,0.05)',
  md: '0 2px 8px rgba(15,23,42,0.06)',
  lg: '0 4px 12px rgba(15,23,42,0.08)',
  xl: '0 8px 24px rgba(15,23,42,0.12)',
};

export const scoreColor = (p) =>
  p >= 0.8 ? C.success : p >= 0.6 ? C.warning : C.danger;

export const scoreBg = (p) =>
  p >= 0.8 ? C.successLt : p >= 0.6 ? C.warningLt : C.dangerLt;

export const FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", system-ui, sans-serif';

/* ---------- Hook responsive ---------- */

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(
    typeof window !== 'undefined' ? window.innerWidth < MOBILE_BREAKPOINT : false
  );
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const onResize = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return isMobile;
}


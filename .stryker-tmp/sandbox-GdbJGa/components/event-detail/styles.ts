// @ts-nocheck
import { Platform, StyleSheet } from 'react-native';
import { CultureTokens } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';

export const getStyles = (colors: ReturnType<typeof useColors>, isDark: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  shellWrapper: { flex: 1 },
  shellInner: { flex: 1 },
  mainScroll: { flex: 1 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12, backgroundColor: colors.background },
  errorText: { fontSize: 20, fontFamily: 'Poppins_700Bold', marginTop: 12, color: colors.text },
  errorDesc: { fontSize: 15, fontFamily: 'Poppins_400Regular', textAlign: 'center', marginBottom: 20, color: colors.textSecondary },
  backActionBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, borderWidth: 1, backgroundColor: colors.backgroundSecondary, borderColor: colors.borderLight },
  backActionText: { fontSize: 15, fontFamily: 'Poppins_600SemiBold', color: colors.text },

  desktopShellWrapper: { flex: 1, alignItems: 'center' },
  desktopShell: { width: '100%', maxWidth: 800 },
  detailShell: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 },

  // ── Desktop two-column layout ────────────────────────────────────────────
  desktopTwoColWrapper: {
    width: '100%',
    alignItems: 'center' as const,
  },
  desktopTwoColInner: {
    width: '100%',
    maxWidth: 1120,
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    paddingBottom: 8,
  },
  desktopMainCol: {
    flex: 1,
    minWidth: 0,
  },
  desktopSidebarCol: {
    width: 300,
    paddingHorizontal: 16,
    paddingTop: 24,
    ...Platform.select({
      web: { alignSelf: 'flex-start' as any },
      default: {},
    }),
  },

  heroWrapper: { width: '100%' },
  heroSection: { position: 'relative', justifyContent: 'flex-end', overflow: 'hidden' },
  heroOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10, justifyContent: 'space-between' },
  heroNav: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, zIndex: 20 },
  navBtn: { width: 44, height: 44, borderRadius: 14, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(11, 11, 20, 0.45)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.15)' },
  heroActions: { flexDirection: 'row', gap: 10 },

  heroBottomContent: { paddingHorizontal: 24, paddingBottom: 32, gap: 12 },
  heroTitleRibbon: { alignSelf: 'flex-start' },
  heroImageTitle: { fontSize: 28, fontFamily: 'Poppins_700Bold', color: 'white', letterSpacing: -0.5, lineHeight: 34, ...Platform.select({ web: { textShadow: '0px 2px 4px rgba(0,0,0,0.3)' }, default: { textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 } }) },
  heroMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  heroCardBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  heroCardBadgeText: { fontSize: 12, fontFamily: 'Poppins_700Bold', color: 'black', textTransform: 'uppercase', letterSpacing: 0.8 },
  heroDateRibbonText: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: 'rgba(255,255,255,0.85)' },

  heroInfoCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    gap: 10,
    backgroundColor: colors.surface,
    borderColor: colors.borderLight,
    ...Platform.select({
      web: { boxShadow: isDark ? '0px 8px 24px rgba(0,0,0,0.5)' : '0px 8px 24px rgba(44,42,114,0.08)' },
      ios: {
        shadowColor: isDark ? '#000' : '#2C2A72',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: isDark ? 0.5 : 0.08,
        shadowRadius: 24,
      },
      android: { elevation: 8 }
    }),
  },
  heroBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  heroBadgeText: { color: colors.background, fontSize: 12, fontFamily: 'Poppins_700Bold', textTransform: 'uppercase', letterSpacing: 1.2 },
  heroTitle: { fontSize: 26, fontFamily: 'Poppins_700Bold', color: colors.text, lineHeight: 32, letterSpacing: -0.4 },
  heroOrganizer: { fontSize: 16, fontFamily: 'Poppins_500Medium', color: colors.textSecondary },

  countdownWrapper: { marginBottom: 14 },
  countdownEndedBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, borderRadius: 0, justifyContent: 'center',
    ...Platform.select({
      web: { boxShadow: '0px 2px 8px rgba(0,0,0,0.05)' },
      ios: {
        shadowColor: isDark ? '#000' : '#2C2A72',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: isDark ? 0.12 : 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: isDark ? 4 : 2,
        shadowColor: isDark ? '#000' : '#2C2A72',
      },
    }),
  },
  countdownEndedText: { fontSize: 15, fontFamily: 'Poppins_500Medium', color: colors.textSecondary },
  countdownRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 12,
    ...Platform.select({
      web: {
        boxShadow: isDark
          ? '0px 4px 12px rgba(0,0,0,0.4)'
          : '0px 4px 12px rgba(44,42,114,0.06)',
      },
      ios: {
        shadowColor: isDark ? '#000' : '#2C2A72',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: isDark ? 0.18 : 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: isDark ? 6 : 3,
        shadowColor: isDark ? '#000' : '#2C2A72',
      },
    }),
  },
  countBlock: { alignItems: 'center', minWidth: 44 },
  countNum: { fontSize: 24, fontFamily: 'Poppins_700Bold', lineHeight: 30, color: colors.text },
  countLabel: { fontSize: 11, fontFamily: 'Poppins_600SemiBold', textTransform: 'uppercase', color: colors.textTertiary, letterSpacing: 0.5 },
  countSep: { fontSize: 20, fontFamily: 'Poppins_700Bold', color: colors.borderLight, paddingBottom: 12 },

  earlyAccessBanner: { flexDirection: 'row', alignItems: 'center', gap: 8 },

  divider: { height: 1, width: '100%', marginVertical: 24, backgroundColor: colors.borderLight, opacity: 0.4 },

  section: { gap: 10 },
  sectionTitle: { fontSize: 12, fontFamily: 'Poppins_700Bold', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4, color: colors.textTertiary },
  aboutDesc: { fontSize: 16, fontFamily: 'Poppins_400Regular', lineHeight: 26, color: colors.textSecondary },
  actionGrid: { gap: 10 },
  actionGridDesktop: { flexDirection: 'row', flexWrap: 'wrap' },
  actionButton: { minWidth: 128, alignSelf: 'flex-start' },
  planVisitSection: { marginTop: 12, gap: 8 },
  planVisitNote: {
    marginTop: 2,
  },
  metaBlock: { gap: 10 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metaChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  metaChipText: { fontSize: 13, fontFamily: 'Poppins_600SemiBold' },

  capacityHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  capacityPercent: { fontSize: 14, fontFamily: 'Poppins_700Bold', color: colors.textSecondary },
  capacityBarBg: { height: 10, borderRadius: 5, overflow: 'hidden', marginTop: 8, backgroundColor: colors.surfaceElevated },
  capacityBarFill: { height: '100%', borderRadius: 5 },
  capacityFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  capacityFootText: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: colors.textSecondary },

  tierLeft: { gap: 2 },
  tierName: { fontSize: 16, fontFamily: 'Poppins_600SemiBold', color: colors.text },
  tierAvail: { fontSize: 13, fontFamily: 'Poppins_500Medium', color: colors.textSecondary },
  tierRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  tierPrice: { fontSize: 17, fontFamily: 'Poppins_700Bold', color: CultureTokens.gold },
  tierRowMinimal: {
    minHeight: 56,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },

  metricRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  metricIconBg: { width: 32, height: 32, borderRadius: 10, backgroundColor: colors.backgroundSecondary, alignItems: 'center', justifyContent: 'center' },
  metricText: { fontSize: 14, fontFamily: 'Poppins_500Medium', color: colors.textSecondary },
  inlineMetaList: {
    gap: 2,
  },
  inlineMetaRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderLight,
  },
  inlineMetaIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineMetaContent: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  inlineFactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingVertical: 2,
  },
  inlineFactLabel: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  inlineFactValue: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
  },
  moreDetailsToggle: {
    minHeight: 42,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  moreDetailsToggleText: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
  },
  hostCard: {
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: colors.surface,
    borderColor: colors.borderLight,
  },
  hostHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  hostContent: { flex: 1, gap: 2 },

  modalOverlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  modalSheet: { borderTopLeftRadius: 32, borderTopRightRadius: 32, overflow: 'hidden', maxHeight: '90%' },
  modalHandle: { width: 40, height: 5, borderRadius: 3, alignSelf: 'center', marginTop: 12, marginBottom: 8, backgroundColor: colors.border, opacity: 0.3 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 20, borderBottomWidth: 1, borderColor: colors.borderLight },
  modalTitle: { fontSize: 20, fontFamily: 'Poppins_700Bold', color: colors.text },
  modalGroupLabel: { fontSize: 12, fontFamily: 'Poppins_700Bold', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 12, color: colors.textTertiary },

  buyModeRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  buyModeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 16, borderWidth: 1, backgroundColor: colors.backgroundSecondary, borderColor: colors.borderLight },
  buyModeText: { fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: colors.textSecondary },

  modalTierCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18, borderRadius: 18, borderWidth: 1, marginBottom: 12, backgroundColor: colors.backgroundSecondary, borderColor: colors.borderLight },
  modalTierLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  radioOuter: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioInner: { width: 12, height: 12, borderRadius: 6 },
  modalTierName: { fontSize: 16, fontFamily: 'Poppins_600SemiBold', marginBottom: 2, color: colors.text },
  modalTierAvail: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: colors.textSecondary },
  modalTierPrice: { fontSize: 17, fontFamily: 'Poppins_700Bold', color: colors.text },

  quantityRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 12, borderRadius: 18, borderWidth: 1, backgroundColor: colors.backgroundSecondary, borderColor: colors.borderLight },
  quantityBtn: { width: 48, height: 48, borderRadius: 14 },
  quantityNum: { fontSize: 22, fontFamily: 'Poppins_700Bold', color: colors.text },

  priceSummaryBox: {
    padding: 20, borderRadius: 24, borderWidth: 1, gap: 12, marginTop: 24, marginBottom: 24, backgroundColor: colors.surface, borderColor: colors.borderLight,
    ...Platform.select({
      web: {
        boxShadow: isDark ? '0px 4px 16px rgba(0,0,0,0.4)' : '0px 4px 12px rgba(44,42,114,0.06)',
      },
      ios: {
        shadowColor: isDark ? '#000' : '#2C2A72',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: isDark ? 0.18 : 0.08,
        shadowRadius: 16,
      },
      android: {
        elevation: isDark ? 8 : 4,
        shadowColor: isDark ? '#000' : '#2C2A72',
      },
    }),
  },
  pRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pRowLabel: { fontSize: 15, fontFamily: 'Poppins_400Regular', color: colors.textSecondary },
  pRowVal: { fontSize: 15, fontFamily: 'Poppins_600SemiBold', color: colors.text },
  pDiv: { height: 1, width: '100%', marginVertical: 6, backgroundColor: colors.borderLight, opacity: 0.5 },
  pTotalLabel: { fontSize: 18, fontFamily: 'Poppins_700Bold', color: colors.text },
  pTotalVal: { fontSize: 22, fontFamily: 'Poppins_700Bold', color: colors.text },

  calOptRow:   { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 16, borderRadius: 18, backgroundColor: colors.backgroundSecondary, borderWidth: 1, borderColor: colors.borderLight },
  calOptIcon:  { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  calOptLabel: { fontSize: 16, fontFamily: 'Poppins_600SemiBold', color: colors.text },
  calOptSub:   { fontSize: 13, fontFamily: 'Poppins_400Regular', color: colors.textSecondary, marginTop: 2 },

  // ── Social Proof Bar ─────────────────────────────────────────────────────
  socialProofBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 4,
  },
  hostCompactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  hostAvatarBadge: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flexShrink: 0,
  },
  hostAvatarImg: {
    width: 38,
    height: 38,
  },
  attendeeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    flexShrink: 0,
  },

  // ── Quick Actions ────────────────────────────────────────────────────────
  quickActionsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  quickActionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  quickActionText: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },

  // ── Primary Action Section (inline, non-floating) ─────────────────────────
  primaryActionCard: {
    marginTop: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.surface,
    paddingVertical: 8,
    paddingHorizontal: 10,
    gap: 6,
    ...Platform.select({
      web: { boxShadow: isDark ? '0px 6px 18px rgba(0,0,0,0.35)' : '0px 6px 18px rgba(44,42,114,0.06)' },
      ios: {
        shadowColor: isDark ? '#000' : '#2C2A72',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: isDark ? 0.25 : 0.08,
        shadowRadius: 14,
      },
      android: { elevation: 3 },
    }),
  },
  primaryActionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  primaryActionRow: {
    maxHeight: 40,
  },
  primaryActionRowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingRight: 8,
  },
  primaryCta: {
    minHeight: 34,
    minWidth: 92,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  primaryPill: {
    minHeight: 32,
    minWidth: 80,
    paddingHorizontal: 9,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryPillText: {
    fontSize: 11,
    fontFamily: 'Poppins_700Bold',
  },
  quickActionChipCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },

  // ── Discovery: Similar Events + Communities ───────────────────────────────
  discoverSection: {
    gap: 14,
  },
  discoverSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  discoverRail: {
    marginHorizontal: -20, // break out of detailShell horizontal padding
  },
  discoverRailContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
});

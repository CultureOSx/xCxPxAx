import { StyleSheet, Platform } from 'react-native';

export const CORNER = 24;
export const CORNER_W = 3;

export const getStyles = (colors: any) => StyleSheet.create({
  container:        { flex: 1, backgroundColor: colors.background },

  // Header — slim, purposeful
  header:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 8, zIndex: 10 },
  headerBtn:        { width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.backgroundSecondary },
  headerTitle:      { fontSize: 16, fontFamily: 'Poppins_700Bold', color: colors.text, letterSpacing: -0.2 },
  headerRight:      { width: 34, alignItems: 'flex-end' },

  // Segmented control — feels like iOS
  toggleContainer:  { flexDirection: 'row', marginHorizontal: 16, borderRadius: 10, padding: 3, backgroundColor: colors.backgroundSecondary },
  toggleTab:        { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 8, borderRadius: 8 },
  toggleText:       { fontSize: 12, fontFamily: 'Poppins_600SemiBold', color: colors.textTertiary },

  // Stats bar — compact, secondary to the camera
  statsBar:         { flexDirection: 'row', marginHorizontal: 16, marginTop: 10, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderLight },
  statItem:         { flex: 1, alignItems: 'center', gap: 1 },
  statNum:          { fontSize: 17, fontFamily: 'Poppins_700Bold' },
  statLabel:        { fontSize: 10, fontFamily: 'Poppins_500Medium', color: colors.textSecondary },
  statDivider:      { width: 1, marginVertical: 4, backgroundColor: colors.borderLight },

  // Camera — the primary UI surface
  cameraContainer:  { height: 340, marginHorizontal: 16, marginTop: 12, borderRadius: 16, overflow: 'hidden', position: 'relative' },
  camera:           { flex: 1 },
  cameraOverlay:    { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.25)' },
  cameraFrame:      { width: 200, height: 200, position: 'relative' },
  cCorner:          { position: 'absolute', width: CORNER, height: CORNER },
  cTL:              { top: 0, left: 0,     borderTopWidth: CORNER_W,    borderLeftWidth: CORNER_W,  borderColor: '#FFFFFF', borderTopLeftRadius: 10 },
  cTR:              { top: 0, right: 0,    borderTopWidth: CORNER_W,    borderRightWidth: CORNER_W, borderColor: '#FFFFFF', borderTopRightRadius: 10 },
  cBL:              { bottom: 0, left: 0,  borderBottomWidth: CORNER_W, borderLeftWidth: CORNER_W,  borderColor: '#FFFFFF', borderBottomLeftRadius: 10 },
  cBR:              { bottom: 0, right: 0, borderBottomWidth: CORNER_W, borderRightWidth: CORNER_W, borderColor: '#FFFFFF', borderBottomRightRadius: 10 },
  // Animated scan line — sits inside cameraFrame (200×200)
  scanLine:         {
    position: 'absolute', left: 8, right: 8, height: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(255,255,255,0.85)',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 4,
    ...Platform.select({ web: { boxShadow: '0 0 8px 2px rgba(255,255,255,0.7)' } } as Record<string, unknown>),
  },
  cameraHint:       {
    position: 'absolute', bottom: 16, left: 0, right: 0, textAlign: 'center',
    color: 'rgba(255,255,255,0.85)', fontSize: 13, fontFamily: 'Poppins_500Medium',
    ...Platform.select({ web: { textShadow: '0px 1px 4px rgba(0,0,0,0.9)' }, default: { textShadowColor: 'rgba(0,0,0,0.9)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 } }),
  },
  closeCameraBtn:   { position: 'absolute', top: 12, right: 12, width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.45)' },

  // Input section
  scanInputSection: { marginHorizontal: 16, marginTop: 14, gap: 10 },
  camScanBtn:       { borderRadius: 12, overflow: 'hidden' },
  camScanGradient:  { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  camScanTitle:     { fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: '#FFF' },
  camScanSub:       { fontSize: 11, fontFamily: 'Poppins_400Regular', color: 'rgba(255,255,255,0.75)', marginTop: 1 },
  orRow:            { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 0 },
  orLine:           { flex: 1, height: 1, backgroundColor: colors.borderLight },
  orText:           { fontSize: 11, fontFamily: 'Poppins_400Regular', color: colors.textTertiary },
  inputRow:         { flexDirection: 'row', gap: 8 },
  codeInput:        { flex: 1, borderRadius: 10, paddingHorizontal: 13, paddingVertical: 11, fontSize: 14, fontFamily: 'Poppins_500Medium', backgroundColor: colors.backgroundSecondary, borderWidth: 1, borderColor: colors.borderLight, color: colors.text },
  scanBtn:          { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  scanBtnDisabled:  { opacity: 0.45 },

  resultWrapper:    { marginHorizontal: 16, marginTop: 12 },

  // History — clean rows, no left-border stripe
  historySection:       { marginHorizontal: 16, marginTop: 20 },
  historySectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  historyTitle:         { fontSize: 11, fontFamily: 'Poppins_600SemiBold', color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.6 },
  historyItem:          { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  historyIconWrap:      { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  historyEventTitle:    { fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: colors.text },
  historyStatus:        { fontSize: 11, fontFamily: 'Poppins_400Regular', marginTop: 1 },
  historyTierChip:      { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  historyTierText:      { fontSize: 10, fontFamily: 'Poppins_600SemiBold' },

  // Empty state
  emptyState:       { alignItems: 'center', paddingTop: 48, paddingHorizontal: 40, gap: 8 },
  emptyIconBg:      { width: 64, height: 64, borderRadius: 18, marginBottom: 4, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.backgroundSecondary },
  emptyTitle:       { fontSize: 16, fontFamily: 'Poppins_700Bold', color: colors.text },
  emptyDesc:        { fontSize: 13, fontFamily: 'Poppins_400Regular', textAlign: 'center', lineHeight: 20, color: colors.textSecondary },

  // Lookup overlay
  lookupOverlay:    { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 200, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: colors.background, opacity: 0.92 },
  lookupText:       { fontSize: 14, fontFamily: 'Poppins_500Medium', color: colors.text },

  // Unused but kept for compat
  cameraStartBtn:   { borderRadius: 14, padding: 24, alignItems: 'center', gap: 10, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderLight },
  cameraIconCircle: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  cameraStartTitle: { fontSize: 17, fontFamily: 'Poppins_700Bold', color: colors.text },
  cameraStartSub:   { fontSize: 13, fontFamily: 'Poppins_400Regular', textAlign: 'center', color: colors.textSecondary },

  // CulturePass contact card
  cpCard:           { marginHorizontal: 16, marginTop: 14, borderRadius: 14, padding: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderLight },
  cpCardHeader:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  cpAvatar:         { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cpAvatarText:     { fontSize: 18, fontFamily: 'Poppins_700Bold' },
  closeBtn:         { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.backgroundSecondary },
  cpName:           { fontSize: 17, fontFamily: 'Poppins_700Bold', marginBottom: 1, color: colors.text },
  cpUsername:       { fontSize: 13, fontFamily: 'Poppins_400Regular', marginBottom: 12, color: colors.textSecondary },
  cpChipRow:        { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  cpIdChip:         { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 7 },
  cpIdText:         { fontSize: 12, fontFamily: 'Poppins_600SemiBold' },
  cpTierChip:       { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 7 },
  cpTierText:       { fontSize: 12, fontFamily: 'Poppins_600SemiBold' },
  cpLocationRow:    { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 5 },
  cpLocationText:   { fontSize: 12, fontFamily: 'Poppins_400Regular', color: colors.textSecondary },
  cpBio:            { fontSize: 13, fontFamily: 'Poppins_400Regular', marginBottom: 10, lineHeight: 19, color: colors.textSecondary },
  cpActions:        { flexDirection: 'row', gap: 8, marginTop: 10 },
  cpActionBtn:      { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 9, borderRadius: 9, backgroundColor: colors.backgroundSecondary, borderWidth: 1, borderColor: colors.borderLight },
  cpActionText:     { fontSize: 12, fontFamily: 'Poppins_600SemiBold' },

  // Formats hint
  hintSection:      { marginHorizontal: 16, marginTop: 14, borderRadius: 12, padding: 14, gap: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderLight },
  hintTitle:        { fontSize: 11, fontFamily: 'Poppins_600SemiBold', color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.6 },
  hintItem:         { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  hintLabel:        { fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: colors.text },
  hintExample:      { fontSize: 11, fontFamily: 'Poppins_400Regular', color: colors.textSecondary, marginTop: 1 },
});

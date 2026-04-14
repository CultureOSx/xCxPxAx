import { StyleSheet, Platform } from 'react-native';
import {
  ButtonTokens,
  CardTokens,
  ChipTokens,
  FontFamily,
  FontSize,
  IconSize,
  InputTokens,
  LineHeight,
  Spacing,
} from '@/constants/theme';
import { useColors } from '@/hooks/useColors';

const CREATE_UI = {
  successImageHeight: 180,
  progressHeight: 3,
  progressRadius: 2,
  stepDot: 10,
  stepDotRadius: 5,
  stepDotLineHeight: 2,
  scrollBottomPad: 60,
  scrollDesktopMaxWidth: 700,
  textAreaMinHeight: 100,
  descriptionMinHeight: 120,
  imagePickerBorderWidth: 2,
  imagePickerPaddingVertical: Spacing.xxxl,
  imagePreviewHeight: 200,
  reviewImageHeight: 160,
  entryIconSize: 56,
  entryIconRadius: 28,
  entryCheckSize: 22,
  fieldLabelLetterSpacing: 0.5,
  navBackMinWidth: 90,
} as const;

export const getStyles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    root:          { flex: 1 },
    // Success
    successRoot:   { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl, gap: Spacing.lg },
    successIconWrap: { alignItems: 'center' },
    successContent: { alignItems: 'center', gap: Spacing.sm + 2, width: '100%' },
    successTitle:  { fontSize: FontSize.display, fontFamily: FontFamily.bold, textAlign: 'center' },
    successSub:    { fontSize: FontSize.body, fontFamily: FontFamily.regular, textAlign: 'center', lineHeight: LineHeight.body },
    successImage:  { 
      width: '100%', 
      height: CREATE_UI.successImageHeight, 
      borderRadius: CardTokens.radius, 
      marginTop: Spacing.sm,
      ...Platform.select({
        web: { boxShadow: '0px 4px 12px rgba(0,0,0,0.3)' },
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 12,
        },
        android: { elevation: 4 }
      })
    },
    successActions: { width: '100%', gap: Spacing.md - 4 },
    // Header / progress
    topBar:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingBottom: Spacing.xs },
    backBtn:       { width: IconSize.xxl, height: IconSize.xxl, alignItems: 'center', justifyContent: 'center' },
    topCenter:     { flex: 1, alignItems: 'center' },
    progressTrack: { height: CREATE_UI.progressHeight, backgroundColor: colors.borderLight, marginHorizontal: Spacing.md, borderRadius: CREATE_UI.progressRadius, marginBottom: Spacing.sm },
    progressFill:  { height: CREATE_UI.progressHeight, borderRadius: CREATE_UI.progressRadius },
    stepDots:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md - 4, gap: 0 },
    stepDotWrap:   { flexDirection: 'row', alignItems: 'center', flex: 1 },
    stepDot:       { width: CREATE_UI.stepDot, height: CREATE_UI.stepDot, borderRadius: CREATE_UI.stepDotRadius, alignItems: 'center', justifyContent: 'center' },
    stepDotLine:   { flex: 1, height: CREATE_UI.stepDotLineHeight, marginHorizontal: Spacing.xs },
    // Scroll / card
    scroll:        { flexGrow: 1, paddingHorizontal: Spacing.md, paddingVertical: Spacing.lg, paddingBottom: CREATE_UI.scrollBottomPad },
    scrollDesktop: { paddingHorizontal: 0, maxWidth: CREATE_UI.scrollDesktopMaxWidth, alignSelf: 'center' as const, width: '100%' },
    card:          { 
      borderRadius: CardTokens.radius, 
      borderWidth: 1, 
      padding: CardTokens.padding + 4, 
      gap: 0,
      ...Platform.select({
        web: { boxShadow: '0px 8px 32px rgba(0,0,0,0.4)' },
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.4,
          shadowRadius: 32,
        },
        android: { elevation: 8 }
      })
    },
    cardDesktop:   { borderRadius: CardTokens.radiusLarge },
    stepHeader:    { flexDirection: 'row', alignItems: 'center', gap: Spacing.md - 4, marginBottom: Spacing.lg },
    stepIconWrap:  { width: IconSize.xxl + 4, height: IconSize.xxl + 4, borderRadius: CardTokens.radius - 4, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
    // Fields
    fields:        { gap: 0 },
    textArea:      { minHeight: CREATE_UI.textAreaMinHeight, paddingTop: Spacing.md - 4 },
    descriptionInput: {
      minHeight: CREATE_UI.descriptionMinHeight,
      borderWidth: 1,
      borderRadius: CardTokens.radius - 4,
      paddingHorizontal: Spacing.md - 2,
      paddingVertical: Spacing.md - 4,
      fontSize: FontSize.callout,
      fontFamily: FontFamily.regular,
      lineHeight: LineHeight.callout,
    },
    // Banners
    errorBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      borderWidth: 1,
      borderRadius: CardTokens.radius - 6,
      padding: Spacing.md - 4,
      marginTop: Spacing.md - 4,
    },
    errorBannerText: {
      flex: 1,
      fontSize: FontSize.chip,
      fontFamily: FontFamily.medium,
      lineHeight: LineHeight.chip - 2,
    },
    infoBox:       { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm + 2, borderWidth: 1, borderRadius: CardTokens.radius - 4, padding: Spacing.md - 2, marginTop: Spacing.sm },
    infoText:      { fontSize: FontSize.chip, fontFamily: FontFamily.regular, flex: 1, lineHeight: LineHeight.chip - 2 },
    sectionNote:   { fontSize: FontSize.body2, fontFamily: FontFamily.regular, marginBottom: Spacing.md, lineHeight: LineHeight.body2 },
    // Layout
    row:           { flexDirection: 'row', gap: Spacing.md - 4 },
    // Basics — event type
    typeGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
    typeChip:      { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm - 2, borderWidth: 1, borderRadius: ChipTokens.radius, paddingHorizontal: ChipTokens.paddingH - 4, paddingVertical: ChipTokens.paddingV },
    typeEmoji:     { fontSize: FontSize.body },
    // Image
    imagePicker:   { alignItems: 'center', justifyContent: 'center', borderWidth: CREATE_UI.imagePickerBorderWidth, borderStyle: 'dashed', borderRadius: CardTokens.radius, paddingVertical: CREATE_UI.imagePickerPaddingVertical, gap: Spacing.md - 4 },
    imagePickerText: { fontSize: FontSize.body, fontFamily: FontFamily.semibold },
    imagePickerSub:  { fontSize: FontSize.chip, fontFamily: FontFamily.regular },
    imagePreviewWrap: { borderRadius: CardTokens.radius, overflow: 'hidden', marginBottom: Spacing.md - 4 },
    imagePreview:    { width: '100%', height: CREATE_UI.imagePreviewHeight },
    imagePreviewActions: { flexDirection: 'row', gap: Spacing.sm, padding: Spacing.sm, backgroundColor: colors.surfaceElevated },
    imageActionBtn:  { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm - 2, borderRadius: CardTokens.radius - 6, paddingHorizontal: Spacing.md - 2, paddingVertical: Spacing.sm },
    imageActionText: { fontSize: FontSize.body2, fontFamily: FontFamily.semibold },
    reviewImage:   { width: '100%', height: CREATE_UI.reviewImageHeight, borderRadius: CardTokens.radius - 4, marginBottom: Spacing.md },
    // Entry type
    entryTypeGrid: { flexDirection: 'row', gap: Spacing.md - 4, marginBottom: Spacing.sm },
    entryCard:     { 
      flex: 1, 
      alignItems: 'center', 
      padding: CardTokens.paddingLarge, 
      borderRadius: CardTokens.radius, 
      borderWidth: 2, 
      gap: Spacing.sm, 
      position: 'relative',
      ...Platform.select({
        web: { boxShadow: '0px 2px 8px rgba(0,0,0,0.2)' },
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 8,
        },
        android: { elevation: 2 }
      })
    },
    entryIconWrap: { width: CREATE_UI.entryIconSize, height: CREATE_UI.entryIconSize, borderRadius: CREATE_UI.entryIconRadius, alignItems: 'center', justifyContent: 'center' },
    entryCardTitle: { fontSize: FontSize.body2, fontFamily: FontFamily.bold, textAlign: 'center' },
    entryCardSub:  { fontSize: FontSize.caption, fontFamily: FontFamily.regular, textAlign: 'center', lineHeight: LineHeight.caption },
    entryCheck:    { position: 'absolute', top: Spacing.sm + 2, right: Spacing.sm + 2, width: CREATE_UI.entryCheckSize, height: CREATE_UI.entryCheckSize, borderRadius: CREATE_UI.entryCheckSize / 2, alignItems: 'center', justifyContent: 'center' },
    // Tickets
    tierRow:       { 
      flexDirection: 'row', 
      alignItems: 'center', 
      borderWidth: 1, 
      borderRadius: CardTokens.radius - 4, 
      padding: Spacing.md - 2, 
      marginBottom: Spacing.sm, 
      gap: Spacing.md - 4,
      ...Platform.select({
        web: { boxShadow: '0px 1px 4px rgba(0,0,0,0.1)' },
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        android: { elevation: 1 }
      })
    },
    tierInfo:      { flex: 1 },
    tierName:      { fontSize: FontSize.callout, fontFamily: FontFamily.semibold },
    tierDetails:   { fontSize: FontSize.chip, fontFamily: FontFamily.regular, marginTop: Spacing.xs - 2 },
    addTierBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, borderWidth: 1, borderStyle: 'dashed', borderRadius: CardTokens.radius - 4, paddingVertical: Spacing.md - 2, marginBottom: Spacing.md },
    addTierText:   { fontSize: FontSize.body2, fontFamily: FontFamily.semibold },
    addTierForm:   { borderWidth: 1, borderRadius: CardTokens.radius - 2, padding: Spacing.md, marginBottom: Spacing.md - 4, gap: Spacing.sm },
    tierPresets:   { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.xs },
    tierPreset:    { borderWidth: 1, borderRadius: CardTokens.radius, paddingHorizontal: ChipTokens.paddingH - 4, paddingVertical: ChipTokens.paddingV - 2 },
    tierPresetText: { fontSize: FontSize.caption, fontFamily: FontFamily.semibold },
    fieldLabel:    { fontSize: FontSize.micro, fontFamily: FontFamily.semibold, textTransform: 'uppercase', letterSpacing: CREATE_UI.fieldLabelLetterSpacing, marginBottom: Spacing.xs },
    inlineInput:   { borderWidth: 1, borderRadius: CardTokens.radius - 6, paddingHorizontal: InputTokens.paddingH - 4, paddingVertical: InputTokens.paddingV - 2, fontSize: FontSize.body2, fontFamily: FontFamily.regular },
    searchResult:  { borderWidth: 1, borderRadius: Spacing.sm, paddingHorizontal: InputTokens.paddingH - 4, paddingVertical: Spacing.sm, marginBottom: Spacing.xs },
    // Team
    teamSection:   { marginBottom: CardTokens.paddingLarge },
    teamSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm + 2 },
    teamSectionTitle: { flex: 1, fontSize: FontSize.callout, fontFamily: FontFamily.bold },
    teamCount:     { fontSize: FontSize.chip, fontFamily: FontFamily.semibold },
    teamChip:      { 
      flexDirection: 'row', 
      alignItems: 'center', 
      borderWidth: 1, 
      borderRadius: CardTokens.radius - 4, 
      padding: Spacing.md - 4, 
      marginBottom: Spacing.sm, 
      gap: Spacing.sm + 2,
      ...Platform.select({
        web: { boxShadow: '0px 1px 4px rgba(0,0,0,0.1)' },
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        android: { elevation: 1 }
      })
    },
    teamChipIcon:  { width: Spacing.xl, height: Spacing.xl, borderRadius: Spacing.md, alignItems: 'center', justifyContent: 'center' },
    teamChipName:  { fontSize: FontSize.body2, fontFamily: FontFamily.semibold },
    teamChipRole:  { fontSize: FontSize.caption, fontFamily: FontFamily.regular, marginTop: Spacing.xs - 3 },
    // Culture / nationality
    tagGrid:       { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
    tagChip:       { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm - 2, borderWidth: 1, borderRadius: ChipTokens.radius, paddingHorizontal: ChipTokens.paddingH - 4, paddingVertical: ChipTokens.paddingV },
    tagEmoji:      { fontSize: FontSize.callout },
    tagLabel:      { fontSize: FontSize.chip, fontFamily: FontFamily.medium },
    natSearchWrap: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, borderWidth: 1, borderRadius: CardTokens.radius - 6, paddingHorizontal: InputTokens.paddingH - 4, paddingVertical: InputTokens.paddingV - 2, marginBottom: Spacing.xs },
    natSearchInput: { flex: 1, fontSize: FontSize.body2, fontFamily: FontFamily.regular, padding: 0 },
    natChip:       { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm - 2, borderWidth: 1, borderRadius: ChipTokens.radius, paddingHorizontal: ChipTokens.paddingH - 4, paddingVertical: ChipTokens.paddingV - 1 },
    natEmoji:      { fontSize: FontSize.body },
    natLabel:      { fontSize: FontSize.chip, fontFamily: FontFamily.medium },
    natHint:       { fontSize: FontSize.caption, fontFamily: FontFamily.regular, marginTop: Spacing.xs, lineHeight: LineHeight.caption },
    // Navigation
    navRow:        { flexDirection: 'row', gap: Spacing.md - 4, marginTop: Spacing.lg + Spacing.xs },
    navBack:       { flex: 0, minWidth: CREATE_UI.navBackMinWidth },
    navNext:       { height: ButtonTokens.height.lg + 4, borderRadius: CardTokens.radius },
  });

export type CreateStyles = ReturnType<typeof getStyles>;

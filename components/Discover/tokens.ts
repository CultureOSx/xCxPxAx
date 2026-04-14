import { CardTokens, ChipTokens, SectionTokens, Spacing } from '@/constants/theme';

/**
 * Discover UI spacing/radius tokens used by rails and cards.
 * Keep this as the single source of truth for Discover surfaces.
 */
export const DISCOVER_TOKENS = {
  rail: {
    gap: Spacing.sm + 4, // 12
    sectionGap: Spacing.md, // 16
  },
  card: {
    railWidth: 256,
    railImageHeight: 168,
    overlayWidth: 240,
    overlayHeight: 260,
    overlayHighlightHeight: 320,
    radius: CardTokens.radiusLarge,
    contentPadding: CardTokens.padding,
    bodyGap: Spacing.xs,
  },
  category: {
    width: 110,
    radius: CardTokens.radiusLarge,
    iconWrap: 50,
    iconRadius: CardTokens.radius,
    paddingY: Spacing.md + 2, // 18
    paddingX: Spacing.sm + 2, // 10
  },
  sectionHeader: {
    rowGap: Spacing.sm + 6, // 14
    bottomSpacing: Spacing.md, // 16
    accentWidth: Spacing.xs, // 4
    accentHeight: 42,
    accentRadius: 3,
    subtitleGap: 3,
    actionGap: 4,
    actionPaddingY: 10,
    actionPaddingLeft: Spacing.sm,
    actionPaddingRight: 2,
    actionMinTouch: 44,
    seeAllRadius: ChipTokens.radius,
  },
  webRail: {
    sectionGap: Spacing.md,
    headerBottomSpacing: Spacing.xs,
    scrollBottomPadding: 2,
    buttonRadius: 20,
    buttonBorder: 1,
  },
  typography: {
    sectionTitleSize: SectionTokens.titleFontSize,
    sectionTitleLineHeight: SectionTokens.titleLineHeight,
  },
} as const;

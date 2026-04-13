/**
 * CulturePass Theme Factory
 * =========================
 * Generates consistent, theme-aware style objects from the design token system.
 *
 * Every style factory function is pure — it takes the current color theme and
 * returns a StyleSheet-compatible object. Wrap in `useThemeFactory()` to get
 * the fully-bound version for the active theme.
 *
 * Usage (component):
 *   const tf = useThemeFactory();
 *   <View style={tf.card.base}>…</View>
 *   <Text style={tf.button.primary.label}>…</Text>
 *
 * Usage (StyleSheet.create outside render):
 *   import { makeCardStyles } from '@/lib/theme-factory';
 *   const colors = useColors();
 *   const cardStyles = makeCardStyles(colors);
 */
// @ts-nocheck
function stryNS_9fa48() {
  var g = typeof globalThis === 'object' && globalThis && globalThis.Math === Math && globalThis || new Function("return this")();
  var ns = g.__stryker__ || (g.__stryker__ = {});
  if (ns.activeMutant === undefined && g.process && g.process.env && g.process.env.__STRYKER_ACTIVE_MUTANT__) {
    ns.activeMutant = g.process.env.__STRYKER_ACTIVE_MUTANT__;
  }
  function retrieveNS() {
    return ns;
  }
  stryNS_9fa48 = retrieveNS;
  return retrieveNS();
}
stryNS_9fa48();
function stryCov_9fa48() {
  var ns = stryNS_9fa48();
  var cov = ns.mutantCoverage || (ns.mutantCoverage = {
    static: {},
    perTest: {}
  });
  function cover() {
    var c = cov.static;
    if (ns.currentTestId) {
      c = cov.perTest[ns.currentTestId] = cov.perTest[ns.currentTestId] || {};
    }
    var a = arguments;
    for (var i = 0; i < a.length; i++) {
      c[a[i]] = (c[a[i]] || 0) + 1;
    }
  }
  stryCov_9fa48 = cover;
  cover.apply(null, arguments);
}
function stryMutAct_9fa48(id) {
  var ns = stryNS_9fa48();
  function isActive(id) {
    if (ns.activeMutant === id) {
      if (ns.hitCount !== void 0 && ++ns.hitCount > ns.hitLimit) {
        throw new Error('Stryker: Hit count limit reached (' + ns.hitCount + ')');
      }
      return true;
    }
    return false;
  }
  stryMutAct_9fa48 = isActive;
  return isActive(id);
}
import { StyleSheet } from 'react-native';
import { useColors } from '@/hooks/useColors';
import type { ColorTheme } from '@/constants/colors';
import { ButtonTokens, CardTokens, InputTokens, ChipTokens, AvatarTokens, Spacing, Radius, Elevation, TextStyles, ZIndex, IconSize, CultureTokens, CategoryColors, EntityTypeColors } from '@/constants/theme';

// ---------------------------------------------------------------------------
// Card variants
// ---------------------------------------------------------------------------

export type CardVariant = 'base' | 'raised' | 'featured' | 'glass' | 'hero';
export interface CardStyleSet {
  base: ReturnType<typeof StyleSheet.create>[string];
  raised: ReturnType<typeof StyleSheet.create>[string];
  featured: ReturnType<typeof StyleSheet.create>[string];
  glass: ReturnType<typeof StyleSheet.create>[string];
  hero: ReturnType<typeof StyleSheet.create>[string];
  /** 16:9 aspect image container for cards */
  imageContainer: ReturnType<typeof StyleSheet.create>[string];
  /** Image container with fixed mobile height */
  imageContainerFixed: ReturnType<typeof StyleSheet.create>[string];
  body: ReturnType<typeof StyleSheet.create>[string];
}
export function makeCardStyles(colors: ColorTheme): CardStyleSet {
  if (stryMutAct_9fa48("4974")) {
    {}
  } else {
    stryCov_9fa48("4974");
    return stryMutAct_9fa48("4975") ? {} : (stryCov_9fa48("4975"), {
      base: stryMutAct_9fa48("4976") ? {} : (stryCov_9fa48("4976"), {
        backgroundColor: colors.card,
        borderRadius: CardTokens.radius,
        borderWidth: 1,
        borderColor: colors.cardBorder,
        overflow: stryMutAct_9fa48("4977") ? "" : (stryCov_9fa48("4977"), 'hidden'),
        ...Elevation[1]
      }),
      raised: stryMutAct_9fa48("4978") ? {} : (stryCov_9fa48("4978"), {
        backgroundColor: colors.surfaceElevated,
        borderRadius: CardTokens.radius,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: stryMutAct_9fa48("4979") ? "" : (stryCov_9fa48("4979"), 'hidden'),
        ...Elevation[2]
      }),
      featured: stryMutAct_9fa48("4980") ? {} : (stryCov_9fa48("4980"), {
        backgroundColor: colors.card,
        borderRadius: CardTokens.radiusLarge,
        borderWidth: 1.5,
        borderColor: colors.primary + (stryMutAct_9fa48("4981") ? "" : (stryCov_9fa48("4981"), '33')),
        // 20% primary tint
        overflow: stryMutAct_9fa48("4982") ? "" : (stryCov_9fa48("4982"), 'hidden'),
        ...Elevation[3]
      }),
      glass: stryMutAct_9fa48("4983") ? {} : (stryCov_9fa48("4983"), {
        backgroundColor: stryMutAct_9fa48("4984") ? "" : (stryCov_9fa48("4984"), 'rgba(255,255,255,0.72)'),
        borderRadius: CardTokens.radius,
        borderWidth: 1,
        borderColor: stryMutAct_9fa48("4985") ? "" : (stryCov_9fa48("4985"), 'rgba(255,255,255,0.35)'),
        overflow: stryMutAct_9fa48("4986") ? "" : (stryCov_9fa48("4986"), 'hidden'),
        ...Elevation[2]
      }),
      hero: stryMutAct_9fa48("4987") ? {} : (stryCov_9fa48("4987"), {
        borderRadius: CardTokens.radiusLarge,
        overflow: stryMutAct_9fa48("4988") ? "" : (stryCov_9fa48("4988"), 'hidden'),
        ...Elevation[3]
      }),
      imageContainer: stryMutAct_9fa48("4989") ? {} : (stryCov_9fa48("4989"), {
        aspectRatio: stryMutAct_9fa48("4990") ? 16 * 9 : (stryCov_9fa48("4990"), 16 / 9),
        backgroundColor: colors.border,
        overflow: stryMutAct_9fa48("4991") ? "" : (stryCov_9fa48("4991"), 'hidden')
      }),
      imageContainerFixed: stryMutAct_9fa48("4992") ? {} : (stryCov_9fa48("4992"), {
        height: CardTokens.imageHeight.mobile,
        backgroundColor: colors.border,
        overflow: stryMutAct_9fa48("4993") ? "" : (stryCov_9fa48("4993"), 'hidden')
      }),
      body: stryMutAct_9fa48("4994") ? {} : (stryCov_9fa48("4994"), {
        padding: CardTokens.padding,
        gap: Spacing.sm
      })
    });
  }
}

// ---------------------------------------------------------------------------
// Button variants
// ---------------------------------------------------------------------------

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive' | 'gold' | 'teal';
export type ButtonSize = 'sm' | 'md' | 'lg';
export interface ButtonSizeStyle {
  container: ReturnType<typeof StyleSheet.create>[string];
  label: ReturnType<typeof StyleSheet.create>[string];
}
export interface ButtonVariantStyle {
  sm: ButtonSizeStyle;
  md: ButtonSizeStyle;
  lg: ButtonSizeStyle;
}
export interface ButtonStyleSet {
  primary: ButtonVariantStyle;
  secondary: ButtonVariantStyle;
  ghost: ButtonVariantStyle;
  destructive: ButtonVariantStyle;
  gold: ButtonVariantStyle;
  teal: ButtonVariantStyle;
}
function makeButtonVariant(bg: string, labelColor: string, borderColor: string | undefined): ButtonVariantStyle {
  if (stryMutAct_9fa48("4995")) {
    {}
  } else {
    stryCov_9fa48("4995");
    const base = stryMutAct_9fa48("4996") ? {} : (stryCov_9fa48("4996"), {
      borderRadius: ButtonTokens.radius,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      flexDirection: 'row' as const,
      gap: ButtonTokens.iconGap,
      borderWidth: borderColor ? 1.5 : 0,
      borderColor: stryMutAct_9fa48("4997") ? borderColor && 'transparent' : (stryCov_9fa48("4997"), borderColor ?? (stryMutAct_9fa48("4998") ? "" : (stryCov_9fa48("4998"), 'transparent'))),
      backgroundColor: bg
    });
    return stryMutAct_9fa48("4999") ? {} : (stryCov_9fa48("4999"), {
      sm: stryMutAct_9fa48("5000") ? {} : (stryCov_9fa48("5000"), {
        container: stryMutAct_9fa48("5001") ? {} : (stryCov_9fa48("5001"), {
          ...base,
          height: ButtonTokens.height.sm,
          paddingHorizontal: ButtonTokens.paddingH.sm
        }),
        label: stryMutAct_9fa48("5002") ? {} : (stryCov_9fa48("5002"), {
          ...TextStyles.label,
          color: labelColor,
          fontSize: ButtonTokens.fontSize.sm
        })
      }),
      md: stryMutAct_9fa48("5003") ? {} : (stryCov_9fa48("5003"), {
        container: stryMutAct_9fa48("5004") ? {} : (stryCov_9fa48("5004"), {
          ...base,
          height: ButtonTokens.height.md,
          paddingHorizontal: ButtonTokens.paddingH.md
        }),
        label: stryMutAct_9fa48("5005") ? {} : (stryCov_9fa48("5005"), {
          ...TextStyles.label,
          color: labelColor,
          fontSize: ButtonTokens.fontSize.md
        })
      }),
      lg: stryMutAct_9fa48("5006") ? {} : (stryCov_9fa48("5006"), {
        container: stryMutAct_9fa48("5007") ? {} : (stryCov_9fa48("5007"), {
          ...base,
          height: ButtonTokens.height.lg,
          paddingHorizontal: ButtonTokens.paddingH.lg
        }),
        label: stryMutAct_9fa48("5008") ? {} : (stryCov_9fa48("5008"), {
          ...TextStyles.label,
          color: labelColor,
          fontSize: ButtonTokens.fontSize.lg
        })
      })
    });
  }
}
export function makeButtonStyles(colors: ColorTheme): ButtonStyleSet {
  if (stryMutAct_9fa48("5009")) {
    {}
  } else {
    stryCov_9fa48("5009");
    return stryMutAct_9fa48("5010") ? {} : (stryCov_9fa48("5010"), {
      primary: makeButtonVariant(colors.primary, stryMutAct_9fa48("5011") ? "" : (stryCov_9fa48("5011"), '#FFFFFF'), undefined),
      secondary: makeButtonVariant(colors.surface, colors.primary, colors.primary),
      ghost: makeButtonVariant(stryMutAct_9fa48("5012") ? "" : (stryCov_9fa48("5012"), 'transparent'), colors.primary, colors.border),
      destructive: makeButtonVariant(colors.error + (stryMutAct_9fa48("5013") ? "" : (stryCov_9fa48("5013"), '18')), colors.error, colors.error + (stryMutAct_9fa48("5014") ? "" : (stryCov_9fa48("5014"), '66'))),
      gold: makeButtonVariant(CultureTokens.gold, stryMutAct_9fa48("5015") ? "" : (stryCov_9fa48("5015"), '#1B0F2E'), undefined),
      teal: makeButtonVariant(CultureTokens.teal, stryMutAct_9fa48("5016") ? "" : (stryCov_9fa48("5016"), '#FFFFFF'), undefined)
    });
  }
}

// ---------------------------------------------------------------------------
// Pill / round button
// ---------------------------------------------------------------------------

export interface PillStyleSet {
  primary: ReturnType<typeof StyleSheet.create>[string];
  secondary: ReturnType<typeof StyleSheet.create>[string];
  label: {
    primary: ReturnType<typeof StyleSheet.create>[string];
    secondary: ReturnType<typeof StyleSheet.create>[string];
  };
}
export function makePillStyles(colors: ColorTheme): PillStyleSet {
  if (stryMutAct_9fa48("5017")) {
    {}
  } else {
    stryCov_9fa48("5017");
    const base = stryMutAct_9fa48("5018") ? {} : (stryCov_9fa48("5018"), {
      height: ButtonTokens.height.sm,
      borderRadius: ButtonTokens.radiusPill,
      paddingHorizontal: ButtonTokens.paddingH.md,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      flexDirection: 'row' as const,
      gap: ButtonTokens.iconGap
    });
    return stryMutAct_9fa48("5019") ? {} : (stryCov_9fa48("5019"), {
      primary: stryMutAct_9fa48("5020") ? {} : (stryCov_9fa48("5020"), {
        ...base,
        backgroundColor: colors.primary
      }),
      secondary: stryMutAct_9fa48("5021") ? {} : (stryCov_9fa48("5021"), {
        ...base,
        backgroundColor: colors.surface,
        borderWidth: 1.5,
        borderColor: colors.primary
      }),
      label: stryMutAct_9fa48("5022") ? {} : (stryCov_9fa48("5022"), {
        primary: stryMutAct_9fa48("5023") ? {} : (stryCov_9fa48("5023"), {
          ...TextStyles.label,
          color: stryMutAct_9fa48("5024") ? "" : (stryCov_9fa48("5024"), '#FFFFFF'),
          fontSize: ButtonTokens.fontSize.sm
        }),
        secondary: stryMutAct_9fa48("5025") ? {} : (stryCov_9fa48("5025"), {
          ...TextStyles.label,
          color: colors.primary,
          fontSize: ButtonTokens.fontSize.sm
        })
      })
    });
  }
}

// ---------------------------------------------------------------------------
// Input variants
// ---------------------------------------------------------------------------

export type InputState = 'default' | 'focused' | 'error' | 'disabled';
export interface InputStyleSet {
  default: ReturnType<typeof StyleSheet.create>[string];
  focused: ReturnType<typeof StyleSheet.create>[string];
  error: ReturnType<typeof StyleSheet.create>[string];
  disabled: ReturnType<typeof StyleSheet.create>[string];
  label: ReturnType<typeof StyleSheet.create>[string];
  helperText: ReturnType<typeof StyleSheet.create>[string];
  errorText: ReturnType<typeof StyleSheet.create>[string];
  placeholder: string; // color string for placeholder prop
}
export function makeInputStyles(colors: ColorTheme): InputStyleSet {
  if (stryMutAct_9fa48("5026")) {
    {}
  } else {
    stryCov_9fa48("5026");
    const base = stryMutAct_9fa48("5027") ? {} : (stryCov_9fa48("5027"), {
      height: InputTokens.height,
      borderRadius: InputTokens.radius,
      paddingHorizontal: InputTokens.paddingH,
      paddingVertical: InputTokens.paddingV,
      fontSize: InputTokens.fontSize,
      color: colors.text,
      backgroundColor: colors.surface,
      borderWidth: 1.5,
      borderColor: colors.border
    });
    return stryMutAct_9fa48("5028") ? {} : (stryCov_9fa48("5028"), {
      default: base,
      focused: stryMutAct_9fa48("5029") ? {} : (stryCov_9fa48("5029"), {
        ...base,
        borderColor: colors.primary,
        ...Elevation[1]
      }),
      error: stryMutAct_9fa48("5030") ? {} : (stryCov_9fa48("5030"), {
        ...base,
        borderColor: colors.error,
        backgroundColor: colors.error + (stryMutAct_9fa48("5031") ? "" : (stryCov_9fa48("5031"), '0A'))
      }),
      disabled: stryMutAct_9fa48("5032") ? {} : (stryCov_9fa48("5032"), {
        ...base,
        opacity: 0.5,
        borderColor: colors.borderLight
      }),
      label: stryMutAct_9fa48("5033") ? {} : (stryCov_9fa48("5033"), {
        ...TextStyles.label,
        color: colors.text,
        marginBottom: Spacing.xs
      }),
      helperText: stryMutAct_9fa48("5034") ? {} : (stryCov_9fa48("5034"), {
        ...TextStyles.caption,
        color: colors.textSecondary,
        marginTop: Spacing.xs
      }),
      errorText: stryMutAct_9fa48("5035") ? {} : (stryCov_9fa48("5035"), {
        ...TextStyles.caption,
        color: colors.error,
        marginTop: Spacing.xs
      }),
      placeholder: colors.textTertiary
    });
  }
}

// ---------------------------------------------------------------------------
// Chip / filter pill variants
// ---------------------------------------------------------------------------

export interface ChipStyleSet {
  default: ReturnType<typeof StyleSheet.create>[string];
  selected: ReturnType<typeof StyleSheet.create>[string];
  label: {
    default: ReturnType<typeof StyleSheet.create>[string];
    selected: ReturnType<typeof StyleSheet.create>[string];
  };
}
export function makeChipStyles(colors: ColorTheme): ChipStyleSet {
  if (stryMutAct_9fa48("5036")) {
    {}
  } else {
    stryCov_9fa48("5036");
    const base = stryMutAct_9fa48("5037") ? {} : (stryCov_9fa48("5037"), {
      height: ChipTokens.height,
      borderRadius: ChipTokens.radius,
      paddingHorizontal: ChipTokens.paddingH,
      paddingVertical: ChipTokens.paddingV,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      flexDirection: 'row' as const,
      gap: ChipTokens.gap,
      borderWidth: 1.5
    });
    return stryMutAct_9fa48("5038") ? {} : (stryCov_9fa48("5038"), {
      default: stryMutAct_9fa48("5039") ? {} : (stryCov_9fa48("5039"), {
        ...base,
        backgroundColor: colors.surface,
        borderColor: colors.border
      }),
      selected: stryMutAct_9fa48("5040") ? {} : (stryCov_9fa48("5040"), {
        ...base,
        backgroundColor: colors.primary + (stryMutAct_9fa48("5041") ? "" : (stryCov_9fa48("5041"), '18')),
        borderColor: colors.primary
      }),
      label: stryMutAct_9fa48("5042") ? {} : (stryCov_9fa48("5042"), {
        default: stryMutAct_9fa48("5043") ? {} : (stryCov_9fa48("5043"), {
          ...TextStyles.chip,
          color: colors.textSecondary
        }),
        selected: stryMutAct_9fa48("5044") ? {} : (stryCov_9fa48("5044"), {
          ...TextStyles.chip,
          color: colors.primary
        })
      })
    });
  }
}

// ---------------------------------------------------------------------------
// Badge / tag variants
// ---------------------------------------------------------------------------

export type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info' | 'gold' | 'teal' | 'coral' | 'free' | 'new';
export interface BadgeStyle {
  container: ReturnType<typeof StyleSheet.create>[string];
  label: ReturnType<typeof StyleSheet.create>[string];
}
export interface BadgeStyleSet extends Record<BadgeVariant, BadgeStyle> {
  /** Category-coloured badges (music, dance, food, etc.) */
  category: (category: keyof typeof CategoryColors) => BadgeStyle;
  /** Entity-type badges (community, artist, venue, etc.) */
  entity: (entityType: keyof typeof EntityTypeColors) => BadgeStyle;
}
function makeBadge(bg: string, labelColor: string): BadgeStyle {
  if (stryMutAct_9fa48("5045")) {
    {}
  } else {
    stryCov_9fa48("5045");
    return stryMutAct_9fa48("5046") ? {} : (stryCov_9fa48("5046"), {
      container: stryMutAct_9fa48("5047") ? {} : (stryCov_9fa48("5047"), {
        backgroundColor: bg,
        borderRadius: Radius.full,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 3,
        alignSelf: stryMutAct_9fa48("5048") ? "" : (stryCov_9fa48("5048"), 'flex-start'),
        alignItems: stryMutAct_9fa48("5049") ? "" : (stryCov_9fa48("5049"), 'center'),
        justifyContent: stryMutAct_9fa48("5050") ? "" : (stryCov_9fa48("5050"), 'center')
      }),
      label: stryMutAct_9fa48("5051") ? {} : (stryCov_9fa48("5051"), {
        ...TextStyles.badge,
        color: labelColor
      })
    });
  }
}
export function makeBadgeStyles(colors: ColorTheme): BadgeStyleSet {
  if (stryMutAct_9fa48("5052")) {
    {}
  } else {
    stryCov_9fa48("5052");
    return stryMutAct_9fa48("5053") ? {} : (stryCov_9fa48("5053"), {
      default: makeBadge(colors.surface, colors.textSecondary),
      primary: makeBadge(colors.primary, stryMutAct_9fa48("5054") ? "" : (stryCov_9fa48("5054"), '#FFFFFF')),
      success: makeBadge(colors.success + (stryMutAct_9fa48("5055") ? "" : (stryCov_9fa48("5055"), '20')), colors.success),
      warning: makeBadge(colors.warning + (stryMutAct_9fa48("5056") ? "" : (stryCov_9fa48("5056"), '20')), stryMutAct_9fa48("5057") ? "" : (stryCov_9fa48("5057"), '#8B5200')),
      error: makeBadge(colors.error + (stryMutAct_9fa48("5058") ? "" : (stryCov_9fa48("5058"), '18')), colors.error),
      info: makeBadge(colors.info + (stryMutAct_9fa48("5059") ? "" : (stryCov_9fa48("5059"), '18')), colors.info),
      gold: makeBadge(CultureTokens.gold + (stryMutAct_9fa48("5060") ? "" : (stryCov_9fa48("5060"), '25')), stryMutAct_9fa48("5061") ? "" : (stryCov_9fa48("5061"), '#7A5500')),
      teal: makeBadge(CultureTokens.teal + (stryMutAct_9fa48("5062") ? "" : (stryCov_9fa48("5062"), '20')), CultureTokens.teal),
      coral: makeBadge(CultureTokens.coral + (stryMutAct_9fa48("5063") ? "" : (stryCov_9fa48("5063"), '18')), CultureTokens.coral),
      free: makeBadge(colors.success + (stryMutAct_9fa48("5064") ? "" : (stryCov_9fa48("5064"), '15')), colors.success),
      new: makeBadge(CultureTokens.coral, stryMutAct_9fa48("5065") ? "" : (stryCov_9fa48("5065"), '#FFFFFF')),
      category: category => {
        if (stryMutAct_9fa48("5066")) {
          {}
        } else {
          stryCov_9fa48("5066");
          const color = CategoryColors[category];
          return makeBadge(color + (stryMutAct_9fa48("5067") ? "" : (stryCov_9fa48("5067"), '20')), color);
        }
      },
      entity: entityType => {
        if (stryMutAct_9fa48("5068")) {
          {}
        } else {
          stryCov_9fa48("5068");
          const color = EntityTypeColors[entityType];
          return makeBadge(color + (stryMutAct_9fa48("5069") ? "" : (stryCov_9fa48("5069"), '18')), color);
        }
      }
    });
  }
}

// ---------------------------------------------------------------------------
// Avatar
// ---------------------------------------------------------------------------

export type AvatarSize = keyof typeof AvatarTokens.size;
export interface AvatarStyleSet {
  xs: ReturnType<typeof StyleSheet.create>[string];
  sm: ReturnType<typeof StyleSheet.create>[string];
  md: ReturnType<typeof StyleSheet.create>[string];
  lg: ReturnType<typeof StyleSheet.create>[string];
  xl: ReturnType<typeof StyleSheet.create>[string];
  xxl: ReturnType<typeof StyleSheet.create>[string];
  placeholder: (size: AvatarSize) => ReturnType<typeof StyleSheet.create>[string];
  label: (size: AvatarSize) => ReturnType<typeof StyleSheet.create>[string];
}
export function makeAvatarStyles(colors: ColorTheme): AvatarStyleSet {
  if (stryMutAct_9fa48("5070")) {
    {}
  } else {
    stryCov_9fa48("5070");
    const make = stryMutAct_9fa48("5071") ? () => undefined : (stryCov_9fa48("5071"), (() => {
      const make = (size: AvatarSize) => stryMutAct_9fa48("5072") ? {} : (stryCov_9fa48("5072"), {
        width: AvatarTokens.size[size],
        height: AvatarTokens.size[size],
        borderRadius: AvatarTokens.radius,
        backgroundColor: colors.primaryGlow,
        overflow: 'hidden' as const,
        alignItems: 'center' as const,
        justifyContent: 'center' as const
      });
      return make;
    })());
    return stryMutAct_9fa48("5073") ? {} : (stryCov_9fa48("5073"), {
      xs: make(stryMutAct_9fa48("5074") ? "" : (stryCov_9fa48("5074"), 'xs')),
      sm: make(stryMutAct_9fa48("5075") ? "" : (stryCov_9fa48("5075"), 'sm')),
      md: make(stryMutAct_9fa48("5076") ? "" : (stryCov_9fa48("5076"), 'md')),
      lg: make(stryMutAct_9fa48("5077") ? "" : (stryCov_9fa48("5077"), 'lg')),
      xl: make(stryMutAct_9fa48("5078") ? "" : (stryCov_9fa48("5078"), 'xl')),
      xxl: make(stryMutAct_9fa48("5079") ? "" : (stryCov_9fa48("5079"), 'xxl')),
      placeholder: stryMutAct_9fa48("5080") ? () => undefined : (stryCov_9fa48("5080"), size => stryMutAct_9fa48("5081") ? {} : (stryCov_9fa48("5081"), {
        ...make(size),
        backgroundColor: colors.primary + (stryMutAct_9fa48("5082") ? "" : (stryCov_9fa48("5082"), '20'))
      })),
      label: stryMutAct_9fa48("5083") ? () => undefined : (stryCov_9fa48("5083"), size => stryMutAct_9fa48("5084") ? {} : (stryCov_9fa48("5084"), {
        ...TextStyles.badge,
        fontSize: AvatarTokens.fontSize[size],
        color: colors.primary
      }))
    });
  }
}

// ---------------------------------------------------------------------------
// Screen / layout containers
// ---------------------------------------------------------------------------

export interface ScreenStyleSet {
  /** Full-screen safe container */
  screen: ReturnType<typeof StyleSheet.create>[string];
  /** Padded scrollable content area */
  content: ReturnType<typeof StyleSheet.create>[string];
  /** Horizontal section padding */
  section: ReturnType<typeof StyleSheet.create>[string];
  /** Inline row with gap */
  row: ReturnType<typeof StyleSheet.create>[string];
  /** Divider line */
  divider: ReturnType<typeof StyleSheet.create>[string];
  /** Empty state container */
  emptyState: ReturnType<typeof StyleSheet.create>[string];
}
export function makeScreenStyles(colors: ColorTheme): ScreenStyleSet {
  if (stryMutAct_9fa48("5085")) {
    {}
  } else {
    stryCov_9fa48("5085");
    return stryMutAct_9fa48("5086") ? {} : (stryCov_9fa48("5086"), {
      screen: stryMutAct_9fa48("5087") ? {} : (stryCov_9fa48("5087"), {
        flex: 1,
        backgroundColor: colors.background
      }),
      content: stryMutAct_9fa48("5088") ? {} : (stryCov_9fa48("5088"), {
        flex: 1,
        paddingHorizontal: Spacing.md
      }),
      section: stryMutAct_9fa48("5089") ? {} : (stryCov_9fa48("5089"), {
        paddingHorizontal: Spacing.md
      }),
      row: stryMutAct_9fa48("5090") ? {} : (stryCov_9fa48("5090"), {
        flexDirection: stryMutAct_9fa48("5091") ? "" : (stryCov_9fa48("5091"), 'row'),
        alignItems: stryMutAct_9fa48("5092") ? "" : (stryCov_9fa48("5092"), 'center'),
        gap: Spacing.sm
      }),
      divider: stryMutAct_9fa48("5093") ? {} : (stryCov_9fa48("5093"), {
        height: StyleSheet.hairlineWidth,
        backgroundColor: colors.divider,
        marginVertical: Spacing.md
      }),
      emptyState: stryMutAct_9fa48("5094") ? {} : (stryCov_9fa48("5094"), {
        flex: 1,
        alignItems: stryMutAct_9fa48("5095") ? "" : (stryCov_9fa48("5095"), 'center'),
        justifyContent: stryMutAct_9fa48("5096") ? "" : (stryCov_9fa48("5096"), 'center'),
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.xxxl,
        gap: Spacing.md
      })
    });
  }
}

// ---------------------------------------------------------------------------
// Section header (rail title + "See All" row)
// ---------------------------------------------------------------------------

export interface SectionHeaderStyleSet {
  row: ReturnType<typeof StyleSheet.create>[string];
  title: ReturnType<typeof StyleSheet.create>[string];
  seeAll: ReturnType<typeof StyleSheet.create>[string];
}
export function makeSectionHeaderStyles(colors: ColorTheme): SectionHeaderStyleSet {
  if (stryMutAct_9fa48("5097")) {
    {}
  } else {
    stryCov_9fa48("5097");
    return stryMutAct_9fa48("5098") ? {} : (stryCov_9fa48("5098"), {
      row: stryMutAct_9fa48("5099") ? {} : (stryCov_9fa48("5099"), {
        flexDirection: stryMutAct_9fa48("5100") ? "" : (stryCov_9fa48("5100"), 'row'),
        alignItems: stryMutAct_9fa48("5101") ? "" : (stryCov_9fa48("5101"), 'center'),
        justifyContent: stryMutAct_9fa48("5102") ? "" : (stryCov_9fa48("5102"), 'space-between'),
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm
      }),
      title: stryMutAct_9fa48("5103") ? {} : (stryCov_9fa48("5103"), {
        ...TextStyles.title3,
        color: colors.text,
        flex: 1
      }),
      seeAll: stryMutAct_9fa48("5104") ? {} : (stryCov_9fa48("5104"), {
        ...TextStyles.label,
        color: colors.primary
      })
    });
  }
}

// ---------------------------------------------------------------------------
// Modal / bottom sheet
// ---------------------------------------------------------------------------

export interface ModalStyleSet {
  overlay: ReturnType<typeof StyleSheet.create>[string];
  sheet: ReturnType<typeof StyleSheet.create>[string];
  handle: ReturnType<typeof StyleSheet.create>[string];
  header: ReturnType<typeof StyleSheet.create>[string];
  title: ReturnType<typeof StyleSheet.create>[string];
}
export function makeModalStyles(colors: ColorTheme): ModalStyleSet {
  if (stryMutAct_9fa48("5105")) {
    {}
  } else {
    stryCov_9fa48("5105");
    return stryMutAct_9fa48("5106") ? {} : (stryCov_9fa48("5106"), {
      overlay: stryMutAct_9fa48("5107") ? {} : (stryCov_9fa48("5107"), {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: stryMutAct_9fa48("5108") ? "" : (stryCov_9fa48("5108"), 'rgba(0,0,0,0.45)'),
        zIndex: ZIndex.overlay
      }),
      sheet: stryMutAct_9fa48("5109") ? {} : (stryCov_9fa48("5109"), {
        backgroundColor: colors.surface,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingBottom: Spacing.xxxl,
        ...Elevation[4]
      }),
      handle: stryMutAct_9fa48("5110") ? {} : (stryCov_9fa48("5110"), {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: colors.border,
        alignSelf: stryMutAct_9fa48("5111") ? "" : (stryCov_9fa48("5111"), 'center'),
        marginTop: Spacing.sm,
        marginBottom: Spacing.md
      }),
      header: stryMutAct_9fa48("5112") ? {} : (stryCov_9fa48("5112"), {
        flexDirection: stryMutAct_9fa48("5113") ? "" : (stryCov_9fa48("5113"), 'row'),
        alignItems: stryMutAct_9fa48("5114") ? "" : (stryCov_9fa48("5114"), 'center'),
        justifyContent: stryMutAct_9fa48("5115") ? "" : (stryCov_9fa48("5115"), 'space-between'),
        paddingHorizontal: Spacing.md,
        paddingBottom: Spacing.md,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.divider
      }),
      title: stryMutAct_9fa48("5116") ? {} : (stryCov_9fa48("5116"), {
        ...TextStyles.title3,
        color: colors.text
      })
    });
  }
}

// ---------------------------------------------------------------------------
// List / menu items
// ---------------------------------------------------------------------------

export interface ListItemStyleSet {
  row: ReturnType<typeof StyleSheet.create>[string];
  rowDestructive: ReturnType<typeof StyleSheet.create>[string];
  iconContainer: ReturnType<typeof StyleSheet.create>[string];
  label: ReturnType<typeof StyleSheet.create>[string];
  labelDestructive: ReturnType<typeof StyleSheet.create>[string];
  sublabel: ReturnType<typeof StyleSheet.create>[string];
  separator: ReturnType<typeof StyleSheet.create>[string];
}
export function makeListItemStyles(colors: ColorTheme): ListItemStyleSet {
  if (stryMutAct_9fa48("5117")) {
    {}
  } else {
    stryCov_9fa48("5117");
    return stryMutAct_9fa48("5118") ? {} : (stryCov_9fa48("5118"), {
      row: stryMutAct_9fa48("5119") ? {} : (stryCov_9fa48("5119"), {
        flexDirection: stryMutAct_9fa48("5120") ? "" : (stryCov_9fa48("5120"), 'row'),
        alignItems: stryMutAct_9fa48("5121") ? "" : (stryCov_9fa48("5121"), 'center'),
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.md,
        gap: Spacing.md,
        backgroundColor: colors.surface
      }),
      rowDestructive: stryMutAct_9fa48("5122") ? {} : (stryCov_9fa48("5122"), {
        flexDirection: stryMutAct_9fa48("5123") ? "" : (stryCov_9fa48("5123"), 'row'),
        alignItems: stryMutAct_9fa48("5124") ? "" : (stryCov_9fa48("5124"), 'center'),
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.md,
        gap: Spacing.md,
        backgroundColor: colors.surface
      }),
      iconContainer: stryMutAct_9fa48("5125") ? {} : (stryCov_9fa48("5125"), {
        width: IconSize.xl,
        height: IconSize.xl,
        borderRadius: Radius.sm,
        backgroundColor: colors.primaryGlow,
        alignItems: stryMutAct_9fa48("5126") ? "" : (stryCov_9fa48("5126"), 'center'),
        justifyContent: stryMutAct_9fa48("5127") ? "" : (stryCov_9fa48("5127"), 'center')
      }),
      label: stryMutAct_9fa48("5128") ? {} : (stryCov_9fa48("5128"), {
        ...TextStyles.body,
        color: colors.text,
        flex: 1
      }),
      labelDestructive: stryMutAct_9fa48("5129") ? {} : (stryCov_9fa48("5129"), {
        ...TextStyles.body,
        color: colors.error,
        flex: 1
      }),
      sublabel: stryMutAct_9fa48("5130") ? {} : (stryCov_9fa48("5130"), {
        ...TextStyles.caption,
        color: colors.textSecondary
      }),
      separator: stryMutAct_9fa48("5131") ? {} : (stryCov_9fa48("5131"), {
        height: StyleSheet.hairlineWidth,
        backgroundColor: colors.divider,
        marginLeft: stryMutAct_9fa48("5132") ? Spacing.md + IconSize.xl - Spacing.md : (stryCov_9fa48("5132"), (stryMutAct_9fa48("5133") ? Spacing.md - IconSize.xl : (stryCov_9fa48("5133"), Spacing.md + IconSize.xl)) + Spacing.md)
      })
    });
  }
}

// ---------------------------------------------------------------------------
// Status / empty / loading states
// ---------------------------------------------------------------------------

export interface StateStyleSet {
  loadingContainer: ReturnType<typeof StyleSheet.create>[string];
  errorContainer: ReturnType<typeof StyleSheet.create>[string];
  errorTitle: ReturnType<typeof StyleSheet.create>[string];
  errorBody: ReturnType<typeof StyleSheet.create>[string];
  emptyTitle: ReturnType<typeof StyleSheet.create>[string];
  emptyBody: ReturnType<typeof StyleSheet.create>[string];
}
export function makeStateStyles(colors: ColorTheme): StateStyleSet {
  if (stryMutAct_9fa48("5134")) {
    {}
  } else {
    stryCov_9fa48("5134");
    return stryMutAct_9fa48("5135") ? {} : (stryCov_9fa48("5135"), {
      loadingContainer: stryMutAct_9fa48("5136") ? {} : (stryCov_9fa48("5136"), {
        flex: 1,
        alignItems: stryMutAct_9fa48("5137") ? "" : (stryCov_9fa48("5137"), 'center'),
        justifyContent: stryMutAct_9fa48("5138") ? "" : (stryCov_9fa48("5138"), 'center'),
        paddingVertical: Spacing.xxxl
      }),
      errorContainer: stryMutAct_9fa48("5139") ? {} : (stryCov_9fa48("5139"), {
        alignItems: stryMutAct_9fa48("5140") ? "" : (stryCov_9fa48("5140"), 'center'),
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.xxxl,
        gap: Spacing.md
      }),
      errorTitle: stryMutAct_9fa48("5141") ? {} : (stryCov_9fa48("5141"), {
        ...TextStyles.title3,
        color: colors.error,
        textAlign: stryMutAct_9fa48("5142") ? "" : (stryCov_9fa48("5142"), 'center')
      }),
      errorBody: stryMutAct_9fa48("5143") ? {} : (stryCov_9fa48("5143"), {
        ...TextStyles.body,
        color: colors.textSecondary,
        textAlign: stryMutAct_9fa48("5144") ? "" : (stryCov_9fa48("5144"), 'center')
      }),
      emptyTitle: stryMutAct_9fa48("5145") ? {} : (stryCov_9fa48("5145"), {
        ...TextStyles.title3,
        color: colors.text,
        textAlign: stryMutAct_9fa48("5146") ? "" : (stryCov_9fa48("5146"), 'center')
      }),
      emptyBody: stryMutAct_9fa48("5147") ? {} : (stryCov_9fa48("5147"), {
        ...TextStyles.callout,
        color: colors.textSecondary,
        textAlign: stryMutAct_9fa48("5148") ? "" : (stryCov_9fa48("5148"), 'center')
      })
    });
  }
}

// ---------------------------------------------------------------------------
// Full theme factory object
// ---------------------------------------------------------------------------

export interface ThemeFactory {
  card: CardStyleSet;
  button: ButtonStyleSet;
  pill: PillStyleSet;
  input: InputStyleSet;
  chip: ChipStyleSet;
  badge: BadgeStyleSet;
  avatar: AvatarStyleSet;
  screen: ScreenStyleSet;
  sectionHeader: SectionHeaderStyleSet;
  modal: ModalStyleSet;
  listItem: ListItemStyleSet;
  state: StateStyleSet;
  /** Convenience: current color theme */
  colors: ColorTheme;
}

/**
 * Build a complete ThemeFactory from a ColorTheme.
 * Pure function — call from `useThemeFactory()` or test utilities.
 */
export function buildThemeFactory(colors: ColorTheme): ThemeFactory {
  if (stryMutAct_9fa48("5149")) {
    {}
  } else {
    stryCov_9fa48("5149");
    return stryMutAct_9fa48("5150") ? {} : (stryCov_9fa48("5150"), {
      card: makeCardStyles(colors),
      button: makeButtonStyles(colors),
      pill: makePillStyles(colors),
      input: makeInputStyles(colors),
      chip: makeChipStyles(colors),
      badge: makeBadgeStyles(colors),
      avatar: makeAvatarStyles(colors),
      screen: makeScreenStyles(colors),
      sectionHeader: makeSectionHeaderStyles(colors),
      modal: makeModalStyles(colors),
      listItem: makeListItemStyles(colors),
      state: makeStateStyles(colors),
      colors
    });
  }
}

// ---------------------------------------------------------------------------
// React hook — primary usage in components
// ---------------------------------------------------------------------------

/**
 * Returns a complete set of theme-aware style factories for the active theme.
 *
 * @example
 * const tf = useThemeFactory();
 * return (
 *   <Pressable style={tf.button.primary.md.container}>
 *     <Text style={tf.button.primary.md.label}>Book Now</Text>
 *   </Pressable>
 * );
 */
export function useThemeFactory(): ThemeFactory {
  if (stryMutAct_9fa48("5151")) {
    {}
  } else {
    stryCov_9fa48("5151");
    const colors = useColors();
    return buildThemeFactory(colors);
  }
}
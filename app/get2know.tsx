import React, { useRef, useEffect, useState, useCallback, memo } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  Pressable,
  Animated,
  Platform,
  AccessibilityInfo,
} from "react-native";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";

import { useColors } from "@/hooks/useColors";
import { CultureTokens, Spacing, gradients, type ColorTheme } from "@/constants/theme";

// ─── Data ────────────────────────────────────────────────────────────────────

const CULTURES = [
  { label: "🇮🇳 Indian",     tint: "#FF9933" },
  { label: "🇰🇷 Korean",     tint: "#CD2E3A" },
  { label: "🇦🇺 Aboriginal", tint: "#FFB700" },
  { label: "🇬🇷 Greek",      tint: "#0D5EAF" },
  { label: "🇱🇧 Lebanese",   tint: "#009A44" },
  { label: "🇫🇷 French",     tint: "#002395" },
  { label: "🇵🇭 Filipino",   tint: "#0038A8" },
  { label: "🇪🇺 European",   tint: "#003399" },
  { label: "🇿🇦 African",    tint: "#007A4D" },
  { label: "🇨🇳 Chinese",    tint: "#DE2910" },
  { label: "🇮🇹 Italian",    tint: "#009246" },
];

const PROBLEMS = [
  "Events scattered across social media",
  "Communities operating in silos",
  "People missing events they would love",
  "Artists struggling to reach audiences",
];

const EVENTS = [
  { title: "Diwali Festival",        city: "Sydney",    icon: "🪔" },
  { title: "Korean Film Night",      city: "Melbourne", icon: "🎬" },
  { title: "African Music Festival", city: "Brisbane",  icon: "🎶" },
  { title: "Greek Food Fair",        city: "Perth",     icon: "🫒" },
];

// ─── Types ────────────────────────────────────────────────────────────────────

type CultureChipProps = {
  culture: { label: string; tint: string };
  styles: ReturnType<typeof getStyles>;
  colors: ColorTheme;
};

type StatProps = {
  number: string;
  label: string;
  target: number;
};

// ─── Animated Section Wrapper ─────────────────────────────────────────────────

function FadeInView({
  children,
  delay = 0,
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  style?: any;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 500,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        delay,
        useNativeDriver: true,
        friction: 7,
      }),
    ]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Animated.View style={[style, { opacity, transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
}

// ─── Animated Stat Counter ────────────────────────────────────────────────────

function Stat({ number, label, target }: StatProps) {
  const [count, setCount] = useState(0);
  const animVal = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let isMounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
      if (!isMounted) return;
      if (reduced) {
        setCount(target);
        return;
      }
      const animation = Animated.timing(animVal, {
        toValue: target,
        duration: 1400,
        delay: 300,
        useNativeDriver: false,
      });
      const listenerId = animVal.addListener(({ value }) => {
        if (isMounted) setCount(Math.floor(value));
      });
      animation.start();
      return () => {
        animation.stop();
        animVal.removeListener(listenerId);
      };
    });
    return () => {
      isMounted = false;
      animVal.removeAllListeners();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const suffix = number.replace(/[0-9]/g, "");

  return (
    <View style={{ alignItems: "center", flex: 1 }}>
      <Text style={statStyles.number}>
        {count}
        {suffix}
      </Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  number: {
    fontSize: 30,
    fontWeight: "700",
    color: CultureTokens.gold,
    fontFamily: "Poppins_700Bold",
  },
  label: {
    fontSize: 12,
    color: "rgba(255,255,255,0.85)",
    fontFamily: "Poppins_500Medium",
    marginTop: 2,
  },
});

// ─── Culture Chip ─────────────────────────────────────────────────────────────

const CultureChip = memo(function CultureChip({ culture, styles, colors }: CultureChipProps) {
  const router = useRouter();
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = useCallback(() =>
    Animated.spring(scale, {
      toValue: 0.92,
      useNativeDriver: true,
      friction: 5,
    }).start(), [scale]);

  const pressOut = useCallback(() =>
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      friction: 5,
    }).start(), [scale]);

  const handlePress = useCallback(() => {
    Haptics.selectionAsync();
    // Encode the label for URL-safe routing (e.g. "🇮🇳 Indian" -> "Indian")
    const slug = culture.label.replace(/[^\w\s]/gu, "").trim().replace(/\s+/g, "-").toLowerCase();
    router.push(`/search?culture=${slug}`);
  }, [culture.label, router]);

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        style={({ pressed }) => [
          styles.globeChip,
          { borderColor: culture.tint + "55" },
          pressed && { backgroundColor: culture.tint + "22" },
        ]}
        onPressIn={pressIn}
        onPressOut={pressOut}
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={`Explore ${culture.label} culture`}
        android_ripple={{ color: culture.tint + "33", borderless: false }}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={styles.globeChipText}>{culture.label}</Text>
      </Pressable>
    </Animated.View>
  );
});

// ─── Event Card ───────────────────────────────────────────────────────────────

const EventCard = memo(function EventCard({
  event,
  styles,
  colors,
  cardWidth,
}: {
  event: (typeof EVENTS)[0];
  styles: ReturnType<typeof getStyles>;
  colors: ColorTheme;
  cardWidth: number;
}) {
  const router = useRouter();
  return (
    <Pressable
      style={({ pressed }) => [
        styles.eventCard,
        { width: cardWidth },
        pressed && styles.eventCardPressed,
      ]}
      onPress={() => {
        Haptics.selectionAsync();
        const slug = event.title.toLowerCase().replace(/\s+/g, "-");
        router.push(`/event/${slug}`);
      }}
      accessibilityRole="button"
      accessibilityLabel={`View ${event.title} in ${event.city}`}
      android_ripple={{ color: "rgba(0,0,0,0.05)", borderless: false }}
    >
      <LinearGradient
        colors={[CultureTokens.indigo, CultureTokens.gold]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.eventCardAccent}
      />
      <View style={styles.eventIconPill}>
        <Text style={{ fontSize: 16 }}>{event.icon}</Text>
        <Text style={styles.eventTagText}>Featured</Text>
      </View>
      <Text style={styles.eventTitle}>{event.title}</Text>
      <View style={styles.eventLocation}>
        <Ionicons name="location-outline" size={13} color={colors.textSecondary} />
        <Text style={styles.eventCity}>{event.city}</Text>
      </View>
      <Text style={styles.eventMeta}>
        Handpicked cultural experiences hosted by local communities.
      </Text>
      <View style={styles.eventCTA}>
        <Text style={styles.eventCTAText}>View event</Text>
        <Ionicons name="arrow-forward" size={13} color={CultureTokens.indigo} />
      </View>
    </Pressable>
  );
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function Get2KnowCulturePass() {
  const colors = useColors();
  const styles = getStyles(colors);
  const router = useRouter();
  const { width } = Dimensions.get("window");
  const isDesktop = width >= 1024;
  const eventCardWidth = isDesktop ? 230 : Math.min(width * 0.72, 260);

  // Pulse animation for primary CTA
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    let reduced = false;
    AccessibilityInfo.isReduceMotionEnabled().then((r) => { reduced = r; });
    if (reduced) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.03, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1,    duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleExplorePress = useCallback(() => {
    Haptics.selectionAsync();
    router.push("/signup");
  }, [router]);

  const handleEventsPress = useCallback(() => {
    Haptics.selectionAsync();
    router.push("/events");
  }, [router]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
    >
      {/* ── HERO ── */}
      <LinearGradient
        colors={
          gradients.culturepassBrand ?? [
            CultureTokens.indigo,
            CultureTokens.gold,
            CultureTokens.coral,
          ]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <View style={styles.heroOverlay} />

        <FadeInView style={styles.heroContent}>
          {/* Pill badge */}
          <View style={styles.heroTopPillWrapper}>
            <View style={styles.heroPill}>
              <Ionicons name="sparkles-outline" size={14} color="white" />
              <Text style={styles.heroPillText}>Global cultural community</Text>
            </View>
          </View>

          <Ionicons
            name="earth"
            size={isDesktop ? 64 : 52}
            color="white"
            style={{ opacity: 0.95, marginBottom: 6 }}
          />

          {/* Fix: use template literal for actual newline instead of escaped "\\n" */}
          <Text style={styles.heroTitle}>{`Discover Your Culture.\nBelong Anywhere.`}</Text>

          <Text style={styles.heroSubtitle}>
            A global platform connecting people through culture, community and
            shared experiences.
          </Text>

          {/* Card */}
          <View style={styles.heroCard}>
            <Text style={styles.heroBody}>
              Find events, join communities and meet people who share your
              story — wherever you are.
            </Text>

            {/* Stats */}
            <View style={styles.heroStatsRow}>
              <Stat number="195+" label="Countries" target={195} />
              <View style={styles.heroDivider} />
              <Stat number="500+" label="Cultures"  target={500} />
              <View style={styles.heroDivider} />
              <Stat number="7000+" label="Languages" target={7000} />
            </View>

            {/* PRIMARY CTA */}
            {Platform.OS === "web" ? (
              <a
                href="/signup"
                style={{ textDecoration: "none", display: "block" }}
                aria-label="Get started with CulturePass"
              >
                <div
                  style={{
                    marginTop: 4,
                    backgroundColor: "black",
                    paddingTop: 14,
                    paddingBottom: 14,
                    paddingLeft: 24,
                    paddingRight: 24,
                    borderRadius: 999,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    minHeight: 48,
                    cursor: "pointer",
                  }}
                >
                  <span style={{ color: "white", fontSize: 16, fontFamily: "Poppins_600SemiBold", fontWeight: 600 }}>
                    Get started
                  </span>
                  <Ionicons name="arrow-forward" size={18} color="white" />
                </div>
              </a>
            ) : (
              <Animated.View style={{ transform: [{ scale: pulse }] }}>
                <Pressable
                  style={({ pressed }) => [
                    styles.heroPrimaryBtn,
                    pressed && styles.heroPrimaryBtnPressed,
                  ]}
                  onPress={handleExplorePress}
                  accessibilityRole="button"
                  accessibilityLabel="Get started with CulturePass"
                  android_ripple={{ color: "rgba(255,255,255,0.18)", borderless: false }}
                >
                  <Text style={styles.heroPrimaryBtnText}>Get started</Text>
                  <Ionicons name="arrow-forward" size={18} color="white" />
                </Pressable>
              </Animated.View>
            )}

            {/* SECONDARY CTA */}
            {Platform.OS === "web" ? (
              <a
                href="/events"
                style={{ textDecoration: "none", display: "block" }}
                aria-label="See all events"
              >
                <div
                  style={{
                    marginTop: 10,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    paddingTop: 10,
                    paddingBottom: 10,
                    paddingLeft: 14,
                    paddingRight: 14,
                    borderRadius: 999,
                    border: "1px solid rgba(255,255,255,0.7)",
                    minHeight: 44,
                    cursor: "pointer",
                  }}
                >
                  <Ionicons name="location-outline" size={16} color="rgba(255,255,255,0.96)" />
                  <span style={{ fontSize: 14, color: "rgba(255,255,255,0.96)", fontFamily: "Poppins_500Medium" }}>
                    See events near you
                  </span>
                </div>
              </a>
            ) : (
              <Pressable
                style={styles.heroSecondaryBtn}
                onPress={handleEventsPress}
                accessibilityRole="button"
                accessibilityLabel="See nearby cultural events"
                android_ripple={{ color: "rgba(255,255,255,0.12)", borderless: false }}
              >
                <Ionicons name="location-outline" size={16} color="rgba(255,255,255,0.96)" />
                <Text style={styles.heroSecondaryBtnText}>See events near you</Text>
              </Pressable>
            )}
          </View>

          {/* Social proof */}
          <FadeInView delay={400} style={styles.socialProof}>
            <View style={styles.socialAvatarRow}>
              {["🧑🏾", "👩🏻", "👨🏽", "👩🏿"].map((emoji, i) => (
                <View
                  key={i}
                  style={[styles.socialAvatar, { marginLeft: i === 0 ? 0 : -10 }]}
                >
                  <Text style={{ fontSize: 18 }}>{emoji}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.socialProofText}>
              Join 1,000,000+ people discovering culture
            </Text>
          </FadeInView>
        </FadeInView>
      </LinearGradient>

      {/* ── CULTURE GLOBE ── */}
      <FadeInView delay={100}>
        <View style={styles.sectionCenter}>
          <View style={styles.sectionIconCircle}>
            <Ionicons name="earth-outline" size={28} color={CultureTokens.gold} />
          </View>
          <Text style={styles.sectionTitleCenter}>Explore Cultures Around the World</Text>
          <Text style={styles.sectionDesc}>
            Tap a culture to discover communities, events and stories tailored to you.
          </Text>
          {/* Horizontal scroll on mobile, wrap on desktop */}
          {isDesktop ? (
            <View style={styles.globeGrid}>
              {CULTURES.map((c) => (
                <CultureChip key={c.label} culture={c} styles={styles} colors={colors} />
              ))}
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.globeScrollRow}
            >
              {CULTURES.map((c) => (
                <CultureChip key={c.label} culture={c} styles={styles} colors={colors} />
              ))}
            </ScrollView>
          )}
        </View>
      </FadeInView>

      {/* ── WHY CULTUREPASS ── */}
      <FadeInView delay={120}>
        <View style={styles.section}>
          <Text style={styles.sectionTitleCenter}>Why CulturePass Exists</Text>
          <Text style={styles.sectionSub}>
            Culture today is scattered across feeds, chats and flyers. We bring it into one dedicated home.
          </Text>

          <View style={styles.problemGrid}>
            {PROBLEMS.map((p) => (
              <View key={p} style={styles.problemCard}>
                <View style={styles.problemIconCircle}>
                  <Ionicons name="alert-circle-outline" size={20} color={CultureTokens.coral} />
                </View>
                <Text style={styles.problemText}>{p}</Text>
              </View>
            ))}
          </View>

          <View style={styles.solutionCard}>
            <LinearGradient
              colors={[CultureTokens.indigo + "22", CultureTokens.gold + "22"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.solutionGradientBg}
            />
            <View style={styles.solutionIconCircle}>
              <Ionicons name="sparkles-outline" size={24} color={CultureTokens.gold} />
            </View>
            <Text style={styles.solutionTitle}>CulturePass connects it all.</Text>
            <Text style={styles.solutionText}>
              One place to discover cultures, follow communities and never miss the moments that matter to you.
            </Text>
          </View>
        </View>
      </FadeInView>

      {/* ── COMMUNITY MAP ── */}
      <FadeInView delay={140}>
        <View style={styles.section}>
          <Text style={styles.sectionTitleCenter}>Communities Near You</Text>
          <Text style={styles.sectionSub}>
            See cultural hubs, venues and communities around your city at a glance.
          </Text>
          <View style={styles.mapPlaceholder}>
            <LinearGradient
              colors={[colors.surface, colors.surfaceElevated]}
              style={StyleSheet.absoluteFillObject}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
            />
            <Ionicons name="map-outline" size={56} color={colors.textSecondary} />
            <Text style={styles.mapText}>Interactive cultural map coming soon</Text>
            <Text style={styles.mapSubText}>
              Zoom into any city to see what&apos;s happening this week.
            </Text>
            <View style={styles.mapComingSoonPill}>
              <Text style={styles.mapComingSoonText}>🚀 Coming Soon</Text>
            </View>
          </View>
        </View>
      </FadeInView>

      {/* ── EVENTS ── */}
      <FadeInView delay={160}>
        <View style={styles.section}>
          <Text style={styles.sectionTitleCenter}>Live Cultural Events</Text>
          <Text style={styles.sectionSub}>
            From festivals and food fairs to film nights and concerts — curated for you.
          </Text>
          {/* Horizontal swipeable on mobile, grid on desktop */}
          {isDesktop ? (
            <View style={styles.grid}>
              {EVENTS.map((e) => (
                <EventCard
                  key={e.title}
                  event={e}
                  styles={styles}
                  colors={colors}
                  cardWidth={eventCardWidth}
                />
              ))}
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 4, gap: 12 }}
              decelerationRate="fast"
              snapToInterval={eventCardWidth + 12}
              snapToAlignment="start"
            >
              {EVENTS.map((e) => (
                <EventCard
                  key={e.title}
                  event={e}
                  styles={styles}
                  colors={colors}
                  cardWidth={eventCardWidth}
                />
              ))}
            </ScrollView>
          )}
        </View>
      </FadeInView>

      {/* ── VISION ── */}
      <FadeInView delay={180}>
        <View style={styles.visionSection}>
          <LinearGradient
            colors={[CultureTokens.indigo, "#1a0533"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          <Ionicons
            name="earth"
            size={36}
            color="white"
            style={{ opacity: 0.5, marginBottom: 16 }}
          />
          <Text style={styles.visionTitle}>The Vision</Text>
          <Text style={styles.visionText}>
            CulturePass is building the global discovery platform for culture —
            where every community is discoverable, every culture is celebrated
            and no one has to go searching across ten different apps to feel at
            home.
          </Text>
        </View>
      </FadeInView>

      {/* ── FINAL CTA ── */}
      <FadeInView delay={200}>
        <View style={styles.ctaSection}>
          <Text style={styles.ctaTitle}>Ready to Explore Your Culture?</Text>
          <Text style={styles.ctaSubtitle}>
            Create your profile, pick your cultures and start discovering events in minutes.
          </Text>

          {Platform.OS === "web" ? (
            <a href="/signup" style={{ textDecoration: "none", display: "block", width: "100%", maxWidth: 320 }} aria-label="Explore CulturePass">
              <Pressable
                style={({ pressed }) => [styles.ctaBtn, pressed && styles.ctaBtnPressed]}
              >
                <Text style={styles.ctaBtnText}>Explore CulturePass</Text>
                <Ionicons name="arrow-forward" size={18} color="white" />
              </Pressable>
            </a>
          ) : (
            <Pressable
              style={({ pressed }) => [styles.ctaBtn, pressed && styles.ctaBtnPressed]}
              onPress={handleExplorePress}
              accessibilityRole="button"
              accessibilityLabel="Explore CulturePass"
              android_ripple={{ color: "rgba(255,255,255,0.15)", borderless: false }}
            >
              <Text style={styles.ctaBtnText}>Explore CulturePass</Text>
              <Ionicons name="arrow-forward" size={18} color="white" />
            </Pressable>
          )}

          {Platform.OS === "web" ? (
            <a href="/events" style={{ textDecoration: "none" }} aria-label="See how CulturePass works">
              <Pressable style={styles.ctaSecondary}>
                <Text style={styles.ctaSecondaryText}>See how it works</Text>
              </Pressable>
            </a>
          ) : (
            <Pressable
              onPress={handleEventsPress}
              style={styles.ctaSecondary}
              accessibilityRole="button"
              accessibilityLabel="Learn how CulturePass works"
            >
              <Text style={styles.ctaSecondaryText}>See how it works</Text>
            </Pressable>
          )}
        </View>
      </FadeInView>
    </ScrollView>
  );
}

/* ─── Styles ──────────────────────────────────────────────────────────────── */

const getStyles = (colors: ColorTheme) =>
  StyleSheet.create({
    hero: {
      minHeight: 580,
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: 80,
      paddingHorizontal: 20,
    },
    heroOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0,0,0,0.28)",
    },
    heroContent: {
      width: "100%",
      alignItems: "center",
    },
    heroTopPillWrapper: {
      marginBottom: 16,
    },
    heroPill: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 14,
      paddingVertical: 6,
      backgroundColor: "rgba(0,0,0,0.45)",
      borderRadius: 999,
      gap: 6,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(255,255,255,0.3)",
    },
    heroPillText: {
      fontSize: 12,
      color: "white",
      fontFamily: "Poppins_500Medium",
      letterSpacing: 0.4,
    },
    heroTitle: {
      fontSize: Platform.OS === "web" ? 52 : 34,
      fontFamily: "Poppins_700Bold",
      color: "white",
      textAlign: "center",
      marginTop: 14,
      lineHeight: Platform.OS === "web" ? 62 : 42,
      maxWidth: 720,
    },
    heroSubtitle: {
      fontSize: 16,
      color: "rgba(255,255,255,0.9)",
      textAlign: "center",
      marginTop: 12,
      maxWidth: 580,
      lineHeight: 24,
      fontFamily: "Poppins_400Regular",
    },
    heroCard: {
      backgroundColor: "rgba(0,0,0,0.52)",
      padding: 22,
      borderRadius: 26,
      marginTop: 26,
      maxWidth: 680,
      width: "100%",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(255,255,255,0.2)",
      gap: 0,
      // Elevated shadow for card depth
      ...Platform.select({
        ios: { shadowColor: "black", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16 },
        android: { elevation: 10 },
      }),
    },
    heroBody: {
      fontSize: 15,
      lineHeight: 23,
      color: "rgba(255,255,255,0.92)",
      textAlign: "center",
      marginBottom: 18,
      fontFamily: "Poppins_400Regular",
    },
    heroStatsRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 20,
      marginTop: 4,
    },
    heroDivider: {
      width: 1,
      height: 28,
      backgroundColor: "rgba(255,255,255,0.2)",
    },
    heroPrimaryBtn: {
      marginTop: 4,
      backgroundColor: "black",
      paddingVertical: 14,
      paddingHorizontal: 24,
      borderRadius: 999,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      minHeight: 50,
      alignSelf: "stretch",
      // Shadow for button depth
      ...Platform.select({
        ios: { shadowColor: CultureTokens.indigo, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8 },
        android: { elevation: 6 },
      }),
    },
    heroPrimaryBtnPressed: {
      opacity: 0.85,
      transform: [{ scale: 0.97 }],
    },
    heroPrimaryBtnText: {
      color: "white",
      fontSize: 16,
      fontFamily: "Poppins_600SemiBold",
    },
    heroSecondaryBtn: {
      marginTop: 10,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.65)",
      minHeight: 44,
      alignSelf: "center",
    },
    heroSecondaryBtnText: {
      fontSize: 14,
      color: "rgba(255,255,255,0.96)",
      fontFamily: "Poppins_500Medium",
    },
    socialProof: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 20,
      gap: 10,
    },
    socialAvatarRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    socialAvatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: "rgba(255,255,255,0.15)",
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1.5,
      borderColor: "rgba(255,255,255,0.6)",
    },
    socialProofText: {
      fontSize: 13,
      color: "rgba(255,255,255,0.85)",
      fontFamily: "Poppins_500Medium",
    },
    section: {
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing.xl,
    },
    sectionCenter: {
      alignItems: "center",
      paddingVertical: 60,
      paddingHorizontal: 20,
    },
    sectionIconCircle: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: colors.surface,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    sectionTitleCenter: {
      fontSize: 26,
      fontFamily: "Poppins_700Bold",
      textAlign: "center",
      marginBottom: 10,
      color: colors.text,
    },
    sectionDesc: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: "center",
      marginBottom: 24,
      maxWidth: 520,
      lineHeight: 22,
      fontFamily: "Poppins_400Regular",
    },
    sectionSub: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: "center",
      marginBottom: 20,
      maxWidth: 580,
      alignSelf: "center",
      lineHeight: 21,
      fontFamily: "Poppins_400Regular",
    },
    globeGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "center",
      gap: 10,
    },
    globeScrollRow: {
      flexDirection: "row",
      paddingHorizontal: 4,
      gap: 10,
      paddingVertical: 4,
    },
    globeChip: {
      backgroundColor: colors.surface,
      paddingVertical: 10,
      paddingHorizontal: 18,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.borderLight,
      minHeight: 44,
      justifyContent: "center",
    },
    globeChipText: {
      fontSize: 14,
      color: colors.text,
      fontFamily: "Poppins_500Medium",
    },
    problemGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "center",
      marginTop: 4,
      gap: 12,
    },
    problemCard: {
      backgroundColor: colors.surface,
      padding: 18,
      borderRadius: 16,
      width: 210,
      alignItems: "flex-start",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderLight,
      gap: 8,
    },
    problemIconCircle: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: colors.surfaceElevated,
      alignItems: "center",
      justifyContent: "center",
    },
    problemText: {
      color: colors.text,
      fontSize: 13,
      lineHeight: 20,
      fontFamily: "Poppins_500Medium",
    },
    solutionCard: {
      marginTop: 26,
      alignItems: "center",
      paddingHorizontal: 24,
      paddingVertical: 28,
      borderRadius: 22,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderLight,
      overflow: "hidden",
    },
    solutionGradientBg: {
      ...StyleSheet.absoluteFillObject,
    },
    solutionIconCircle: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.surfaceElevated,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 10,
    },
    solutionTitle: {
      fontSize: 20,
      fontFamily: "Poppins_700Bold",
      color: colors.text,
    },
    solutionText: {
      textAlign: "center",
      marginTop: 8,
      color: colors.textSecondary,
      maxWidth: 520,
      lineHeight: 22,
      fontSize: 14,
      fontFamily: "Poppins_400Regular",
    },
    mapPlaceholder: {
      minHeight: 260,
      borderRadius: 22,
      overflow: "hidden",
      alignItems: "center",
      justifyContent: "center",
      marginTop: 10,
      paddingHorizontal: 20,
      paddingVertical: 32,
      borderWidth: 1,
      borderColor: colors.borderLight,
      gap: 8,
    },
    mapText: {
      color: colors.text,
      fontFamily: "Poppins_600SemiBold",
      fontSize: 15,
      textAlign: "center",
    },
    mapSubText: {
      color: colors.textSecondary,
      fontSize: 13,
      textAlign: "center",
      maxWidth: 320,
      lineHeight: 19,
      fontFamily: "Poppins_400Regular",
    },
    mapComingSoonPill: {
      marginTop: 10,
      paddingHorizontal: 16,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: colors.surfaceElevated,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderLight,
    },
    mapComingSoonText: {
      fontSize: 12,
      fontFamily: "Poppins_600SemiBold",
      color: colors.textSecondary,
    },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "center",
      gap: 12,
    },
    eventCard: {
      backgroundColor: colors.surface,
      borderRadius: 22,
      padding: 20,
      alignItems: "flex-start",
      borderWidth: 1,
      borderColor: colors.borderLight,
      overflow: "hidden",
      gap: 6,
      // Card shadow
      ...Platform.select({
        ios: { shadowColor: "black", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8 },
        android: { elevation: 3 },
      }),
    },
    eventCardPressed: {
      opacity: 0.88,
      transform: [{ scale: 0.98 }],
    },
    eventCardAccent: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: 3,
      borderTopLeftRadius: 22,
      borderTopRightRadius: 22,
    },
    eventIconPill: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 999,
      backgroundColor: colors.surfaceElevated,
      gap: 6,
      marginTop: 6,
    },
    eventTagText: {
      fontSize: 11,
      color: colors.text,
      fontFamily: "Poppins_600SemiBold",
    },
    eventTitle: {
      fontSize: 16,
      fontFamily: "Poppins_700Bold",
      color: colors.primary,
      marginTop: 2,
    },
    eventLocation: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    eventCity: {
      fontSize: 12,
      color: colors.textSecondary,
      fontFamily: "Poppins_500Medium",
    },
    eventMeta: {
      fontSize: 12,
      color: colors.textSecondary,
      lineHeight: 18,
      fontFamily: "Poppins_400Regular",
    },
    eventCTA: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      marginTop: 4,
    },
    eventCTAText: {
      fontSize: 13,
      color: CultureTokens.indigo,
      fontFamily: "Poppins_600SemiBold",
    },
    visionSection: {
      paddingVertical: 80,
      alignItems: "center",
      paddingHorizontal: 26,
      overflow: "hidden",
    },
    visionTitle: {
      fontSize: 28,
      fontFamily: "Poppins_700Bold",
      color: "white",
    },
    visionText: {
      fontSize: 15,
      color: "rgba(255,255,255,0.85)",
      maxWidth: 680,
      textAlign: "center",
      marginTop: 14,
      lineHeight: 25,
      fontFamily: "Poppins_400Regular",
    },
    ctaSection: {
      alignItems: "center",
      paddingVertical: 70,
      paddingHorizontal: 24,
      gap: 16,
    },
    ctaTitle: {
      fontSize: 24,
      fontFamily: "Poppins_700Bold",
      color: colors.primary,
      textAlign: "center",
    },
    ctaSubtitle: {
      fontSize: 14,
      fontFamily: "Poppins_400Regular",
      color: colors.textSecondary,
      textAlign: "center",
      maxWidth: 480,
      lineHeight: 21,
    },
    ctaBtn: {
      marginTop: 6,
      backgroundColor: CultureTokens.indigo,
      paddingVertical: 15,
      paddingHorizontal: 32,
      borderRadius: 999,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      minWidth: 220,
      minHeight: 50,
      alignSelf: "stretch",
      maxWidth: 320,
      ...Platform.select({
        ios: { shadowColor: CultureTokens.indigo, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10 },
        android: { elevation: 6 },
      }),
    },
    ctaBtnPressed: {
      opacity: 0.88,
      transform: [{ scale: 0.97 }],
    },
    ctaBtnText: {
      color: "white",
      fontSize: 16,
      fontFamily: "Poppins_600SemiBold",
    },
    ctaSecondary: {
      paddingVertical: 8,
    },
    ctaSecondaryText: {
      fontSize: 13,
      color: colors.textSecondary,
      textDecorationLine: "underline",
      fontFamily: "Poppins_500Medium",
    },
  });

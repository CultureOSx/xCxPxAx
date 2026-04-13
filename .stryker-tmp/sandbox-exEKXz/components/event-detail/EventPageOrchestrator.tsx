// @ts-nocheck
import React, { type ReactNode } from 'react';
import { View, ScrollView } from 'react-native';
import { getStyles } from './styles';

interface EventPageOrchestratorProps {
  isDesktop: boolean;
  bottomInset: number;
  mainContent: ReactNode;
  sidebarContent: ReactNode;
  s: ReturnType<typeof getStyles>;
}

export function EventPageOrchestrator({
  isDesktop,
  bottomInset,
  mainContent,
  sidebarContent,
  s,
}: EventPageOrchestratorProps) {
  if (isDesktop) {
    return (
      <ScrollView
        style={s.mainScroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomInset + 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={s.desktopTwoColWrapper}>
          <View style={s.desktopTwoColInner}>
            <View style={s.desktopMainCol}>{mainContent}</View>
            <View style={s.desktopSidebarCol}>{sidebarContent}</View>
          </View>
        </View>
      </ScrollView>
    );
  }

  return (
    <View style={s.shellWrapper}>
      <ScrollView
        style={s.mainScroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomInset + 40 }}
        keyboardShouldPersistTaps="handled"
      >
        {mainContent}
      </ScrollView>
    </View>
  );
}

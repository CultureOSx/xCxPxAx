import React from 'react';
import { View, ScrollView } from 'react-native';
import { useColors } from '@/hooks/useColors';

interface EventPageOrchestratorProps {
  isDesktop: boolean;
  bottomInset: number;
  mainContent: React.ReactNode;
  sidebarContent?: React.ReactNode;
  s: Record<string, unknown>;
}

export function EventPageOrchestrator({
  isDesktop,
  bottomInset,
  mainContent,
  sidebarContent,
}: EventPageOrchestratorProps) {
  const colors = useColors();

  if (isDesktop) {
    return (
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexDirection: 'row', paddingBottom: bottomInset }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ flex: 1, minWidth: 0 }}>{mainContent}</View>
        {sidebarContent ? (
          <View style={{ width: 360, paddingHorizontal: 20, paddingTop: 24 }}>{sidebarContent}</View>
        ) : null}
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: bottomInset + 80 }}
      showsVerticalScrollIndicator={false}
    >
      {mainContent}
    </ScrollView>
  );
}

import { useColors } from '@/hooks/useColors';
import { ScreenStateCard } from '@/components/ui/ScreenState';

export function CalendarEmptyState({
  colors: _colors,
  title,
  subtitle,
  onSubtitlePress,
}: {
  colors: ReturnType<typeof useColors>;
  title: string;
  subtitle: string;
  onSubtitlePress?: () => void;
}) {
  return (
    <ScreenStateCard
      icon="calendar-outline"
      title={title}
      message={subtitle}
      actionLabel={onSubtitlePress ? 'Open events' : undefined}
      onAction={onSubtitlePress}
      compact
    />
  );
}

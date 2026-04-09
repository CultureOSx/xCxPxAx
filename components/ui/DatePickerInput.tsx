import { useState, useCallback } from 'react';
import {
  Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TouchableWithoutFeedback, View
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameDay, isSameMonth, format, parse, isValid,
} from 'date-fns';
import { useColors } from '@/hooks/useColors';
import { CultureTokens } from '@/constants/theme';
import { TextStyles } from '@/constants/typography';

/** ISO date string YYYY-MM-DD */
export type ISODateString = string;

interface DatePickerInputProps {
  label?: string;
  value: ISODateString;
  onChangeDate: (date: ISODateString) => void;
  placeholder?: string;
  minDate?: ISODateString;
  maxDate?: ISODateString;
  accessibilityLabel?: string;
  containerStyle?: any;
}

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function parseIso(iso: string): Date | null {
  if (!iso || iso.length < 10) return null;
  const d = parse(iso, 'yyyy-MM-dd', new Date());
  return isValid(d) ? d : null;
}

// ── Web: delegate to native browser date input ───────────────────────────────
function WebDateInput({ label, value, onChangeDate, placeholder, accessibilityLabel, containerStyle }: DatePickerInputProps) {
  const colors = useColors();
  return (
    <View style={[containerStyle]}>
      {label ? <Text style={[TextStyles.label, { color: colors.textSecondary, marginBottom: 4 }]}>{label}</Text> : null}
      <View style={[styles.webWrap, { borderColor: colors.border, backgroundColor: colors.surface }]}>
        <Ionicons name="calendar-outline" size={18} color={colors.textTertiary} style={{ marginRight: 8 }} />
        {/* @ts-ignore — web-only input */}
        <input
          type="date"
          value={value || ''}
          onChange={(e: any) => onChangeDate(e.target.value || '')}
          placeholder={placeholder || 'Select date'}
          aria-label={accessibilityLabel || label || 'Date'}
          style={{
            flex: 1, border: 'none', outline: 'none',
            background: 'transparent',
            fontFamily: 'Poppins_400Regular, system-ui, sans-serif',
            fontSize: 15,
            color: colors.text,
            cursor: 'pointer',
          }}
        />
      </View>
    </View>
  );
}

// ── Native: calendar modal ────────────────────────────────────────────────────
export function DatePickerInput(props: DatePickerInputProps) {
  if (Platform.OS === 'web') return <WebDateInput {...props} />;
  return <NativeDatePickerInput {...props} />;
}

function NativeDatePickerInput({
  label, value, onChangeDate, placeholder, minDate, maxDate,
  accessibilityLabel, containerStyle,
}: DatePickerInputProps) {
  const colors = useColors();
  const parsed = parseIso(value);
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState<Date>(parsed ?? new Date());

  const minParsed = parseIso(minDate ?? '');
  const maxParsed = parseIso(maxDate ?? '');

  const calStart = startOfWeek(startOfMonth(viewMonth), { weekStartsOn: 0 });
  const calEnd   = endOfWeek(endOfMonth(viewMonth),     { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const handleSelect = useCallback((day: Date) => {
    onChangeDate(format(day, 'yyyy-MM-dd'));
    setOpen(false);
  }, [onChangeDate]);

  const prevMonth = useCallback(() => setViewMonth(m => subMonths(m, 1)), []);
  const nextMonth = useCallback(() => setViewMonth(m => addMonths(m, 1)), []);

  const isDisabled = (day: Date) => {
    if (minParsed && day < minParsed) return true;
    if (maxParsed && day > maxParsed) return true;
    return false;
  };

  const displayLabel = parsed ? format(parsed, 'd MMM yyyy') : (placeholder || 'Select date');

  return (
    <View style={[containerStyle]}>
      {label ? <Text style={[TextStyles.label, { color: colors.textSecondary, marginBottom: 4 }]}>{label}</Text> : null}

      <Pressable
        onPress={() => setOpen(true)}
        style={({ pressed }) => [
          styles.control,
          { borderColor: colors.border, backgroundColor: colors.surface },
          pressed && { opacity: 0.8 },
        ]}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel || label || 'Date picker'}
        accessibilityValue={{ text: value || 'Not set' }}
      >
        <Ionicons name="calendar-outline" size={18} color={parsed ? CultureTokens.indigo : colors.textTertiary} />
        <Text style={[styles.controlText, { color: parsed ? colors.text : colors.textTertiary }]} numberOfLines={1}>
          {displayLabel}
        </Text>
        <Ionicons name="chevron-expand-outline" size={16} color={colors.textTertiary} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableWithoutFeedback onPress={() => setOpen(false)}>
          <View style={styles.backdrop}>
            <TouchableWithoutFeedback>
              <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>

                {/* Month nav */}
                <View style={styles.monthNav}>
                  <Pressable
                    onPress={prevMonth}
                    style={[styles.navBtn, { backgroundColor: colors.backgroundSecondary }]}
                    accessibilityRole="button" accessibilityLabel="Previous month"
                  >
                    <Ionicons name="chevron-back" size={18} color={colors.text} />
                  </Pressable>
                  <Text style={[styles.monthLabel, { color: colors.text }]}>
                    {format(viewMonth, 'MMMM yyyy')}
                  </Text>
                  <Pressable
                    onPress={nextMonth}
                    style={[styles.navBtn, { backgroundColor: colors.backgroundSecondary }]}
                    accessibilityRole="button" accessibilityLabel="Next month"
                  >
                    <Ionicons name="chevron-forward" size={18} color={colors.text} />
                  </Pressable>
                </View>

                {/* Day names */}
                <View style={styles.dayNames}>
                  {DAYS.map(d => (
                    <Text key={d} style={[styles.dayName, { color: colors.textTertiary }]}>{d}</Text>
                  ))}
                </View>

                {/* Calendar grid */}
                <ScrollView scrollEnabled={false}>
                  <View style={styles.grid}>
                    {days.map(day => {
                      const inMonth  = isSameMonth(day, viewMonth);
                      const selected = parsed ? isSameDay(day, parsed) : false;
                      const disabled = isDisabled(day);
                      const isToday  = isSameDay(day, new Date());
                      return (
                        <Pressable
                          key={day.toISOString()}
                          onPress={() => !disabled && handleSelect(day)}
                          style={({ pressed }) => [
                            styles.dayCell,
                            selected && { backgroundColor: CultureTokens.indigo },
                            isToday && !selected && { borderColor: CultureTokens.indigo, borderWidth: 1 },
                            pressed && !selected && !disabled && { backgroundColor: colors.backgroundSecondary },
                          ]}
                          accessibilityRole="button"
                          accessibilityLabel={format(day, 'EEEE, MMMM d yyyy')}
                          accessibilityState={{ selected, disabled }}
                          disabled={disabled}
                        >
                          <Text style={[
                            styles.dayText,
                            { color: selected ? '#fff' : !inMonth || disabled ? colors.textTertiary : colors.text },
                          ]}>
                            {format(day, 'd')}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </ScrollView>

                {/* Clear / Today row */}
                <View style={[styles.footer, { borderTopColor: colors.borderLight }]}>
                  <Pressable onPress={() => { onChangeDate(''); setOpen(false); }} style={styles.footerBtn}>
                    <Text style={[styles.footerBtnText, { color: colors.textSecondary }]}>Clear</Text>
                  </Pressable>
                  <Pressable onPress={() => { handleSelect(new Date()); }} style={styles.footerBtn}>
                    <Text style={[styles.footerBtnText, { color: CultureTokens.indigo }]}>Today</Text>
                  </Pressable>
                </View>

              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  webWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 12, minHeight: 48,
  },
  control: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 12, minHeight: 48,
  },
  controlText: { flex: 1, fontSize: 15, fontFamily: 'Poppins_400Regular' },

  backdrop: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 20,
  },
  sheet: {
    width: '100%', maxWidth: 360,
    borderRadius: 24, borderWidth: 1,
    padding: 20,
    ...Platform.select({
      web: { boxShadow: '0px 12px 24px rgba(0,0,0,0.25)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.25,
        shadowRadius: 24,
        elevation: 20,
      },
    }),
  },

  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  navBtn:   { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  monthLabel: { fontSize: 16, fontFamily: 'Poppins_700Bold' },

  dayNames: { flexDirection: 'row', marginBottom: 8 },
  dayName:  { flex: 1, textAlign: 'center', fontSize: 11, fontFamily: 'Poppins_600SemiBold', textTransform: 'uppercase' },

  grid:     { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell:  { width: `${100 / 7}%` as any, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 999 },
  dayText:  { fontSize: 14, fontFamily: 'Poppins_500Medium' },

  footer:   { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 14, marginTop: 8, borderTopWidth: StyleSheet.hairlineWidth },
  footerBtn:{ paddingVertical: 6, paddingHorizontal: 12 },
  footerBtnText: { fontSize: 14, fontFamily: 'Poppins_600SemiBold' },
});

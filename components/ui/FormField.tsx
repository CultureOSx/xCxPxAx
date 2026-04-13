import React from 'react';
import { View, StyleSheet, Text, TextInput } from 'react-native';
import { View, StyleSheet } from 'react-native';
import { Controller, Control } from 'react-hook-form';
import { useColors } from '@/hooks/useColors';
import { Spacing, Radius, TextStyles } from '@/constants/theme';
import { Spacing } from '@/constants/theme';
import { Input } from './Input';

interface FormFieldProps {
  name: string;
  label: string;
  placeholder: string;
  control: Control<any>;
  error?: string;
  multiline?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric';
}

/**
 * CulturePass Standard Form Field
 * Follows Token Integrity and Accessibility (WCAG AA) standards.
 */
export const FormField: React.FC<FormFieldProps> = ({ 
  name, label, placeholder, control, error, multiline, keyboardType 
}) => {
  const colors = useColors();

  return (
    <View style={styles.fieldContainer}>
      <Text style={[TextStyles.label, { color: colors.textSecondary, marginBottom: Spacing.xs }]}>
        {label}
      </Text>
      <Controller
        control={control}
        name={name}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            style={[
              styles.input,
              { 
                backgroundColor: colors.surface, 
                color: colors.text, 
                borderColor: error ? colors.error : colors.border,
                height: multiline ? 120 : 48, // Accessibility: Min 44pt touch target
                paddingTop: multiline ? Spacing.md : 0,
              }
            ]}
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            placeholder={placeholder}
            placeholderTextColor={colors.textTertiary}
            multiline={multiline}
            keyboardType={keyboardType}
            accessibilityLabel={`${label} input field`}
            accessibilityRole="text"
          />
        )}
      />
      {error && (
        <Text style={[TextStyles.caption, { color: colors.error, marginTop: Spacing.xs }]}>
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  fieldContainer: {
    marginBottom: Spacing.md,
  },
  input: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    fontSize: 16,
    textAlignVertical: 'top',
  },
});
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Spacing } from '@/constants/theme';
import { Input, type InputProps } from './Input';

type FormFieldProps = InputProps & {
  /** Extra bottom margin between fields (default: Spacing.md) */
  spacing?: number;
};

/**
 * CulturePass Standard Form Field
 * Thin wrapper around Input that adds consistent inter-field spacing.
 * Follows Token Integrity and Accessibility (WCAG AA) standards.
 */
export const FormField: React.FC<FormFieldProps> = ({ spacing = Spacing.md, ...inputProps }) => {
  return (
    <View style={[styles.fieldContainer, { marginBottom: spacing }]}>
      <Input {...inputProps} />
    </View>
  );
};

const styles = StyleSheet.create({
  fieldContainer: {},
});

import React from 'react';
import { TextInput, TextInputProps } from 'react-native';
import * as Haptics from 'expo-haptics';

export function NumericInput({ onChangeText, ...props }: TextInputProps) {
  function handleChange(text: string) {
    Haptics.selectionAsync();
    onChangeText?.(text);
  }
  return <TextInput {...props} onChangeText={handleChange} />;
}

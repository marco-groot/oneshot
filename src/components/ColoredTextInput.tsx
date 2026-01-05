import React from 'react';
import { Text, useInput } from 'ink';

interface ColoredTextInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  placeholder?: string;
  color?: string;
  focus?: boolean;
}

export function ColoredTextInput({
  value,
  onChange,
  onSubmit,
  placeholder = '',
  color,
  focus = true,
}: ColoredTextInputProps) {
  useInput(
    (input, key) => {
      if (key.return) {
        onSubmit(value);
        return;
      }

      if (key.backspace || key.delete) {
        onChange(value.slice(0, -1));
        return;
      }

      if (key.ctrl && input === 'c') {
        return;
      }

      if (key.ctrl && input === 'u') {
        onChange('');
        return;
      }

      if (
        !key.ctrl &&
        !key.meta &&
        !key.escape &&
        !key.upArrow &&
        !key.downArrow &&
        !key.leftArrow &&
        !key.rightArrow &&
        !key.tab
      ) {
        onChange(value + input);
      }
    },
    { isActive: focus }
  );

  const showPlaceholder = !value && placeholder;

  return (
    <Text color={showPlaceholder ? 'gray' : color}>
      {showPlaceholder ? placeholder : value}
      <Text inverse> </Text>
    </Text>
  );
}

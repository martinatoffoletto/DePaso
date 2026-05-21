import React from "react";
import { TextInput as RNTextInput, View } from "react-native";
import { Text } from "react-native-paper";
import { FieldValues, Controller, ControllerProps } from "react-hook-form";

interface FormInputProps<T extends FieldValues> extends Omit<
  ControllerProps<T>,
  "render"
> {
  label?: string;
  placeholder?: string;
  error?: string;
  inputProps?: React.ComponentProps<typeof RNTextInput>;
}

export const FormInput = React.forwardRef<
  RNTextInput,
  FormInputProps<FieldValues>
>(({ label, placeholder, error, inputProps, control, name, rules }, ref) => {
  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({ field: { onChange, onBlur, value } }) => (
        <View className="mb-4">
          {label && (
            <Text variant="labelMedium" className="mb-2">
              {label}
            </Text>
          )}
          <RNTextInput
            ref={ref}
            placeholder={placeholder}
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            className={`border px-3 py-2 rounded-md ${
              error ? "border-red-500 bg-red-50" : "border-gray-300"
            }`}
            {...inputProps}
          />
          {error && (
            <Text variant="labelSmall" className="text-red-500 mt-1">
              {error}
            </Text>
          )}
        </View>
      )}
    />
  );
});

FormInput.displayName = "FormInput";

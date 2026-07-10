import React from "react";
import { TextInput as RNTextInput, View, Text } from "react-native";
import { FieldValues, Controller, ControllerProps } from "react-hook-form";
import { T } from "@/constants/tokens";

interface FormInputProps<T extends FieldValues> extends Omit<ControllerProps<T>, "render"> {
  label?: string;
  placeholder?: string;
  error?: string;
  inputProps?: React.ComponentProps<typeof RNTextInput>;
}

export const FormInput = React.forwardRef<RNTextInput, FormInputProps<FieldValues>>(
  ({ label, placeholder, error, inputProps, control, name, rules }, ref) => {
    return (
      <Controller
        control={control}
        name={name}
        rules={rules}
        render={({ field: { onChange, onBlur, value } }) => (
          <View className="mb-4">
            {label && (
              <Text className="text-[10px] tracking-[1.5px] text-inkMute uppercase mb-1.5 font-semibold">
                {label}
              </Text>
            )}
            <RNTextInput
              ref={ref}
              placeholder={placeholder}
              placeholderTextColor={T.inkFaint}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              className={`border px-3 py-2 rounded-xl text-sm text-ink ${
                error ? "border-red bg-redBg" : "border-border bg-card"
              }`}
              {...inputProps}
            />
            {error && (
              <Text className="text-[11px] text-red mt-1 pl-1">{error}</Text>
            )}
          </View>
        )}
      />
    );
  }
);

FormInput.displayName = "FormInput";

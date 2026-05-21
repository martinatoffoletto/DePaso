import React, { useState } from "react";
import { View, ScrollView, Alert, TouchableOpacity } from "react-native";
import { Text } from "react-native-paper";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "expo-router";

import { useAuthStore } from "@/stores";
import { Button, FormInput } from "@/components";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginScreen = () => {
  const router = useRouter();
  const { login, isLoading } = useAuthStore();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);
    try {
      await login(data.email, data.password);
      // La navegación la maneja AuthGuard en _layout.tsx reactivamente
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : "Login failed. Please try again.";
      setServerError(msg);
      Alert.alert("Error", msg);
    }
  };

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="px-6 py-12">
        {/* Header */}
        <View className="mb-8">
          <Text variant="headlineLarge" className="font-bold">
            Welcome Back
          </Text>
          <Text variant="bodyMedium" className="text-gray-600 mt-2">
            Sign in to your account
          </Text>
        </View>

        {/* Error message */}
        {serverError && (
          <View className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
            <Text variant="bodySmall" className="text-red-700">
              {serverError}
            </Text>
          </View>
        )}

        {/* Form */}
        <FormInput
          control={control}
          name="email"
          label="Email"
          placeholder="john@example.com"
          error={errors.email?.message}
          inputProps={{ autoCapitalize: "none", keyboardType: "email-address" }}
        />

        <FormInput
          control={control}
          name="password"
          label="Password"
          placeholder="••••••••"
          error={errors.password?.message}
          inputProps={{ secureTextEntry: true }}
        />

        {/* Login Button */}
        <Button
          mode="contained"
          onPress={handleSubmit(onSubmit)}
          loading={isLoading}
          disabled={isLoading}
          className="mt-6"
        >
          Sign In
        </Button>

        {/* Sign Up Link */}
        <View className="flex-row justify-center mt-6 gap-2">
          <Text variant="bodyMedium">Don't have an account?</Text>
          <TouchableOpacity onPress={() => router.push("/register")}>
            <Text variant="bodyMedium" className="text-blue-500 font-semibold">
              Sign Up
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

export default LoginScreen;

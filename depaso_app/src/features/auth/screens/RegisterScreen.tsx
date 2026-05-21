import React, { useState } from "react";
import { View, ScrollView, Alert, TouchableOpacity } from "react-native";
import { Text } from "react-native-paper";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "expo-router";

import { useAuthStore } from "@/stores";
import { UserType } from "@/types";
import { Button, FormInput } from "@/components";

const registerSchema = z.object({
  first_name: z.string().min(2, "First name is required"),
  last_name: z.string().min(2, "Last name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phone_number: z.string().min(10, "Invalid phone number"),
  dni: z.string().min(7, "Invalid DNI"),
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format: YYYY-MM-DD"),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export const RegisterScreen = () => {
  const router = useRouter();
  const { register, isLoading } = useAuthStore();
  const [serverError, setServerError] = useState<string | null>(null);
  const [userType, setUserType] = useState<UserType>(UserType.CLIENTE);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      password: "",
      phone_number: "",
      dni: "",
      birth_date: "",
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setServerError(null);
    try {
      await register({
        ...data,
        user_type: userType,
      });
      router.replace("/(tabs)");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Registration failed";
      setServerError(message);
      Alert.alert("Error", message);
    }
  };

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="px-6 py-12">
        {/* Header */}
        <View className="mb-8">
          <Text variant="headlineLarge" className="font-bold">
            Create Account
          </Text>
          <Text variant="bodyMedium" className="text-gray-600 mt-2">
            Join DePaso to start shipping
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

        {/* Account Type Selection */}
        <View className="mb-6">
          <Text variant="labelMedium" className="mb-3">
            Account Type
          </Text>
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={() => setUserType(UserType.CLIENTE)}
              className={`flex-1 p-3 rounded-lg border-2 ${
                userType === UserType.CLIENTE
                  ? "bg-blue-50 border-blue-500"
                  : "bg-gray-50 border-gray-200"
              }`}
            >
              <Text
                className={
                  userType === UserType.CLIENTE
                    ? "text-blue-700"
                    : "text-gray-700"
                }
              >
                Shipper
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setUserType(UserType.TRANSPORTISTA)}
              className={`flex-1 p-3 rounded-lg border-2 ${
                userType === UserType.TRANSPORTISTA
                  ? "bg-blue-50 border-blue-500"
                  : "bg-gray-50 border-gray-200"
              }`}
            >
              <Text
                className={
                  userType === UserType.TRANSPORTISTA
                    ? "text-blue-700"
                    : "text-gray-700"
                }
              >
                Carrier
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Form */}
        <FormInput
          control={control}
          name="first_name"
          label="First Name"
          placeholder="John"
          error={errors.first_name?.message}
        />

        <FormInput
          control={control}
          name="last_name"
          label="Last Name"
          placeholder="Doe"
          error={errors.last_name?.message}
        />

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

        <FormInput
          control={control}
          name="phone_number"
          label="Phone Number"
          placeholder="+54 11 1234 5678"
          error={errors.phone_number?.message}
          inputProps={{ keyboardType: "phone-pad" }}
        />

        <FormInput
          control={control}
          name="dni"
          label="DNI"
          placeholder="12345678"
          error={errors.dni?.message}
          inputProps={{ keyboardType: "numeric" }}
        />

        <FormInput
          control={control}
          name="birth_date"
          label="Birth Date"
          placeholder="YYYY-MM-DD"
          error={errors.birth_date?.message}
          inputProps={{ keyboardType: "numeric" }}
        />

        {/* Register Button */}
        <Button
          mode="contained"
          onPress={handleSubmit(onSubmit)}
          loading={isLoading}
          disabled={isLoading}
          className="mt-6"
        >
          Create Account
        </Button>

        {/* Login Link */}
        <View className="flex-row justify-center mt-6 gap-2">
          <Text variant="bodyMedium">Already have an account?</Text>
          <TouchableOpacity onPress={() => router.push("/login")}>
            <Text variant="bodyMedium" className="text-blue-500 font-semibold">
              Sign In
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

export default RegisterScreen;

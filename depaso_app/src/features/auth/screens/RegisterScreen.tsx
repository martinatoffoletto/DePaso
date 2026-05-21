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
  first_name: z.string().min(2, "Nombre requerido"),
  last_name: z.string().min(2, "Apellido requerido"),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
  phone_number: z.string().min(8, "Teléfono inválido").optional(),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export const RegisterScreen = () => {
  const router = useRouter();
  const { register, isLoading } = useAuthStore();
  const [serverError, setServerError] = useState<string | null>(null);
  const [userType, setUserType] = useState<UserType>(UserType.CLIENT);

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
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setServerError(null);
    try {
      await register({ ...data, user_type: userType });
      // La navegación la maneja AuthGuard en _layout.tsx reactivamente
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Error al registrarse";
      setServerError(msg);
      Alert.alert("Error", msg);
    }
  };

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="px-6 py-12">
        <View className="mb-8">
          <Text variant="headlineLarge" className="font-bold">
            Crear cuenta
          </Text>
          <Text variant="bodyMedium" className="text-gray-600 mt-2">
            Unite a DePaso
          </Text>
        </View>

        {serverError && (
          <View className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
            <Text variant="bodySmall" className="text-red-700">
              {serverError}
            </Text>
          </View>
        )}

        {/* Tipo de cuenta */}
        <View className="mb-6">
          <Text variant="labelMedium" className="mb-3">
            Tipo de cuenta
          </Text>
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={() => setUserType(UserType.CLIENT)}
              className={`flex-1 p-3 rounded-lg border-2 ${
                userType === UserType.CLIENT
                  ? "bg-blue-50 border-blue-500"
                  : "bg-gray-50 border-gray-200"
              }`}
            >
              <Text className={userType === UserType.CLIENT ? "text-blue-700" : "text-gray-700"}>
                Cliente
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setUserType(UserType.CARRIER)}
              className={`flex-1 p-3 rounded-lg border-2 ${
                userType === UserType.CARRIER
                  ? "bg-blue-50 border-blue-500"
                  : "bg-gray-50 border-gray-200"
              }`}
            >
              <Text className={userType === UserType.CARRIER ? "text-blue-700" : "text-gray-700"}>
                Transportista
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <FormInput
          control={control}
          name="first_name"
          label="Nombre"
          placeholder="Valentina"
          error={errors.first_name?.message}
        />
        <FormInput
          control={control}
          name="last_name"
          label="Apellido"
          placeholder="Rossi"
          error={errors.last_name?.message}
        />
        <FormInput
          control={control}
          name="email"
          label="Email"
          placeholder="valen@ejemplo.com"
          error={errors.email?.message}
          inputProps={{ autoCapitalize: "none", keyboardType: "email-address" }}
        />
        <FormInput
          control={control}
          name="password"
          label="Contraseña"
          placeholder="••••••••"
          error={errors.password?.message}
          inputProps={{ secureTextEntry: true }}
        />
        <FormInput
          control={control}
          name="phone_number"
          label="Teléfono (opcional)"
          placeholder="+54 11 1234 5678"
          error={errors.phone_number?.message}
          inputProps={{ keyboardType: "phone-pad" }}
        />

        <Button
          mode="contained"
          onPress={handleSubmit(onSubmit)}
          loading={isLoading}
          disabled={isLoading}
          className="mt-6"
        >
          Crear cuenta
        </Button>

        <View className="flex-row justify-center mt-6 gap-2">
          <Text variant="bodyMedium">¿Ya tenés cuenta?</Text>
          <TouchableOpacity onPress={() => router.push("/_auth/login")}>
            <Text variant="bodyMedium" className="text-blue-500 font-semibold">
              Iniciá sesión
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

export default RegisterScreen;

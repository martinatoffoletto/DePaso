import { useRouter } from "expo-router";
import { View } from "react-native";
import { Text, Button } from "react-native-paper";

import { useAuthStore } from "@/src/stores/authStore";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <View className="flex-1 bg-white p-6">
      <Text variant="headlineLarge" className="font-bold mb-6">
        Profile
      </Text>

      {user && (
        <View className="mb-8">
          <Text variant="bodyMedium">
            <Text className="font-semibold">Name:</Text> {user.first_name}{" "}
            {user.last_name}
          </Text>
          <Text variant="bodyMedium">
            <Text className="font-semibold">Email:</Text> {user.email}
          </Text>
          <Text variant="bodyMedium">
            <Text className="font-semibold">Type:</Text> {user.user_type}
          </Text>
          <Text variant="bodyMedium">
            <Text className="font-semibold">Rating:</Text> {user.rating}⭐
          </Text>
        </View>
      )}

      <Button
        mode="contained"
        buttonColor="#F44336"
        onPress={handleLogout}
        className="mt-auto"
      >
        Sign Out
      </Button>
    </View>
  );
}

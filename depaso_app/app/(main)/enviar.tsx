import { useEffect, useState } from "react";
import { useNavigation } from "expo-router";
import { FlowNavigator } from "@/src/features/sender/send-flow/FlowNavigator";
import FeedScreen from "@/src/features/carrier/FeedScreen";
import { useAuthStore } from "@/src/stores/authStore";
import { UserType } from "@/src/types";

export default function EnviarTab() {
  const [resetKey, setResetKey] = useState(0);
  const navigation = useNavigation();
  const { user } = useAuthStore();

  useEffect(() => {
    return navigation.addListener("tabPress" as any, () => {
      setResetKey(k => k + 1);
    });
  }, [navigation]);

  if (user?.user_type === UserType.CARRIER) {
    return <FeedScreen />;
  }
  return <FlowNavigator key={resetKey} />;
}

import { useEffect, useState } from "react";
import { useNavigation } from "expo-router";
import { FlowNavigator } from "@/src/sender/send-flow/FlowNavigator";
import RiderHomeScreen from "@/src/carrier/RiderHomeScreen";
import { useAuthStore } from "@/src/shared/session/authStore";
import { UserType } from "@/src/shared/types";

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
    return <RiderHomeScreen />;
  }
  return <FlowNavigator key={resetKey} />;
}

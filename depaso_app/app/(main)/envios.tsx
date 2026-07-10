import MisEnviosScreen from "@/src/sender/ShipmentsScreen";
import CarrierShipmentsScreen from "@/src/carrier/CarrierShipmentsScreen";
import { useAuthStore } from "@/src/shared/session/authStore";
import { UserType } from "@/src/shared/types";

export default function EnviosTab() {
  const { user } = useAuthStore();
  if (user?.user_type === UserType.CARRIER) {
    return <CarrierShipmentsScreen />;
  }
  return <MisEnviosScreen />;
}

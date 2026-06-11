import MisEnviosScreen from "@/src/features/sender/ShipmentsScreen";
import CarrierShipmentsScreen from "@/src/features/carrier/CarrierShipmentsScreen";
import { useAuthStore } from "@/src/stores/authStore";
import { UserType } from "@/src/types";

export default function EnviosTab() {
  const { user } = useAuthStore();
  if (user?.user_type === UserType.CARRIER) {
    return <CarrierShipmentsScreen />;
  }
  return <MisEnviosScreen />;
}

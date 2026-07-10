import { Redirect } from "expo-router";
import { useAuthStore } from "@/src/shared/session/authStore";
import { UserType } from "@/src/shared/types";

/** Land each role on its home tab: admin → panel, everyone else → enviar. */
export default function MainIndex() {
  const user = useAuthStore((s) => s.user);
  if (user?.user_type === UserType.ADMIN) {
    return <Redirect href="/(main)/admin" />;
  }
  return <Redirect href="/(main)/enviar" />;
}

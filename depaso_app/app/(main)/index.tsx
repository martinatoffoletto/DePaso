import { Redirect } from "expo-router";
import { useAuthStore } from "@/src/shared/session/authStore";
import { UserType } from "@/src/shared/types";

/** Land each role on its home tab. La administración vive en depaso_web
 * (empleados de DePaso, no usuarios): un admin en la app solo ve su perfil. */
export default function MainIndex() {
  const user = useAuthStore((s) => s.user);
  if (user?.user_type === UserType.ADMIN) {
    return <Redirect href="/(main)/perfil" />;
  }
  return <Redirect href="/(main)/enviar" />;
}

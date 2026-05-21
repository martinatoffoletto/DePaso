import { useEffect, useState } from "react";
import { useNavigation } from "expo-router";
import { FlowNavigator } from "../../src/features/flow/FlowNavigator";

export default function EnviarTab() {
  const [resetKey, setResetKey] = useState(0);
  const navigation = useNavigation();

  useEffect(() => {
    return navigation.addListener("tabPress" as any, () => {
      setResetKey(k => k + 1);
    });
  }, [navigation]);

  return <FlowNavigator key={resetKey} />;
}

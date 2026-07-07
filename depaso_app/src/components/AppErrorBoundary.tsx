import React from "react";
import { View, TouchableOpacity } from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { T } from "@/constants/tokens";

interface State {
  hasError: boolean;
}

/** Catches render/runtime crashes so a single error doesn't white-screen the
 * whole app. Shows a recovery screen with a "try again" reset. */
export class AppErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    // Kept for future crash reporting (Sentry, etc.).
    console.warn("[AppErrorBoundary]", error);
  }

  reset = () => this.setState({ hasError: false });

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <View style={{ flex: 1, backgroundColor: T.bg, alignItems: "center", justifyContent: "center", padding: 32, gap: 14 }}>
        <View style={{ width: 72, height: 72, borderRadius: 24, backgroundColor: T.cardSoft, alignItems: "center", justifyContent: "center" }}>
          <MaterialCommunityIcons name="alert-circle-outline" size={36} color={T.red} />
        </View>
        <Text style={{ fontSize: 18, fontWeight: "700", color: T.ink, textAlign: "center" }}>Algo salió mal</Text>
        <Text style={{ fontSize: 14, color: T.inkMute, textAlign: "center", lineHeight: 20 }}>
          Tuvimos un problema inesperado. Podés reintentar; si sigue, cerrá y volvé a abrir la app.
        </Text>
        <TouchableOpacity onPress={this.reset} style={{ backgroundColor: T.forest, borderRadius: 14, paddingHorizontal: 24, paddingVertical: 14, marginTop: 4 }} activeOpacity={0.85}>
          <Text style={{ color: "#F4EFE3", fontWeight: "700", fontSize: 15 }}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

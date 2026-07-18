import { useState } from "react";
import { View, TextInput, TouchableOpacity, Text, TextInputProps } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { T } from "@/constants/tokens";

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

/** Label chiquito en mayúsculas que va arriba de un campo o sección de form. */
export function FieldLabel({ text }: { text: string }) {
  return (
    <Text className="text-[9.5px] tracking-[1.5px] text-inkMute uppercase font-bold mb-2">
      {text}
    </Text>
  );
}

/**
 * Input de formulario del design system: ícono opcional, borde que reacciona
 * al estado (error → rojo, con valor → verde), mensaje de error debajo y
 * toggle de visibilidad para contraseñas. Acepta todas las props de TextInput
 * (keyboardType, autoCapitalize, maxLength, etc.).
 */
export function Field({ label, icon, error, secureToggle = false, right, value, ...inputProps }: {
  /** Si viene, renderiza el FieldLabel arriba del input. */
  label?: string;
  icon?: IconName;
  /** Mensaje de error: pinta el borde de rojo y lo muestra debajo. */
  error?: string;
  /** Campo de contraseña con ojito para mostrar/ocultar. */
  secureToggle?: boolean;
  /** Elemento custom a la derecha (ej. tilde de validación). */
  right?: React.ReactNode;
  value?: string;
} & Omit<TextInputProps, "value">) {
  const [hidden, setHidden] = useState(true);
  return (
    <View>
      {label && <FieldLabel text={label} />}
      <View
        className="flex-row items-center gap-3 bg-card rounded-2xl px-[14px] h-[52px] border-[1.2px]"
        style={{ borderColor: error ? T.red : value ? T.forest : T.border }}
      >
        {icon && <MaterialCommunityIcons name={icon} size={18} color={error ? T.red : T.inkMute} />}
        <TextInput
          className="flex-1 text-[15px] text-ink font-medium"
          placeholderTextColor={T.inkFaint}
          value={value}
          secureTextEntry={secureToggle ? hidden : inputProps.secureTextEntry}
          autoCorrect={false}
          {...inputProps}
        />
        {secureToggle && (
          <TouchableOpacity onPress={() => setHidden(v => !v)} hitSlop={10}>
            <MaterialCommunityIcons name={hidden ? "eye-outline" : "eye-off-outline"} size={18} color={T.inkMute} />
          </TouchableOpacity>
        )}
        {right}
      </View>
      {error ? <Text className="text-[11px] text-red mt-1 pl-1">{error}</Text> : null}
    </View>
  );
}

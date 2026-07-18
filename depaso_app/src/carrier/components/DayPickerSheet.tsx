import { View, TouchableOpacity, Modal, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MiniCalendar } from "@/src/shared/ui/MiniCalendar";

/** Bottom sheet con calendario en modo pasado — buscar un día del historial. */
export function DayPickerSheet({ visible, selected, onSelect, onClose, title = "Elegí un día" }: {
  visible: boolean;
  selected: Date | null;
  onSelect: (d: Date) => void;
  onClose: () => void;
  title?: string;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity className="flex-1 bg-black/40" activeOpacity={1} onPress={onClose}>
        <View
          className="absolute left-0 right-0 bottom-0 bg-bg rounded-t-[24px] px-4 pt-3"
          style={{ paddingBottom: insets.bottom + 16 }}
        >
          <View className="w-[38px] h-1 bg-border rounded-[3px] self-center mb-2" />
          <Text className="text-sm font-bold text-ink text-center mb-3">{title}</Text>
          <MiniCalendar mode="past" selected={selected} onSelect={onSelect} />
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

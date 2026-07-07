import { useEffect, useState } from "react";
import { Modal, View, ScrollView, TouchableOpacity } from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { T } from "@/constants/tokens";
import { carriersService } from "@/src/services/carriers";
import { CarrierRating } from "@/src/types";
import { EmptyState } from "@/src/components/EmptyState";
import { SkeletonCard } from "@/src/components/Skeleton";

function Stars({ n }: { n: number }) {
  return (
    <View className="flex-row gap-[2px]">
      {[1, 2, 3, 4, 5].map((i) => (
        <MaterialCommunityIcons key={i} name={i <= n ? "star" : "star-outline"} size={14} color={T.amber} />
      ))}
    </View>
  );
}

export function CarrierReviewsModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const [reviews, setReviews] = useState<CarrierRating[] | null>(null);

  useEffect(() => {
    if (!visible) return;
    let alive = true;
    setReviews(null);
    carriersService.getMyRatings().then((r) => { if (alive) setReviews(r); }).catch(() => { if (alive) setReviews([]); });
    return () => { alive = false; };
  }, [visible]);

  const avg = reviews && reviews.length
    ? reviews.reduce((s, r) => s + r.stars, 0) / reviews.length
    : null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
        <View className="flex-row items-center justify-between px-5 py-[14px] border-b border-borderSoft">
          <TouchableOpacity onPress={onClose} hitSlop={10}>
            <MaterialCommunityIcons name="arrow-left" size={22} color={T.ink} />
          </TouchableOpacity>
          <Text className="text-[17px] font-bold text-ink tracking-[-0.4px]">Mis calificaciones</Text>
          <View className="w-6" />
        </View>

        {avg != null && (
          <View className="flex-row items-center gap-2 px-5 py-4 border-b border-borderSoft">
            <Text className="text-3xl font-extrabold text-ink tracking-[-1px]">{avg.toFixed(1)}</Text>
            <View>
              <Stars n={Math.round(avg)} />
              <Text className="text-[11px] text-inkMute mt-[2px]">{reviews!.length} calificaciones</Text>
            </View>
          </View>
        )}

        <ScrollView contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: insets.bottom + 24 }}>
          {reviews === null ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : reviews.length === 0 ? (
            <EmptyState icon="star-outline" title="Todavía no tenés calificaciones" description="Cuando completes entregas, las reseñas van a aparecer acá." />
          ) : (
            reviews.map((r, i) => (
              <View key={i} className="bg-card rounded-[16px] border border-border p-4 gap-2">
                <View className="flex-row items-center justify-between">
                  <Stars n={r.stars} />
                  <Text className="text-[11px] text-inkMute">
                    {new Date(r.created_at).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" })}
                  </Text>
                </View>
                {r.comment ? <Text className="text-[13.5px] text-ink leading-[19px]">{r.comment}</Text> : null}
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

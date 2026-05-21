import { apiClient } from "./api";

export interface ClassificationResponse {
  predicted_label: "small" | "medium" | "large" | "moving";
  confidence: number;
}

export const visionService = {
  async classifyPackage(imageUri: string): Promise<ClassificationResponse> {
    const formData = new FormData();
    formData.append("image", {
      uri: imageUri,
      type: "image/jpeg",
      name: "package.jpg",
    } as any);

    const response = await apiClient.postFormData<ClassificationResponse>(
      "/vision/classify",
      formData,
    );
    return response.data;
  },

  async classifyManual(
    label: "small" | "medium" | "large" | "moving",
  ): Promise<ClassificationResponse> {
    const response = await apiClient.post<ClassificationResponse>(
      "/vision/classify",
      { manual_label: label },
    );
    return response.data;
  },
};

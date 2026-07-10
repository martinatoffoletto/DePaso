import { apiClient } from "@/src/shared/api/client";
import { ClassificationResult } from "@/src/shared/types";

export const visionService = {
  /**
   * Classify a package photo (RF-VIS-01). The image should already be resized
   * client-side; the backend preprocesses to 224x224.
   */
  async classifyPackage(
    imageUri: string,
    hasReferenceObject = false,
  ): Promise<ClassificationResult> {
    const formData = new FormData();
    formData.append("image", {
      uri: imageUri,
      type: "image/jpeg",
      name: "package.jpg",
    } as any);
    formData.append("has_reference_object", String(hasReferenceObject));

    const response = await apiClient.postFormData<ClassificationResult>(
      "/vision/classify",
      formData,
    );
    return response.data;
  },

  /** Record whether the user kept the suggestion or corrected it (RF-VIS-04). */
  async sendFeedback(
    classificationId: number,
    accepted: boolean,
    manualCategory?: string,
  ): Promise<void> {
    await apiClient.patch(`/vision/classifications/${classificationId}`, {
      accepted,
      manual_category: manualCategory,
    });
  },
};

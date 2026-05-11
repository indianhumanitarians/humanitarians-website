import type { CaseStory, CaseStoryImage } from "../types/stats";
import { normalizeImageUrl } from "../utils";

const imageFields = [
  ["image_url_1", "image_alt_1"],
  ["image_url_2", "image_alt_2"],
  ["image_url_3", "image_alt_3"],
] as const;

export const getCaseStoryMedia = (story: CaseStory): CaseStoryImage[] => {
  if (String(story.image_consent_status ?? "").trim().toLowerCase() !== "consent received") {
    return [];
  }

  return imageFields.reduce<CaseStoryImage[]>(
    (images, [urlKey, altKey], index) => {
      const src = normalizeImageUrl(String(story[urlKey] ?? ""));
      if (!src) {
        return images;
      }

      images.push({
        src,
        alt:
          String(story[altKey] ?? "").trim() ||
          `Public case story image ${index + 1} for ${story.title}`,
      });

      return images;
    },
    [],
  );
};

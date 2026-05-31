import type { CaseStory, CaseStoryImage } from "../types/stats";
import { normalizeImageUrl } from "../utils";

const imageFields = [
  ["case_image_1_url", "case_image_1_alt"],
  ["case_image_2_url", "case_image_2_alt"],
  ["case_image_3_url", "case_image_3_alt"],
] as const;

export const getCaseStoryMedia = (story: CaseStory): CaseStoryImage[] => {
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
          `Public case story image ${index + 1} for ${story.public_story_title}`,
      });

      return images;
    },
    [],
  );
};

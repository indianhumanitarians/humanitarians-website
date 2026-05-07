import type { CaseStory, CaseStoryImage } from "../types/stats";

export const caseStoryMedia: Record<string, CaseStoryImage[]> = {
  "CS-001": [
    { src: "/images/cases/case-cs-001-image-01.jpeg", alt: "Sewing livelihood support arranged for the first public case story" },
    { src: "/images/cases/case-cs-001-image-02.jpeg", alt: "Tailoring support image for the first public case story" },
    { src: "/images/cases/case-cs-001-image-03.jpeg", alt: "Sewing machine support image for the first public case story" },
  ],
  "CS-002": [
    { src: "/images/cases/shop-inventory.svg", alt: "Shop inventory arranged for a small livelihood case" },
    { src: "/images/cases/business-supplies.svg", alt: "Business supplies and stock support" },
    { src: "/images/cases/tools-equipment.svg", alt: "Equipment support for income generation" },
  ],
  "CS-003": [
    { src: "/images/cases/course-support.svg", alt: "Course sponsorship and skill support" },
    { src: "/images/cases/mentorship-support.svg", alt: "Mentorship and job-readiness guidance" },
    { src: "/images/cases/education-support.svg", alt: "Education support for a public case story" },
  ],
};

const defaultCaseStoryMedia: CaseStoryImage[] = [
  { src: "/images/cases/business-supplies.svg", alt: "Public-safe illustration of livelihood support supplies" },
  { src: "/images/cases/tools-equipment.svg", alt: "Public-safe illustration of tools and equipment support" },
  { src: "/images/cases/livelihood-followup.svg", alt: "Public-safe illustration of livelihood follow-up" },
];

const storySearchText = (story: CaseStory): string =>
  [
    story.case_id,
    story.title,
    story.category,
    story.support_type,
    story.need,
    story.support_provided,
  ]
    .join(" ")
    .toLowerCase();

export const getCaseStoryMedia = (story: CaseStory): CaseStoryImage[] => {
  const directMatch = caseStoryMedia[story.case_id];
  if (directMatch?.length) {
    return directMatch;
  }

  const text = storySearchText(story);

  if (/(sewing|tailor|stitch|machine)/.test(text)) {
    return caseStoryMedia["CS-001"];
  }

  if (/(shop|business|inventory|stock|tool|equipment|rickshaw|auto|livelihood)/.test(text)) {
    return caseStoryMedia["CS-002"];
  }

  if (/(course|education|skill|student|mentor|job|it|coding|data)/.test(text)) {
    return caseStoryMedia["CS-003"];
  }

  return defaultCaseStoryMedia;
};

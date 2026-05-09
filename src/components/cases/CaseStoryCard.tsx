import { useState } from "react";
import { getApprovedCaseStoryImages, getCaseStoryMedia, getFallbackCaseStoryMedia } from "../../data/caseStoryMedia";
import type { CaseStory } from "../../types/stats";
import { Button } from "../common/Button";
import { CaseImageCarousel } from "./CaseImageCarousel";

interface CaseStoryCardProps {
  story: CaseStory;
}

export const CaseStoryCard = ({ story }: CaseStoryCardProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const images = getCaseStoryMedia(story);
  const fallbackImages = getApprovedCaseStoryImages(story).length > 0 ? getFallbackCaseStoryMedia(story) : [];

  return (
    <article className="case-card">
      <CaseImageCarousel images={images} fallbackImages={fallbackImages} title={story.title} />
      <div className="case-card-body">
        <div className="badge-row">
          <span className="badge">{story.category}</span>
          <span className="badge muted">{story.fund_type}</span>
        </div>
        <h3>{story.title}</h3>
        <p className="case-meta">
          {story.anonymized_name} · {story.public_location} · {story.amount_range}
        </p>
        <p>{story.need}</p>
        <Button variant="ghost" ariaLabel={`Read details for ${story.title}`} onClick={() => setIsOpen((current) => !current)}>
          {isOpen ? "Hide details" : "Read details"}
        </Button>
        {isOpen ? (
          <div className="case-details">
            <p>
              <strong>Support provided:</strong> {story.support_provided}
            </p>
            <p>
              <strong>Outcome:</strong> {story.outcome}
            </p>
            <p>
              <strong>Follow-up:</strong> {story.follow_up}
            </p>
            {story.verified_quote ? (
              <blockquote>{story.verified_quote}</blockquote>
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  );
};

import { useMemo, useState } from "react";
import { getCaseStoryMedia } from "../../data/caseStoryMedia";
import type { CaseStory } from "../../types/stats";
import { Button } from "../common/Button";
import { CaseImageCarousel } from "./CaseImageCarousel";

interface CaseStoryCardProps {
  story: CaseStory;
}

export const CaseStoryCard = ({ story }: CaseStoryCardProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const images = useMemo(() => getCaseStoryMedia(story), [story]);

  return (
    <article className="case-card">
      <CaseImageCarousel images={images} title={story.public_story_title} />
      <div className="case-card-body">
        <div className="badge-row">
          <span className="badge">{story.support_category}</span>
          <span className="badge muted">{story.fund_source}</span>
        </div>
        <h3>{story.public_story_title}</h3>
        <p className="case-meta">
          <span>{story.public_location}</span>
          <span className="case-meta-amount">{story.amount_range}</span>
        </p>
        <p>{story.public_need_summary}</p>
        <Button
          variant="ghost"
          ariaLabel={`Read details for ${story.public_story_title}`}
          onClick={() => setIsOpen((current) => !current)}
        >
          {isOpen ? "Hide details" : "Read details"}
        </Button>
        {isOpen ? (
          <div className="case-details">
            <p>
              <strong>Support provided:</strong> {story.public_support_summary}
            </p>
            <p>
              <strong>Outcome:</strong> {story.public_outcome_summary}
            </p>
            <p>
              <strong>Follow-up:</strong> {story.public_follow_up_summary}
            </p>
          </div>
        ) : null}
      </div>
    </article>
  );
};

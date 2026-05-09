import { useMemo, useState } from "react";
import { CaseStoryCard } from "../components/cases/CaseStoryCard";
import { CaseStoryFilters } from "../components/cases/CaseStoryFilters";
import { Button } from "../components/common/Button";
import { PrivacyNote } from "../components/common/PrivacyNote";
import { SectionHeading } from "../components/common/SectionHeading";
import { useCaseStories } from "../hooks/useCaseStories";

const initialStoryLimit = 9;

export const CaseStories = () => {
  const { stories, loading, error } = useCaseStories();
  const [category, setCategory] = useState("all");
  const [fundType, setFundType] = useState("all");
  const [supportType, setSupportType] = useState("all");
  const [showAllStories, setShowAllStories] = useState(false);

  const filteredStories = useMemo(
    () =>
      stories.filter(
        (story) =>
          (category === "all" || story.category === category) &&
          (fundType === "all" || story.fund_type === fundType) &&
          (supportType === "all" || story.support_type === supportType),
      ),
    [category, fundType, stories, supportType],
  );
  const visibleStories = showAllStories
    ? filteredStories
    : filteredStories.slice(0, initialStoryLimit);
  const hasMoreStories = filteredStories.length > initialStoryLimit;

  const handleCategoryChange = (nextCategory: string) => {
    setCategory(nextCategory);
    setShowAllStories(false);
  };

  const handleFundTypeChange = (nextFundType: string) => {
    setFundType(nextFundType);
    setShowAllStories(false);
  };

  const handleSupportTypeChange = (nextSupportType: string) => {
    setSupportType(nextSupportType);
    setShowAllStories(false);
  };

  return (
    <main className="container page">
      <SectionHeading
        title="Anonymized case stories"
        content="Stories are anonymized because dignity is part of the work. Only public-safe details are shown."
      />
      <PrivacyNote>
        Public stories are anonymized to protect recipient dignity and privacy.
      </PrivacyNote>
      {loading ? (
        <p className="soft-status">Loading public case stories from the live sheet...</p>
      ) : null}
      {!loading && error ? (
        <p className="soft-status">Live case stories could not be loaded right now.</p>
      ) : null}
      {!loading && stories.length > 0 ? (
        <CaseStoryFilters
          stories={stories}
          category={category}
          fundType={fundType}
          supportType={supportType}
          onCategoryChange={handleCategoryChange}
          onFundTypeChange={handleFundTypeChange}
          onSupportTypeChange={handleSupportTypeChange}
        />
      ) : null}
      <div className="case-grid case-grid-compact">
        {loading ? (
          <p className="empty-state">Fetching published stories from the live public sheet...</p>
        ) : visibleStories.length > 0 ? (
          visibleStories.map((story) => (
            <CaseStoryCard key={story.case_id} story={story} />
          ))
        ) : (
          <p className="empty-state">
            No public stories match the selected filters.
          </p>
        )}
      </div>
      {hasMoreStories ? (
        <div className="load-more-actions">
          <p>
            Showing {visibleStories.length} of {filteredStories.length} public
            case stories.
          </p>
          <Button
            variant="secondary"
            onClick={() => setShowAllStories((current) => !current)}
          >
            {showAllStories
              ? "Show fewer case stories"
              : "View more case stories"}
          </Button>
        </div>
      ) : null}
    </main>
  );
};

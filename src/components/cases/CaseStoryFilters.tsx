import type { CaseStory } from "../../types/stats";

interface CaseStoryFiltersProps {
  stories: CaseStory[];
  category: string;
  fundType: string;
  supportType: string;
  onCategoryChange: (value: string) => void;
  onFundTypeChange: (value: string) => void;
  onSupportTypeChange: (value: string) => void;
}

const uniqueValues = (stories: CaseStory[], key: keyof CaseStory): string[] =>
  Array.from(new Set(stories.map((story) => String(story[key])).filter(Boolean))).sort();

export const CaseStoryFilters = ({
  stories,
  category,
  fundType,
  supportType,
  onCategoryChange,
  onFundTypeChange,
  onSupportTypeChange,
}: CaseStoryFiltersProps) => (
  <div className="filters" aria-label="Case story filters">
    <label>
      Category
      <select value={category} onChange={(event) => onCategoryChange(event.target.value)}>
        <option value="all">All</option>
        {uniqueValues(stories, "support_category").map((value) => (
          <option key={value} value={value}>
            {value}
          </option>
        ))}
      </select>
    </label>
    <label>
      Fund type
      <select value={fundType} onChange={(event) => onFundTypeChange(event.target.value)}>
        <option value="all">All</option>
        {uniqueValues(stories, "fund_source").map((value) => (
          <option key={value} value={value}>
            {value}
          </option>
        ))}
      </select>
    </label>
    <label>
      Support type
      <select value={supportType} onChange={(event) => onSupportTypeChange(event.target.value)}>
        <option value="all">All</option>
        {uniqueValues(stories, "support_description").map((value) => (
          <option key={value} value={value}>
            {value}
          </option>
        ))}
      </select>
    </label>
  </div>
);

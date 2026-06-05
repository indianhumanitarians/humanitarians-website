import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { AdminShell } from "../components/admin/AdminShell";
import { AdminTopActions } from "../components/admin/AdminTopActions";
import { useAdminAuth } from "../hooks/useAdminAuth";
import { useAdminCases } from "../hooks/useAdminCases";
import {
  caseNumberSequence,
  deleteAdminCase,
  periodLabelFromSort,
  periodSortFromLabel,
} from "../services/adminCases";
import { adminCaseTotalAmount } from "../services/adminInsights";
import type { AdminCase } from "../types/admin";
import { formatRupees } from "../utils";

const formatDate = (value: string): string =>
  new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));

type SortDirection = "asc" | "desc";
type PublicFilter = "all" | "stats" | "stories" | "private";

const emptyValue = (value: string | null | undefined): string =>
  value?.trim() || "-";

const normalized = (value: string | null | undefined): string =>
  String(value ?? "").trim().toLowerCase();

const uniqueSorted = (values: Array<string | null | undefined>): string[] =>
  Array.from(new Set(values.map((value) => value?.trim()).filter(Boolean) as string[]))
    .sort((left, right) => left.localeCompare(right));

interface PeriodFilterOption {
  label: string;
  value: string;
}

const periodSortForCase = (item: AdminCase): number =>
  item.reporting_month_sort ?? periodSortFromLabel(item.reporting_month) ?? 0;

const uniquePeriodsDescending = (items: AdminCase[]): PeriodFilterOption[] =>
  [...items.reduce<Map<number, PeriodFilterOption>>((periods, item) => {
    const periodSort = periodSortForCase(item);
    if (periodSort > 0 && !periods.has(periodSort)) {
      periods.set(periodSort, {
        label: periodLabelFromSort(periodSort) || item.reporting_month,
        value: String(periodSort),
      });
    }
    return periods;
  }, new Map()).values()].sort(
    (left, right) => Number(right.value) - Number(left.value),
  );

const csvValue = (value: string | number | boolean | null | undefined): string => {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const caseExportColumns: Array<{
  label: string;
  value: (item: AdminCase) => string | number | boolean | null | undefined;
}> = [
  { label: "Case number", value: (item) => item.case_number },
  { label: "Period", value: (item) => item.reporting_month },
  { label: "Show in public stats", value: (item) => item.show_in_public_stats },
  { label: "Publish public story", value: (item) => item.publish_public_story },
  { label: "Title", value: (item) => item.public_story_title },
  { label: "Public location", value: (item) => item.public_location },
  { label: "Category", value: (item) => item.support_category },
  { label: "Sub category / support", value: (item) => item.support_description },
  { label: "Zakat amount", value: (item) => item.zakat_amount },
  { label: "Sadaqah amount", value: (item) => item.sadaqah_amount },
  { label: "Other amount", value: (item) => item.other_amount },
  { label: "Total amount", value: (item) => adminCaseTotalAmount(item) },
  { label: "Fund type", value: (item) => item.fund_source },
  { label: "Beneficiary name", value: (item) => item.beneficiary_name },
  { label: "Phone", value: (item) => item.beneficiary_phone },
  { label: "Private address", value: (item) => item.beneficiary_private_location },
  { label: "Created by", value: (item) => item.created_by },
  { label: "Updated by", value: (item) => item.updated_by },
  { label: "Created", value: (item) => item.created_at },
  { label: "Updated", value: (item) => item.updated_at },
];

const downloadCaseCsv = (rows: AdminCase[], fileLabel: string): void => {
  const headerRow = caseExportColumns.map((column) => csvValue(column.label)).join(",");
  const dataRows = rows.map((item) =>
    caseExportColumns.map((column) => csvValue(column.value(item))).join(","),
  );
  const csv = `\uFEFF${[headerRow, ...dataRows].join("\n")}`;
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = `case-ledger-${fileLabel}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
};

export const AdminCaseLedger = () => {
  const { session } = useAdminAuth();
  const { cases, loading, error, reload } = useAdminCases(session?.accessToken);
  const [caseSortDirection, setCaseSortDirection] =
    useState<SortDirection>("desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [periodFilter, setPeriodFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [fundFilter, setFundFilter] = useState("all");
  const [publicFilter, setPublicFilter] = useState<PublicFilter>("all");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [deletingCase, setDeletingCase] = useState<string | undefined>();
  const [deleteError, setDeleteError] = useState<string | undefined>();
  const filterOptions = useMemo(
    () => ({
      periods: uniquePeriodsDescending(cases),
      categories: uniqueSorted(cases.map((item) => item.support_category)),
      fundTypes: uniqueSorted(cases.map((item) => item.fund_source)),
    }),
    [cases],
  );
  const filteredCases = useMemo(() => {
    const query = normalized(searchQuery);

    return cases.filter((item) => {
      const matchesSearch =
        !query ||
        [
          item.case_number,
          item.reporting_month,
          item.public_story_title,
          item.public_location,
          item.support_category,
          item.support_description,
          item.fund_source,
          item.beneficiary_name,
          item.beneficiary_phone,
          item.beneficiary_private_location,
          item.created_by,
          item.updated_by,
        ].some((value) => normalized(value).includes(query));
      const matchesPeriod =
        periodFilter === "all" || String(periodSortForCase(item)) === periodFilter;
      const matchesCategory =
        categoryFilter === "all" || item.support_category === categoryFilter;
      const matchesFund =
        fundFilter === "all" || item.fund_source === fundFilter;
      const matchesPublic =
        publicFilter === "all" ||
        (publicFilter === "stats" && item.show_in_public_stats) ||
        (publicFilter === "stories" && item.publish_public_story) ||
        (publicFilter === "private" &&
          !item.show_in_public_stats &&
          !item.publish_public_story);

      return (
        matchesSearch &&
        matchesPeriod &&
        matchesCategory &&
        matchesFund &&
        matchesPublic
      );
    });
  }, [cases, categoryFilter, fundFilter, periodFilter, publicFilter, searchQuery]);
  const sortedCases = useMemo(
    () =>
      [...filteredCases].sort((left, right) => {
        const leftSequence = caseNumberSequence(left.case_number);
        const rightSequence = caseNumberSequence(right.case_number);

        if (leftSequence !== null && rightSequence === null) {
          return -1;
        }

        if (leftSequence === null && rightSequence !== null) {
          return 1;
        }

        const comparison =
          leftSequence !== null && rightSequence !== null
            ? leftSequence - rightSequence
            : left.case_number.localeCompare(right.case_number, undefined, {
                numeric: true,
                sensitivity: "base",
              });

        return caseSortDirection === "asc" ? comparison : -comparison;
      }),
    [caseSortDirection, filteredCases],
  );
  const activeFilterCount = [
    searchQuery.trim(),
    periodFilter !== "all",
    categoryFilter !== "all",
    fundFilter !== "all",
    publicFilter !== "all",
  ].filter(Boolean).length;

  const handleDeleteCase = async (caseNumber: string) => {
    if (!session || deletingCase) {
      return;
    }

    const confirmed = window.confirm(
      `Delete ${caseNumber}? This will also remove its case image files from Supabase Storage.`,
    );
    if (!confirmed) {
      return;
    }

    setDeletingCase(caseNumber);
    setDeleteError(undefined);

    try {
      await deleteAdminCase(session.accessToken, caseNumber);
      await reload();
    } catch (deleteCaseError) {
      setDeleteError(
        deleteCaseError instanceof Error
          ? deleteCaseError.message
          : "Could not delete case.",
      );
    } finally {
      setDeletingCase(undefined);
    }
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setPeriodFilter("all");
    setCategoryFilter("all");
    setFundFilter("all");
    setPublicFilter("all");
  };

  const handleExport = () => {
    const fileLabel =
      periodFilter === "all"
        ? "all-filtered"
        : periodFilter.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    downloadCaseCsv(sortedCases, fileLabel);
  };

  return (
    <AdminShell
      title="Case ledger"
      eyebrow="Private case records"
      actions={<AdminTopActions />}
    >
      <section className="admin-panel">
        <div className="table-toolbar">
          <h3>Case ledger</h3>
        </div>
        {loading ? <p className="soft-status">Loading cases...</p> : null}
        {error ? <p className="admin-error">{error}</p> : null}
        {deleteError ? <p className="admin-error">{deleteError}</p> : null}
        <button
          type="button"
          className="admin-filter-toggle"
          aria-expanded={filtersOpen}
          aria-controls="case-ledger-filters"
          onClick={() => setFiltersOpen((current) => !current)}
        >
          <span>Filters</span>
          <strong>{activeFilterCount > 0 ? `${activeFilterCount} active` : "All rows"}</strong>
        </button>
        <div
          className={`admin-table-controls ${filtersOpen ? "is-open" : ""}`}
          id="case-ledger-filters"
        >
          <label className="admin-filter-field admin-filter-search">
            <span>Search</span>
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Case, beneficiary, phone, category..."
            />
          </label>
          <label className="admin-filter-field">
            <span>Month</span>
            <select
              value={periodFilter}
              onChange={(event) => setPeriodFilter(event.target.value)}
            >
              <option value="all">All months</option>
              {filterOptions.periods.map((period) => (
                <option value={period.value} key={period.value}>
                  {period.label}
                </option>
              ))}
            </select>
          </label>
          <label className="admin-filter-field">
            <span>Category</span>
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
            >
              <option value="all">All categories</option>
              {filterOptions.categories.map((category) => (
                <option value={category} key={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>
          <label className="admin-filter-field">
            <span>Fund type</span>
            <select
              value={fundFilter}
              onChange={(event) => setFundFilter(event.target.value)}
            >
              <option value="all">All fund types</option>
              {filterOptions.fundTypes.map((fundType) => (
                <option value={fundType} key={fundType}>
                  {fundType}
                </option>
              ))}
            </select>
          </label>
          <label className="admin-filter-field">
            <span>Public</span>
            <select
              value={publicFilter}
              onChange={(event) => setPublicFilter(event.target.value as PublicFilter)}
            >
              <option value="all">All rows</option>
              <option value="stats">Included in stats</option>
              <option value="stories">Published stories</option>
              <option value="private">Private only</option>
            </select>
          </label>
          <div className="admin-filter-actions">
            <button
              type="button"
              className="admin-small-button"
              onClick={handleResetFilters}
            >
              Reset
            </button>
            <button
              type="button"
              className="admin-small-button"
              onClick={handleExport}
              disabled={sortedCases.length === 0}
            >
              Export CSV
            </button>
          </div>
        </div>
        <p className="admin-helper-text">
          Showing {sortedCases.length} of {cases.length} cases.
        </p>
        {!loading && cases.length === 0 ? (
          <p className="empty-state">No cases have been added yet.</p>
        ) : null}
        {cases.length > 0 ? (
          <div className="admin-table-wrap">
            <table className="admin-table admin-extra-wide-table">
              <colgroup>
                <col className="admin-case-col" />
                <col className="admin-period-col" />
                <col className="admin-public-col" />
                <col className="admin-story-col" />
                <col className="admin-location-col" />
                <col className="admin-category-col" />
                <col className="admin-support-col" />
                <col className="admin-amount-col" />
                <col className="admin-amount-col" />
                <col className="admin-amount-col" />
                <col className="admin-amount-col" />
                <col className="admin-fund-col" />
                <col className="admin-beneficiary-col" />
                <col className="admin-phone-col" />
                <col className="admin-address-col" />
                <col className="admin-audit-user-col" />
                <col className="admin-audit-user-col" />
                <col className="admin-updated-col" />
                <col className="admin-action-col" />
              </colgroup>
              <thead>
                <tr>
                  <th aria-sort={caseSortDirection === "asc" ? "ascending" : "descending"}>
                    <button
                      type="button"
                      className="admin-table-sort-button"
                      onClick={() =>
                        setCaseSortDirection((current) =>
                          current === "desc" ? "asc" : "desc",
                        )
                      }
                    >
                      Case number
                      <span aria-hidden="true">
                        {caseSortDirection === "desc" ? "↓" : "↑"}
                      </span>
                    </button>
                  </th>
                  <th>Period</th>
                  <th>Public status</th>
                  <th>Title</th>
                  <th>Location</th>
                  <th>Category</th>
                  <th>Sub category / support</th>
                  <th>Zakat amount</th>
                  <th>Sadaqah amount</th>
                  <th>Other amount</th>
                  <th>Total amount</th>
                  <th>Fund type</th>
                  <th>Beneficiary</th>
                  <th>Phone</th>
                  <th>Private address</th>
                  <th>Created by</th>
                  <th>Updated by</th>
                  <th>Updated</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {sortedCases.map((item) => (
                  <tr key={item.case_number}>
                    <td className="admin-nowrap-cell">
                      <strong>{item.case_number}</strong>
                    </td>
                    <td className="admin-nowrap-cell">{item.reporting_month}</td>
                    <td className="admin-nowrap-cell">
                      <span className={`status-pill ${item.show_in_public_stats ? "on" : ""}`}>
                        Stats
                      </span>
                      <span className={`status-pill ${item.publish_public_story ? "on" : ""}`}>
                        Story
                      </span>
                    </td>
                    <td className="admin-text-cell">
                      <strong>{emptyValue(item.public_story_title)}</strong>
                    </td>
                    <td className="admin-text-cell">{emptyValue(item.public_location)}</td>
                    <td className="admin-text-cell">{item.support_category}</td>
                    <td className="admin-text-cell">{item.support_description}</td>
                    <td className="admin-money-cell">{formatRupees(item.zakat_amount)}</td>
                    <td className="admin-money-cell">{formatRupees(item.sadaqah_amount)}</td>
                    <td className="admin-money-cell">{formatRupees(item.other_amount)}</td>
                    <td className="admin-money-cell">{formatRupees(adminCaseTotalAmount(item))}</td>
                    <td className="admin-nowrap-cell">{item.fund_source}</td>
                    <td className="admin-text-cell">{emptyValue(item.beneficiary_name)}</td>
                    <td className="admin-nowrap-cell">{emptyValue(item.beneficiary_phone)}</td>
                    <td className="admin-text-cell">{emptyValue(item.beneficiary_private_location)}</td>
                    <td className="admin-nowrap-cell">{emptyValue(item.created_by)}</td>
                    <td className="admin-nowrap-cell">{emptyValue(item.updated_by)}</td>
                    <td className="admin-nowrap-cell">{formatDate(item.updated_at)}</td>
                    <td className="admin-nowrap-cell">
                      <div className="admin-table-actions admin-case-actions">
                        <Link
                          className="admin-inline-link"
                          to={`/admin/cases/${item.case_number}/edit`}
                        >
                          Edit
                        </Link>
                        <button
                          type="button"
                          className="admin-small-button admin-danger-button"
                          disabled={deletingCase === item.case_number}
                          onClick={() => void handleDeleteCase(item.case_number)}
                        >
                          {deletingCase === item.case_number ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </AdminShell>
  );
};

import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { AdminShell } from "../components/admin/AdminShell";
import { AdminTopActions } from "../components/admin/AdminTopActions";
import { useAdminAuth } from "../hooks/useAdminAuth";
import { useAdminCases } from "../hooks/useAdminCases";
import { caseNumberSequence, deleteAdminCase } from "../services/adminCases";
import { adminCaseTotalAmount } from "../services/adminInsights";
import { formatRupees } from "../utils";

const formatDate = (value: string): string =>
  new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));

type SortDirection = "asc" | "desc";

const emptyValue = (value: string | null | undefined): string =>
  value?.trim() || "-";

export const AdminCaseLedger = () => {
  const { session } = useAdminAuth();
  const { cases, loading, error, reload } = useAdminCases(session?.accessToken);
  const [caseSortDirection, setCaseSortDirection] =
    useState<SortDirection>("asc");
  const [deletingCase, setDeletingCase] = useState<string | undefined>();
  const [deleteError, setDeleteError] = useState<string | undefined>();
  const sortedCases = useMemo(
    () =>
      [...cases].sort((left, right) => {
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
    [caseSortDirection, cases],
  );

  const handleDeleteCase = async (caseNumber: string) => {
    if (!session || deletingCase) {
      return;
    }

    const confirmed = window.confirm(
      `Delete ${caseNumber}? This will also remove its case images from the database.`,
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

  return (
    <AdminShell
      title="Case ledger"
      eyebrow="Private case records"
      actions={<AdminTopActions />}
    >
      <section className="admin-panel">
        <div className="table-toolbar">
          <h3>Case ledger</h3>
          <Link className="admin-inline-link" to="/reports">
            View public reports
          </Link>
        </div>
        {loading ? <p className="soft-status">Loading cases...</p> : null}
        {error ? <p className="admin-error">{error}</p> : null}
        {deleteError ? <p className="admin-error">{deleteError}</p> : null}
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
                      <span>{emptyValue(item.public_beneficiary_label)}</span>
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
                    <td className="admin-nowrap-cell">{formatDate(item.updated_at)}</td>
                    <td className="admin-nowrap-cell">
                      <div className="admin-table-actions">
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

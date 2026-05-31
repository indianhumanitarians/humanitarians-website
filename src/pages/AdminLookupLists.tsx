import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { AdminShell } from "../components/admin/AdminShell";
import { AdminTopActions } from "../components/admin/AdminTopActions";
import { useAdminAuth } from "../hooks/useAdminAuth";
import { useAdminCases } from "../hooks/useAdminCases";
import {
  createFundType,
  createSupportCategory,
  deleteLookupOption,
  fetchAdminLookupLists,
  updateLookupOption,
  type CaseLookupTable,
} from "../services/adminCases";
import type { CaseLookupOption } from "../types/admin";

type LookupDraft = Pick<CaseLookupOption, "name" | "is_active">;

const normalizeLookupName = (value: string): string =>
  value.trim().toLowerCase();

const draftKey = (table: CaseLookupTable, optionId: string): string =>
  `${table}:${optionId}`;

const formatDate = (value: string | undefined): string =>
  value
    ? new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(new Date(value))
    : "-";

const usageCountFor = (
  usageByName: Map<string, number>,
  option: CaseLookupOption,
): number => usageByName.get(normalizeLookupName(option.name)) ?? 0;

interface LookupListPanelProps {
  addValue: string;
  disabled?: boolean;
  drafts: Record<string, LookupDraft>;
  onAddValueChange: (value: string) => void;
  onCreate: (event: FormEvent<HTMLFormElement>) => void;
  onDelete: (option: CaseLookupOption) => void;
  onDraftChange: (option: CaseLookupOption, draft: LookupDraft) => void;
  onSave: (option: CaseLookupOption) => void;
  onToggleActive: (option: CaseLookupOption) => void;
  options: CaseLookupOption[];
  table: CaseLookupTable;
  title: string;
  usageByName: Map<string, number>;
}

const LookupListPanel = ({
  addValue,
  disabled,
  drafts,
  onAddValueChange,
  onCreate,
  onDelete,
  onDraftChange,
  onSave,
  onToggleActive,
  options,
  table,
  title,
  usageByName,
}: LookupListPanelProps) => (
  <section className="admin-panel">
    <div className="table-toolbar">
      <h3>{title}</h3>
      <form className="admin-inline-field admin-list-add-form" onSubmit={onCreate}>
        <input
          aria-label={`New ${title.toLowerCase()} name`}
          value={addValue}
          onChange={(event) => onAddValueChange(event.target.value)}
          placeholder={`Add ${title.toLowerCase()}`}
        />
        <button className="admin-small-button" disabled={disabled} type="submit">
          Add
        </button>
      </form>
    </div>

    {options.length === 0 ? (
      <p className="empty-state">No {title.toLowerCase()} have been added yet.</p>
    ) : (
      <div className="admin-table-wrap">
        <table className="admin-table admin-lookup-table">
          <colgroup>
            <col className="admin-lookup-name-col" />
            <col className="admin-lookup-status-col" />
            <col className="admin-lookup-usage-col" />
            <col className="admin-lookup-updated-col" />
            <col className="admin-lookup-updated-by-col" />
            <col className="admin-lookup-action-col" />
          </colgroup>
          <thead>
            <tr>
              <th>Name</th>
              <th>Status</th>
              <th>Cases using it</th>
              <th>Updated</th>
              <th>Updated by</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {options.map((option) => {
              const key = draftKey(table, option.id);
              const draft = drafts[key] ?? {
                name: option.name,
                is_active: option.is_active,
              };
              const usageCount = usageCountFor(usageByName, option);
              const hasChanges =
                draft.name.trim() !== option.name ||
                draft.is_active !== option.is_active;

              return (
                <tr key={option.id}>
                  <td>
                    <input
                      className="admin-table-input"
                      value={draft.name}
                      onChange={(event) =>
                        onDraftChange(option, {
                          ...draft,
                          name: event.target.value,
                        })
                      }
                    />
                  </td>
                  <td className="admin-nowrap-cell">
                    <span className={`status-pill ${draft.is_active ? "on" : ""}`}>
                      {draft.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="admin-nowrap-cell">
                    <strong>{usageCount}</strong>
                  </td>
                  <td className="admin-nowrap-cell">{formatDate(option.updated_at)}</td>
                  <td className="admin-text-cell">{option.updated_by ?? "-"}</td>
                  <td>
                    <div className="admin-table-actions">
                      <button
                        className="admin-small-button"
                        disabled={disabled || !hasChanges || !draft.name.trim()}
                        type="button"
                        onClick={() => onSave(option)}
                      >
                        Save
                      </button>
                      <button
                        className="admin-small-button"
                        disabled={disabled}
                        type="button"
                        onClick={() => onToggleActive(option)}
                      >
                        {option.is_active ? "Deactivate" : "Activate"}
                      </button>
                      {usageCount === 0 ? (
                        <button
                          className="admin-small-button admin-danger-button"
                          disabled={disabled}
                          type="button"
                          onClick={() => onDelete(option)}
                        >
                          Delete
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    )}
  </section>
);

export const AdminLookupLists = () => {
  const { session } = useAdminAuth();
  const {
    cases,
    loading: casesLoading,
    error: casesError,
    reload: reloadCases,
  } = useAdminCases(session?.accessToken);
  const [categories, setCategories] = useState<CaseLookupOption[]>([]);
  const [fundTypes, setFundTypes] = useState<CaseLookupOption[]>([]);
  const [drafts, setDrafts] = useState<Record<string, LookupDraft>>({});
  const [newCategory, setNewCategory] = useState("");
  const [newFundType, setNewFundType] = useState("");
  const [loadingLists, setLoadingLists] = useState(Boolean(session));
  const [actionKey, setActionKey] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();
  const [notice, setNotice] = useState<string | undefined>();

  const syncDrafts = useCallback(
    (nextCategories: CaseLookupOption[], nextFundTypes: CaseLookupOption[]) => {
      setDrafts(
        [...nextCategories, ...nextFundTypes].reduce<Record<string, LookupDraft>>(
          (nextDrafts, option) => {
            const table = nextCategories.includes(option)
              ? "support_categories"
              : "fund_types";
            nextDrafts[draftKey(table, option.id)] = {
              name: option.name,
              is_active: option.is_active,
            };
            return nextDrafts;
          },
          {},
        ),
      );
    },
    [],
  );

  const loadLookupLists = useCallback(async () => {
    if (!session) {
      setCategories([]);
      setFundTypes([]);
      setLoadingLists(false);
      return;
    }

    setLoadingLists(true);
    setError(undefined);

    try {
      const lists = await fetchAdminLookupLists(session.accessToken);
      setCategories(lists.categories);
      setFundTypes(lists.fundTypes);
      syncDrafts(lists.categories, lists.fundTypes);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load categories and fund types.",
      );
    } finally {
      setLoadingLists(false);
    }
  }, [session, syncDrafts]);

  useEffect(() => {
    void loadLookupLists();
  }, [loadLookupLists]);

  const categoryUsage = useMemo(() => {
    const usage = new Map<string, number>();
    cases.forEach((item) => {
      const key = normalizeLookupName(item.support_category);
      if (key) {
        usage.set(key, (usage.get(key) ?? 0) + 1);
      }
    });
    return usage;
  }, [cases]);

  const fundTypeUsage = useMemo(() => {
    const usage = new Map<string, number>();
    cases.forEach((item) => {
      const key = normalizeLookupName(item.fund_source);
      if (key) {
        usage.set(key, (usage.get(key) ?? 0) + 1);
      }
    });
    return usage;
  }, [cases]);

  const withAction = async (key: string, action: () => Promise<void>) => {
    setActionKey(key);
    setError(undefined);
    setNotice(undefined);

    try {
      await action();
    } catch (actionError) {
      setError(
        actionError instanceof Error ? actionError.message : "Action failed.",
      );
    } finally {
      setActionKey(undefined);
    }
  };

  const createOption = async (table: CaseLookupTable, name: string) => {
    if (!session) {
      setError("Admin session is not available.");
      return;
    }

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Name is required.");
      return;
    }

    await withAction(`${table}:create`, async () => {
      if (table === "support_categories") {
        await createSupportCategory(session.accessToken, trimmedName);
        setNewCategory("");
      } else {
        await createFundType(session.accessToken, trimmedName);
        setNewFundType("");
      }
      await loadLookupLists();
      setNotice(`${trimmedName} has been added.`);
    });
  };

  const saveOption = async (
    table: CaseLookupTable,
    option: CaseLookupOption,
    usageCount: number,
  ) => {
    if (!session) {
      setError("Admin session is not available.");
      return;
    }

    const draft = drafts[draftKey(table, option.id)];
    if (!draft) {
      return;
    }

    const nextName = draft.name.trim();
    if (!nextName) {
      setError("Name is required.");
      return;
    }

    if (nextName !== option.name && usageCount > 0) {
      const confirmed = window.confirm(
        `Rename ${option.name} to ${nextName} in ${usageCount} existing case records?`,
      );
      if (!confirmed) {
        return;
      }
    }

    await withAction(draftKey(table, option.id), async () => {
      await updateLookupOption(session.accessToken, table, option, {
        name: nextName,
        is_active: draft.is_active,
      });
      await Promise.all([loadLookupLists(), reloadCases()]);
      setNotice(`${nextName} has been updated.`);
    });
  };

  const toggleActive = async (
    table: CaseLookupTable,
    option: CaseLookupOption,
    usageCount: number,
  ) => {
    if (!session) {
      setError("Admin session is not available.");
      return;
    }

    if (option.is_active && usageCount > 0) {
      const confirmed = window.confirm(
        `${option.name} is used by ${usageCount} case records. Deactivate it for future cases while keeping old records unchanged?`,
      );
      if (!confirmed) {
        return;
      }
    }

    await withAction(draftKey(table, option.id), async () => {
      await updateLookupOption(session.accessToken, table, option, {
        name: option.name,
        is_active: !option.is_active,
      });
      await loadLookupLists();
      setNotice(
        `${option.name} is now ${option.is_active ? "inactive" : "active"}.`,
      );
    });
  };

  const deleteOption = async (
    table: CaseLookupTable,
    option: CaseLookupOption,
    usageCount: number,
  ) => {
    if (!session) {
      setError("Admin session is not available.");
      return;
    }
    if (usageCount > 0) {
      setError("Used list values can be deactivated, but not deleted.");
      return;
    }

    const confirmed = window.confirm(`Delete ${option.name}?`);
    if (!confirmed) {
      return;
    }

    await withAction(draftKey(table, option.id), async () => {
      await deleteLookupOption(session.accessToken, table, option.id);
      await loadLookupLists();
      setNotice(`${option.name} has been deleted.`);
    });
  };

  const updateDraft = (
    table: CaseLookupTable,
    option: CaseLookupOption,
    draft: LookupDraft,
  ) => {
    setDrafts((current) => ({
      ...current,
      [draftKey(table, option.id)]: draft,
    }));
  };

  const isBusy = loadingLists || casesLoading || Boolean(actionKey);

  return (
    <AdminShell
      title="Manage lists"
      eyebrow="Admin setup"
      actions={<AdminTopActions />}
    >
      <section className="admin-panel">
        <div className="admin-section-heading">
          <h2>Categories and fund types</h2>
        </div>
        <p className="admin-helper-text">
          Active values appear in the Add Case form. Values already used by cases
          can be renamed or deactivated; deletion is available only when no case
          uses the value.
        </p>
      </section>

      {loadingLists || casesLoading ? (
        <p className="soft-status">Loading list settings...</p>
      ) : null}
      {casesError ? <p className="admin-error">{casesError}</p> : null}
      {error ? <p className="admin-error">{error}</p> : null}
      {notice ? <p className="admin-success">{notice}</p> : null}

      <LookupListPanel
        addValue={newCategory}
        disabled={isBusy}
        drafts={drafts}
        onAddValueChange={setNewCategory}
        onCreate={(event) => {
          event.preventDefault();
          void createOption("support_categories", newCategory);
        }}
        onDelete={(option) =>
          void deleteOption(
            "support_categories",
            option,
            usageCountFor(categoryUsage, option),
          )
        }
        onDraftChange={(option, draft) =>
          updateDraft("support_categories", option, draft)
        }
        onSave={(option) =>
          void saveOption(
            "support_categories",
            option,
            usageCountFor(categoryUsage, option),
          )
        }
        onToggleActive={(option) =>
          void toggleActive(
            "support_categories",
            option,
            usageCountFor(categoryUsage, option),
          )
        }
        options={categories}
        table="support_categories"
        title="Categories"
        usageByName={categoryUsage}
      />

      <LookupListPanel
        addValue={newFundType}
        disabled={isBusy}
        drafts={drafts}
        onAddValueChange={setNewFundType}
        onCreate={(event) => {
          event.preventDefault();
          void createOption("fund_types", newFundType);
        }}
        onDelete={(option) =>
          void deleteOption("fund_types", option, usageCountFor(fundTypeUsage, option))
        }
        onDraftChange={(option, draft) => updateDraft("fund_types", option, draft)}
        onSave={(option) =>
          void saveOption("fund_types", option, usageCountFor(fundTypeUsage, option))
        }
        onToggleActive={(option) =>
          void toggleActive(
            "fund_types",
            option,
            usageCountFor(fundTypeUsage, option),
          )
        }
        options={fundTypes}
        table="fund_types"
        title="Fund types"
        usageByName={fundTypeUsage}
      />
    </AdminShell>
  );
};

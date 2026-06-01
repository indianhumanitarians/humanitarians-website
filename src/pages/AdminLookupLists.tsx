import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { AdminShell } from "../components/admin/AdminShell";
import { AdminTopActions } from "../components/admin/AdminTopActions";
import { useAdminAuth } from "../hooks/useAdminAuth";
import { useAdminCases } from "../hooks/useAdminCases";
import {
  PUBLIC_SITE_SETTING_DEFAULTS,
  PUBLIC_SITE_SETTING_DEFINITIONS,
  publicSiteSettingDefaultRows,
  type PublicSiteSettingDefinition,
} from "../data/publicSiteSettings";
import {
  createFundType,
  createSupportCategory,
  deleteLookupOption,
  fetchAdminLookupLists,
  updateLookupOption,
  type CaseLookupTable,
} from "../services/adminCases";
import {
  emptyPublicSiteSettingsRecord,
  deleteSiteSettingImage,
  fetchAdminSiteSettings,
  publicSiteSettingsRecord,
  uploadSiteSettingImage,
  updatePublicSiteSettings,
  type PublicSiteSettingsRecord,
  type SiteSettingImageBucket,
} from "../services/siteSettings";
import type { CaseLookupOption } from "../types/admin";

type LookupDraft = Pick<CaseLookupOption, "name" | "is_active">;
type PublicSiteSettingGroup = PublicSiteSettingDefinition["group"];
type PaymentSettingSubgroup = NonNullable<PublicSiteSettingDefinition["subgroup"]>;
type SiteSettingImageKind = "whatsappNewMembers" | "sadaqah" | "zakat";
const publicSiteSettingGroups: PublicSiteSettingGroup[] = [
  "Impact",
  "Contact",
  "Payment",
];
const paymentSettingSubgroups: PaymentSettingSubgroup[] = [
  "Sadaqah",
  "Zakat",
  "Bank",
];

const siteSettingImageConfig: Record<
  SiteSettingImageKind,
  {
    bucket: SiteSettingImageBucket;
    defaultImage: string;
    folder: string;
    imageKey: keyof PublicSiteSettingsRecord;
    label: string;
    storageKey: keyof PublicSiteSettingsRecord;
  }
> = {
  whatsappNewMembers: {
    bucket: "site-setting-images",
    defaultImage: PUBLIC_SITE_SETTING_DEFAULTS.whatsapp_new_members_qr_image,
    folder: "whatsapp/new-members",
    imageKey: "whatsapp_new_members_qr_image",
    label: "New Members WhatsApp QR",
    storageKey: "whatsapp_new_members_qr_storage_path",
  },
  sadaqah: {
    bucket: "payment-qr-images",
    defaultImage: PUBLIC_SITE_SETTING_DEFAULTS.upi_sadaqah_qr_image,
    folder: "upi/sadaqah",
    imageKey: "upi_sadaqah_qr_image",
    label: "Sadaqah QR",
    storageKey: "upi_sadaqah_qr_storage_path",
  },
  zakat: {
    bucket: "payment-qr-images",
    defaultImage: PUBLIC_SITE_SETTING_DEFAULTS.upi_zakat_qr_image,
    folder: "upi/zakat",
    imageKey: "upi_zakat_qr_image",
    label: "Zakat QR",
    storageKey: "upi_zakat_qr_storage_path",
  },
};

const siteImageKindBySettingKey = new Map<keyof PublicSiteSettingsRecord, SiteSettingImageKind>([
  ["whatsapp_new_members_qr_image", "whatsappNewMembers"],
  ["upi_sadaqah_qr_image", "sadaqah"],
  ["upi_zakat_qr_image", "zakat"],
]);

const defaultValuesForMissingSettings = (
  settings: Array<{ setting_key: string; setting_value?: string | null }>,
): Partial<PublicSiteSettingsRecord> => {
  const currentSettings = new Map(
    settings.map((setting) => [
      setting.setting_key,
      setting.setting_value?.trim() ?? "",
    ]),
  );

  return Object.fromEntries(
    publicSiteSettingDefaultRows
      .filter((row) => {
        const currentValue = currentSettings.get(row.setting_key);
        return (
          currentValue === undefined ||
          (currentValue === "" && row.setting_value.trim() !== "")
        );
      })
      .map((row) => [row.setting_key, row.setting_value]),
  ) as Partial<PublicSiteSettingsRecord>;
};

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
  const [siteSettingDrafts, setSiteSettingDrafts] =
    useState<PublicSiteSettingsRecord>(() => emptyPublicSiteSettingsRecord());
  const [savedSiteSettingDrafts, setSavedSiteSettingDrafts] =
    useState<PublicSiteSettingsRecord>(() => emptyPublicSiteSettingsRecord());
  const [openHelperKey, setOpenHelperKey] = useState<string | undefined>();
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
      setSiteSettingDrafts(emptyPublicSiteSettingsRecord());
      setSavedSiteSettingDrafts(emptyPublicSiteSettingsRecord());
      setLoadingLists(false);
      return;
    }

    setLoadingLists(true);
    setError(undefined);

    try {
      const [lists, siteSettings] = await Promise.all([
        fetchAdminLookupLists(session.accessToken),
        fetchAdminSiteSettings(session.accessToken).catch(() => []),
      ]);
      const missingSettingDefaults = defaultValuesForMissingSettings(siteSettings);
      const seededSettings =
        Object.keys(missingSettingDefaults).length > 0
          ? await updatePublicSiteSettings(session.accessToken, missingSettingDefaults)
          : [];
      const nextSiteSettings = publicSiteSettingsRecord([
        ...siteSettings,
        ...seededSettings,
      ]);
      setCategories(lists.categories);
      setFundTypes(lists.fundTypes);
      setSiteSettingDrafts(nextSiteSettings);
      setSavedSiteSettingDrafts(nextSiteSettings);
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

  const savePublicSiteSettings = async (
    event: FormEvent<HTMLFormElement>,
    group: PublicSiteSettingGroup,
  ) => {
    event.preventDefault();
    if (!session) {
      setError("Admin session is not available.");
      return;
    }

    const groupDefinitions = PUBLIC_SITE_SETTING_DEFINITIONS.filter(
      (definition) => definition.group === group,
    );
    const hasEmptyValue = groupDefinitions.some(
      (definition) =>
        !siteImageKindBySettingKey.has(definition.key) &&
        !siteSettingDrafts[definition.key].trim(),
    );
    if (hasEmptyValue) {
      setError(`All ${group.toLowerCase()} setting values are required.`);
      return;
    }

    await withAction(`site_settings:${group}`, async () => {
      const updatedSettings = await updatePublicSiteSettings(
        session.accessToken,
        Object.fromEntries(
          groupDefinitions.map((definition) => [
            definition.key,
            siteSettingDrafts[definition.key],
          ]),
        ),
      );
      const updatedValues = publicSiteSettingsRecord(updatedSettings);
      setSiteSettingDrafts((current) => ({
        ...current,
        ...Object.fromEntries(
          groupDefinitions.map((definition) => [
            definition.key,
            updatedValues[definition.key] || siteSettingDrafts[definition.key],
          ]),
        ),
      }));
      setSavedSiteSettingDrafts((current) => ({
        ...current,
        ...Object.fromEntries(
          groupDefinitions.map((definition) => [
            definition.key,
            updatedValues[definition.key] || siteSettingDrafts[definition.key],
          ]),
        ),
      }));
      setNotice(`${group} settings have been updated.`);
    });
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
  const siteSettingDefinitionsByGroup = useMemo(
    () =>
      Object.fromEntries(
        publicSiteSettingGroups.map((group) => [
          group,
          PUBLIC_SITE_SETTING_DEFINITIONS.filter(
            (definition) => definition.group === group,
          ),
        ]),
      ) as Record<PublicSiteSettingGroup, PublicSiteSettingDefinition[]>,
    [],
  );
  const hasSiteSettingGroupChanges = (group: PublicSiteSettingGroup): boolean =>
    siteSettingDefinitionsByGroup[group].some(
      (definition) =>
        siteSettingDrafts[definition.key].trim() !==
        savedSiteSettingDrafts[definition.key].trim(),
    );
  const updateSiteSettingDraft = (
    key: keyof PublicSiteSettingsRecord,
    value: string,
  ) => {
    setSiteSettingDrafts((current) => ({
      ...current,
      [key]: value,
    }));
  };
  const applySavedSiteSettings = (
    updates: Partial<PublicSiteSettingsRecord>,
  ) => {
    setSiteSettingDrafts((current) => ({
      ...current,
      ...updates,
    }));
    setSavedSiteSettingDrafts((current) => ({
      ...current,
      ...updates,
    }));
  };
  const resetSiteSettingDraft = (key: keyof PublicSiteSettingsRecord) => {
    setSiteSettingDrafts((current) => ({
      ...current,
      [key]: PUBLIC_SITE_SETTING_DEFAULTS[key],
    }));
  };
  const handleSettingImageUpload = async (
    kind: SiteSettingImageKind,
    file: File | null,
  ) => {
    if (!session || !file) {
      return;
    }

    const config = siteSettingImageConfig[kind];
    const previousStoragePath = siteSettingDrafts[config.storageKey].trim();

    await withAction(`setting_image:${kind}`, async () => {
      const uploadedImage = await uploadSiteSettingImage(
        session.accessToken,
        config.bucket,
        config.folder,
        file,
      );

      try {
        const updatedSettings = await updatePublicSiteSettings(session.accessToken, {
          [config.imageKey]: uploadedImage.public_url,
          [config.storageKey]: uploadedImage.storage_path,
        });
        const updatedValues = publicSiteSettingsRecord(updatedSettings);
        applySavedSiteSettings({
          [config.imageKey]:
            updatedValues[config.imageKey] || uploadedImage.public_url,
          [config.storageKey]:
            updatedValues[config.storageKey] || uploadedImage.storage_path,
        });
      } catch (uploadSaveError) {
        await deleteSiteSettingImage(
          session.accessToken,
          config.bucket,
          uploadedImage.storage_path,
        );
        throw uploadSaveError;
      }

      if (previousStoragePath && previousStoragePath !== uploadedImage.storage_path) {
        await deleteSiteSettingImage(
          session.accessToken,
          config.bucket,
          previousStoragePath,
        );
      }

      setNotice(`${config.label} has been replaced.`);
    });
  };
  const resetSettingImageToDefault = async (kind: SiteSettingImageKind) => {
    if (!session) {
      setError("Admin session is not available.");
      return;
    }

    const config = siteSettingImageConfig[kind];
    const previousStoragePath = siteSettingDrafts[config.storageKey].trim();

    await withAction(`setting_image:${kind}`, async () => {
      const updatedSettings = await updatePublicSiteSettings(session.accessToken, {
        [config.imageKey]: config.defaultImage,
        [config.storageKey]: "",
      });
      const updatedValues = publicSiteSettingsRecord(updatedSettings);

      if (previousStoragePath) {
        await deleteSiteSettingImage(
          session.accessToken,
          config.bucket,
          previousStoragePath,
        );
      }

      applySavedSiteSettings({
        [config.imageKey]: updatedValues[config.imageKey] || config.defaultImage,
        [config.storageKey]: updatedValues[config.storageKey] || "",
      });
      setNotice(`${config.label} has been reset to the default image.`);
    });
  };
  const settingImageField = (
    kind: SiteSettingImageKind,
    definition: PublicSiteSettingDefinition,
  ) => {
    const config = siteSettingImageConfig[kind];
    const currentImage = siteSettingDrafts[config.imageKey] || config.defaultImage;
    const hasUploadedQr = Boolean(siteSettingDrafts[config.storageKey].trim());
    const busy = isBusy || actionKey === `setting_image:${kind}`;

    return (
      <div className="admin-qr-upload-field">
        <span className="admin-setting-label">
          {config.label}
          {settingHelper(definition)}
        </span>
        <img
          src={currentImage}
          alt={`${config.label} preview`}
          className="admin-qr-preview"
        />
        <div className="admin-qr-actions">
          <label className={`admin-small-button ${busy ? "disabled" : ""}`}>
            Upload / replace
            <input
              type="file"
              accept="image/*"
              disabled={busy}
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                event.target.value = "";
                void handleSettingImageUpload(kind, file);
              }}
            />
          </label>
          <button
            className="admin-small-button"
            disabled={busy || !hasUploadedQr}
            type="button"
            onClick={() => void resetSettingImageToDefault(kind)}
          >
            Reset to default
          </button>
        </div>
        <span className="admin-qr-status">
          {hasUploadedQr ? "Using uploaded QR from Supabase Storage." : "Using default site image."}
        </span>
      </div>
    );
  };
  const siteSettingField = (definition: PublicSiteSettingDefinition) => {
    const imageKind = siteImageKindBySettingKey.get(definition.key);

    if (imageKind) {
      return settingImageField(imageKind, definition);
    }

    const isDefaultValue =
      siteSettingDrafts[definition.key].trim() ===
      PUBLIC_SITE_SETTING_DEFAULTS[definition.key].trim();

    return (
      <label>
        <span className="admin-setting-label">
          {definition.label}
          {settingHelper(definition)}
        </span>
        <span className="admin-setting-input-row">
          <input
            type={definition.inputType ?? "text"}
            value={siteSettingDrafts[definition.key]}
            onChange={(event) =>
              updateSiteSettingDraft(definition.key, event.target.value)
            }
            required
          />
          <button
            type="button"
            className="admin-small-button"
            disabled={isBusy || isDefaultValue}
            onClick={() => resetSiteSettingDraft(definition.key)}
          >
            Reset
          </button>
        </span>
      </label>
    );
  };
  const settingHelper = (definition: PublicSiteSettingDefinition) => {
    const isOpen = openHelperKey === definition.key;
    const helperId = `setting-helper-${definition.key}`;

    return (
      <>
        <button
          type="button"
          className="admin-info-icon"
          aria-label={`Show help for ${definition.label}`}
          aria-expanded={isOpen}
          aria-controls={helperId}
          onClick={() =>
            setOpenHelperKey((current) =>
              current === definition.key ? undefined : definition.key,
            )
          }
        >
          i
        </button>
        {isOpen ? (
          <span className="admin-setting-helper" id={helperId}>
            {definition.helperText}
          </span>
        ) : null}
      </>
    );
  };

  return (
    <AdminShell
      title="Settings & lists"
      eyebrow="Admin setup"
      actions={<AdminTopActions />}
    >
      <section className="admin-panel">
        <div className="admin-section-heading">
          <h2>Public settings</h2>
        </div>
        <p className="admin-helper-text">
          These public values appear across the homepage, reports, donation,
          contact, mentorship, footer, and about pages.
        </p>
      </section>

      {loadingLists || casesLoading ? (
        <p className="soft-status">Loading list settings...</p>
      ) : null}
      {casesError ? <p className="admin-error">{casesError}</p> : null}
      {error ? <p className="admin-error">{error}</p> : null}
      {notice ? <p className="admin-success">{notice}</p> : null}

      {publicSiteSettingGroups.map((group) => (
        <section className="admin-panel" key={group}>
          <form
            className="admin-site-settings-form"
            onSubmit={(event) => void savePublicSiteSettings(event, group)}
          >
            <div className="admin-section-heading admin-section-heading-row">
              <h2>{group} settings</h2>
              <button
                className="admin-small-button"
                disabled={isBusy || !hasSiteSettingGroupChanges(group)}
                type="submit"
              >
                Save {group.toLowerCase()}
              </button>
            </div>
            <fieldset>
              {group === "Payment" ? (
                <div className="admin-payment-settings-grid">
                  {paymentSettingSubgroups.map((subgroup) => (
                    <section className="admin-payment-subsection" key={subgroup}>
                      <h3>{subgroup}</h3>
                      <div className="admin-site-settings-grid">
                        {siteSettingDefinitionsByGroup.Payment.filter(
                          (definition) => definition.subgroup === subgroup,
                        ).map((definition) => (
                          <div key={definition.key}>
                            {siteSettingField(definition)}
                          </div>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              ) : (
                <div className="admin-site-settings-grid">
                  {siteSettingDefinitionsByGroup[group].map((definition) => (
                    <div
                      className={
                        siteImageKindBySettingKey.has(definition.key)
                          ? "admin-setting-image-cell"
                          : undefined
                      }
                      key={definition.key}
                    >
                      {siteSettingField(definition)}
                    </div>
                  ))}
                </div>
              )}
            </fieldset>
          </form>
        </section>
      ))}

      <section className="admin-panel">
        <div className="admin-section-heading">
          <h2>Case form lists</h2>
        </div>
        <p className="admin-helper-text">
          Categories and fund types already used by cases can be renamed or
          deactivated; deletion is available only when no case uses the value.
        </p>
      </section>

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

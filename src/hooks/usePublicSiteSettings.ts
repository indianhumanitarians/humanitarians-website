import { useEffect, useMemo, useState } from "react";
import { buildContact } from "../data/contact";
import {
  fetchPublicSiteSettings,
  publicSiteSettingsRecord,
  type PublicSiteSettingsRecord,
} from "../services/siteSettings";

export const usePublicSiteSettings = () => {
  const [settings, setSettings] = useState<PublicSiteSettingsRecord | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    let isMounted = true;

    const loadSettings = async () => {
      try {
        const rows = await fetchPublicSiteSettings();
        if (isMounted) {
          setSettings(publicSiteSettingsRecord(rows));
          setError(undefined);
        }
      } catch (settingsError) {
        if (isMounted) {
          setSettings(null);
          setError(
            settingsError instanceof Error
              ? settingsError.message
              : "Public site settings could not be loaded.",
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadSettings();

    return () => {
      isMounted = false;
    };
  }, []);

  const contact = useMemo(
    () => (settings ? buildContact(settings) : null),
    [settings],
  );

  return {
    contact,
    error,
    loading,
    settings,
  };
};

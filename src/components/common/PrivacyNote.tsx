interface PrivacyNoteProps {
  children: string;
}

export const PrivacyNote = ({ children }: PrivacyNoteProps) => (
  <aside className="privacy-note" aria-label="Privacy note">
    <span className="shield" aria-hidden="true">
      ◇
    </span>
    <p>{children}</p>
  </aside>
);

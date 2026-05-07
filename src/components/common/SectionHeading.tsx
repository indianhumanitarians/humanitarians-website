interface SectionHeadingProps {
  title: string;
  content?: string;
}

export const SectionHeading = ({
  title,
  content,
}: SectionHeadingProps) => (
  <div className="section-heading">
    <h2>
      <span className="section-heading-main">{title}</span>
      {content ? <span className="section-heading-support">{content}</span> : null}
    </h2>
  </div>
);

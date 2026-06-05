interface DownloadDashboardPdfProps {
  disabled?: boolean;
}

export const DownloadDashboardPdf = ({ disabled }: DownloadDashboardPdfProps) => {
  const handleClick = () => {
    window.print();
  };

  return (
    <button
      id="btn-download-dashboard-pdf"
      type="button"
      className="button button-secondary pdf-download-btn"
      disabled={disabled}
      onClick={handleClick}
      aria-label="Download Dashboard Stats as PDF"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 20 20"
        width={15}
        height={15}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M10 3v9M6 8l4 4 4-4" />
        <path d="M3 14v1a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-1" />
      </svg>
      Download Dashboard Stats
    </button>
  );
};

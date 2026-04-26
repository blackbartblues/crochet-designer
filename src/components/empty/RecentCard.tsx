interface RecentCardProps {
  name: string;
  meta: string;
  /** Raw CSS value applied to the thumb's background-image (or background). */
  thumbCss: string;
  onClick?: () => void;
}

export function RecentCard({ name, meta, thumbCss, onClick }: RecentCardProps) {
  return (
    <button className="recent-card" onClick={onClick}>
      <div
        className="recent-thumb"
        style={{
          background: thumbCss,
        }}
      />
      <div className="recent-name">{name}</div>
      <div className="recent-meta">{meta}</div>
    </button>
  );
}

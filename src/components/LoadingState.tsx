type LoadingStateProps = {
  label: string;
};

export function LoadingState({ label }: LoadingStateProps) {
  return (
    <div className="loadingState" aria-live="polite">
      <div className="loadingSpinner" />
      <span>{label}</span>
    </div>
  );
}

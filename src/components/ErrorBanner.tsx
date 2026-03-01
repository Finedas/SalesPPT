type ErrorBannerProps = {
  message: string | null;
};

export function ErrorBanner({ message }: ErrorBannerProps) {
  if (!message) {
    return null;
  }

  return (
    <div className="errorBanner" role="alert">
      <strong>Request failed.</strong>
      <span>{message}</span>
    </div>
  );
}

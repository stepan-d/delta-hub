import { Alert } from "@/components/ui/alert";
import type { ErrorState } from "@/lib/client-error";

type ErrorNoticeProps = {
  error: ErrorState | null;
};

type SuccessNoticeProps = {
  message?: string | null;
};

export function ErrorNotice({ error }: ErrorNoticeProps) {
  if (!error) return null;

  return (
    <Alert variant="error">
      <p className="font-semibold">{error.message}</p>
      {error.details.length > 0 ? (
        <ul className="mt-2 space-y-1 text-rose-700">
          {error.details.map((detail) => (
            <li key={detail}>{detail}</li>
          ))}
        </ul>
      ) : null}
    </Alert>
  );
}

export function SuccessNotice({ message }: SuccessNoticeProps) {
  if (!message) return null;
  return <Alert variant="success">{message}</Alert>;
}

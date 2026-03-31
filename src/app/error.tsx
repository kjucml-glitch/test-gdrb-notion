"use client";

import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <span className="text-6xl mb-4">⚠️</span>
      <h1 className="text-2xl font-bold mb-2">문제가 발생했습니다</h1>
      <p className="text-muted-foreground mb-6">
        잠시 후 다시 시도해주세요.
      </p>
      <Button onClick={reset}>다시 시도</Button>
    </div>
  );
}

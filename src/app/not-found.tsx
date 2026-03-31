import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <span className="text-6xl mb-4">🔍</span>
      <h1 className="text-2xl font-bold mb-2">페이지를 찾을 수 없습니다</h1>
      <p className="text-muted-foreground mb-6">
        요청하신 페이지가 존재하지 않거나 삭제되었습니다.
      </p>
      <Link
        href="/"
        className="text-sm underline underline-offset-4 hover:text-primary"
      >
        홈으로 돌아가기
      </Link>
    </div>
  );
}

export default function AdminSettingsPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 md:px-12 py-8">
      <h1 className="text-2xl font-bold mb-6">설정</h1>
      <div className="space-y-6">
        <div className="p-6 border rounded-lg bg-card">
          <h2 className="text-lg font-semibold mb-2">블로그 설정</h2>
          <p className="text-sm text-muted-foreground">
            블로그 이름, 설명, 도메인 등의 설정은 환경 변수(.env.local)에서 관리합니다.
          </p>
        </div>
        <div className="p-6 border rounded-lg bg-card">
          <h2 className="text-lg font-semibold mb-2">Firebase 설정</h2>
          <p className="text-sm text-muted-foreground">
            .env.local.example 파일을 참고하여 Firebase 설정을 완료하세요.
          </p>
        </div>
      </div>
    </div>
  );
}

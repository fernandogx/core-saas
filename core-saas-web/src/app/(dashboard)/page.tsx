export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral da plataforma Core SaaS</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-card p-6">
          <p className="text-sm text-muted-foreground">MRR</p>
          <p className="text-2xl font-bold">R$ 0,00</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <p className="text-sm text-muted-foreground">Assinaturas Ativas</p>
          <p className="text-2xl font-bold">0</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <p className="text-sm text-muted-foreground">Applications</p>
          <p className="text-2xl font-bold">0</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <p className="text-sm text-muted-foreground">Inadimplência</p>
          <p className="text-2xl font-bold">0%</p>
        </div>
      </div>
    </div>
  );
}

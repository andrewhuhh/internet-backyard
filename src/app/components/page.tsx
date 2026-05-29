import Link from "next/link";
import { AlertCircle, Banknote, CheckCircle2, Loader2, Plus } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { SendTransferDialog } from "@/components/settlement/transfer-dialog";

export default function ComponentsPage() {
  return (
    <main className="min-h-screen bg-background px-6 py-8 text-foreground sm:px-10">
      <div className="mx-auto max-w-6xl">
        <Link className="font-mono text-sm text-muted-foreground" href="/">
          / home
        </Link>

        <header className="mt-10 border-b border-border pb-8">
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">
            Design inventory
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight">
            Components in use
          </h1>
        </header>

        <section className="grid gap-5 py-8 lg:grid-cols-[0.9fr_1.1fr]">
          <InventoryCard title="Buttons">
            <div className="flex flex-wrap gap-3">
              <Button>Primary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Destructive</Button>
              <Button size="icon">
                <Plus className="size-4" />
              </Button>
            </div>
          </InventoryCard>

          <InventoryCard title="Form controls">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="mb-2 block">Recipient</Label>
                <Select defaultValue="orchid">
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="orchid">Orchid Agents</SelectItem>
                    <SelectItem value="nova">Nova Foundry</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-2 block">Amount</Label>
                <Input defaultValue="1843" />
              </div>
              <div className="sm:col-span-2">
                <Label className="mb-2 block">Reference</Label>
                <Textarea defaultValue="Settle verified B200 eval swarm usage." />
              </div>
            </div>
          </InventoryCard>

          <InventoryCard title="Badges and status">
            <div className="flex flex-wrap gap-3">
              <Badge>verified</Badge>
              <Badge variant="secondary">pending review</Badge>
              <Badge variant="outline">96% confidence</Badge>
              <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="size-4 text-primary" />
                ready
              </span>
              <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                <AlertCircle className="size-4 text-amber-300" />
                missing
              </span>
            </div>
          </InventoryCard>

          <InventoryCard title="Alerts">
            <Alert className="border-amber-300/35 bg-amber-300/10">
              <AlertCircle className="size-4" />
              <AlertDescription>Add a funding source to continue.</AlertDescription>
            </Alert>
          </InventoryCard>

          <InventoryCard title="Cards">
            <Card className="rounded-lg border-border bg-background/60">
              <CardHeader>
                <CardTitle>Operating balance</CardTitle>
                <CardDescription>$18,420 available</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Funding source summary used outside the production dialog.
              </CardContent>
            </Card>
          </InventoryCard>

          <InventoryCard title="Tabs, separators, loading">
            <Tabs defaultValue="compose">
              <TabsList>
                <TabsTrigger value="compose">Compose</TabsTrigger>
                <TabsTrigger value="review">Review</TabsTrigger>
              </TabsList>
              <TabsContent value="compose" className="mt-4">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  Validating transfer intent
                </div>
              </TabsContent>
              <TabsContent value="review" className="mt-4">
                <Separator />
                <div className="mt-4 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-64" />
                </div>
              </TabsContent>
            </Tabs>
          </InventoryCard>

          <InventoryCard title="Transfer dialog trigger">
            <div className="flex items-center gap-4">
              <SendTransferDialog />
              <span className="inline-flex items-center gap-2 font-mono text-xs text-muted-foreground">
                <Banknote className="size-4" />
                production component
              </span>
            </div>
          </InventoryCard>
        </section>
      </div>
    </main>
  );
}

function InventoryCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <h2 className="mb-4 text-base font-medium">{title}</h2>
      {children}
    </section>
  );
}

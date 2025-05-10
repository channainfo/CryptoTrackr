import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import {
  Users,
  Coins,
  CreditCard,
  LineChart,
  BookOpen,
  Bell,
  Award,
  Settings,
  BarChart2,
  PlusCircle,
  Clock,
  Wallet,
} from 'lucide-react';

interface AdminCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  count?: number;
  href: string;
  actionText?: string;
}

function AdminCard({ title, description, icon, count, href, actionText = 'Manage' }: AdminCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center gap-4 pb-2">
        <div className="rounded-full p-2 bg-primary/10 text-primary">
          {icon}
        </div>
        <div>
          <CardTitle className="text-xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {count !== undefined && (
          <div className="text-3xl font-bold">{count.toLocaleString()}</div>
        )}
      </CardContent>
      <CardFooter className="bg-muted/50 pt-3">
        <Link href={href}>
          <Button className="w-full gap-1">
            <PlusCircle className="h-4 w-4" />
            {actionText}
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}

export default function AdminDashboard() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Manage your cryptocurrency portfolio application from this central dashboard.
        </p>
      </header>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AdminCard
            title="Users"
            description="Manage user accounts"
            icon={<Users className="h-6 w-6" />}
            count={152}
            href="/admin/users-management"
          />
          
          <AdminCard
            title="Tokens"
            description="Manage cryptocurrency tokens"
            icon={<Coins className="h-6 w-6" />}
            count={874}
            href="/admin/token-management"
          />
          
          <AdminCard
            title="Wallets"
            description="Manage user wallets"
            icon={<Wallet className="h-6 w-6" />}
            count={243}
            href="/admin/wallets"
          />
          
          <AdminCard
            title="Portfolios"
            description="Manage user portfolios"
            icon={<BarChart2 className="h-6 w-6" />}
            count={189}
            href="/admin/portfolios"
          />
          
          <AdminCard
            title="Transactions"
            description="Manage transaction records"
            icon={<CreditCard className="h-6 w-6" />}
            count={3527}
            href="/admin/transactions"
          />
          
          <AdminCard
            title="Market Data"
            description="Manage token market data"
            icon={<LineChart className="h-6 w-6" />}
            count={874}
            href="/admin/market-data"
          />
          
          <AdminCard
            title="Historical Data"
            description="Manage historical values"
            icon={<Clock className="h-6 w-6" />}
            count={12458}
            href="/admin/historical-data"
          />
          
          <AdminCard
            title="Learning Content"
            description="Manage educational content"
            icon={<BookOpen className="h-6 w-6" />}
            count={48}
            href="/admin/learning-modules"
          />
          
          <AdminCard
            title="Alerts"
            description="Manage price alerts"
            icon={<Bell className="h-6 w-6" />}
            count={126}
            href="/admin/alerts"
          />
          
          <AdminCard
            title="Achievements"
            description="Manage user achievements"
            icon={<Award className="h-6 w-6" />}
            count={32}
            href="/admin/achievements"
          />
          
          <AdminCard
            title="Settings"
            description="Configure system settings"
            icon={<Settings className="h-6 w-6" />}
            href="/admin/settings"
            actionText="Configure"
          />
        </section>
      </div>
  );
}
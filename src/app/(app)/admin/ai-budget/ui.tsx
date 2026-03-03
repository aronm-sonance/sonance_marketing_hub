'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';

interface UsageStats {
  totalSpend30Days: number;
  totalSpendThisMonth: number;
  spendByTier: { tier: string; cost: number; count: number }[];
  spendByTaskType: { task_type: string; cost: number; count: number }[];
  spendByUser: { user_email: string; cost: number; count: number }[];
  recentCalls: {
    id: string;
    created_at: string;
    user_email: string;
    task_type: string;
    model: string;
    tier: string;
    input_tokens: number;
    output_tokens: number;
    estimated_cost_usd: number;
    duration_ms: number;
  }[];
}

export default function AiBudgetDashboard() {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      setLoading(true);
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Fetch all logs from the last 30 days with user emails
      const { data: logs, error: logsError } = await supabase
        .from('ai_usage_logs')
        .select(`
          *,
          profiles!ai_usage_logs_user_id_fkey(email)
        `)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false });

      if (logsError) throw logsError;

      // Calculate stats
      const logsThisMonth = (logs || []).filter(
        (log) => new Date(log.created_at) >= firstDayOfMonth
      );

      const totalSpend30Days = (logs || []).reduce(
        (sum, log) => sum + parseFloat(log.estimated_cost_usd),
        0
      );

      const totalSpendThisMonth = logsThisMonth.reduce(
        (sum, log) => sum + parseFloat(log.estimated_cost_usd),
        0
      );

      // Spend by tier
      const tierMap = new Map<string, { cost: number; count: number }>();
      (logs || []).forEach((log) => {
        const existing = tierMap.get(log.tier) || { cost: 0, count: 0 };
        tierMap.set(log.tier, {
          cost: existing.cost + parseFloat(log.estimated_cost_usd),
          count: existing.count + 1,
        });
      });
      const spendByTier = Array.from(tierMap.entries())
        .map(([tier, data]) => ({ tier, ...data }))
        .sort((a, b) => b.cost - a.cost);

      // Spend by task type
      const taskMap = new Map<string, { cost: number; count: number }>();
      (logs || []).forEach((log) => {
        const existing = taskMap.get(log.task_type) || { cost: 0, count: 0 };
        taskMap.set(log.task_type, {
          cost: existing.cost + parseFloat(log.estimated_cost_usd),
          count: existing.count + 1,
        });
      });
      const spendByTaskType = Array.from(taskMap.entries())
        .map(([task_type, data]) => ({ task_type, ...data }))
        .sort((a, b) => b.cost - a.cost);

      // Spend by user
      const userMap = new Map<string, { cost: number; count: number }>();
      (logs || []).forEach((log) => {
        const email = (log.profiles as any)?.email || 'Unknown';
        const existing = userMap.get(email) || { cost: 0, count: 0 };
        userMap.set(email, {
          cost: existing.cost + parseFloat(log.estimated_cost_usd),
          count: existing.count + 1,
        });
      });
      const spendByUser = Array.from(userMap.entries())
        .map(([user_email, data]) => ({ user_email, ...data }))
        .sort((a, b) => b.cost - a.cost);

      // Recent calls (top 50)
      const recentCalls = (logs || []).slice(0, 50).map((log) => ({
        id: log.id,
        created_at: log.created_at,
        user_email: (log.profiles as any)?.email || 'Unknown',
        task_type: log.task_type,
        model: log.model,
        tier: log.tier,
        input_tokens: log.input_tokens,
        output_tokens: log.output_tokens,
        estimated_cost_usd: parseFloat(log.estimated_cost_usd),
        duration_ms: log.duration_ms,
      }));

      setStats({
        totalSpend30Days,
        totalSpendThisMonth,
        spendByTier,
        spendByTaskType,
        spendByUser,
        recentCalls,
      });
    } catch (err: any) {
      console.error('Error loading AI budget stats:', err);
      setError(err.message || 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error: {error}</p>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const formatCost = (cost: number) => `$${cost.toFixed(4)}`;
  const formatDate = (date: string) => new Date(date).toLocaleString();

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">AI Budget Tracking</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Last 30 Days</h3>
          <p className="text-3xl font-bold text-gray-900">
            {formatCost(stats.totalSpend30Days)}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {stats.recentCalls.length} total calls
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">This Month</h3>
          <p className="text-3xl font-bold text-gray-900">
            {formatCost(stats.totalSpendThisMonth)}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Breakdown Sections */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Spend by Tier */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Spend by Tier</h3>
          <div className="space-y-3">
            {stats.spendByTier.map((item) => (
              <div key={item.tier} className="flex justify-between items-center">
                <div>
                  <span className="font-medium capitalize">{item.tier}</span>
                  <span className="text-sm text-gray-500 ml-2">({item.count})</span>
                </div>
                <span className="font-mono text-sm">{formatCost(item.cost)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Spend by Task Type */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Spend by Task Type</h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {stats.spendByTaskType.map((item) => (
              <div key={item.task_type} className="flex justify-between items-center">
                <div>
                  <span className="text-sm">{item.task_type}</span>
                  <span className="text-xs text-gray-500 ml-2">({item.count})</span>
                </div>
                <span className="font-mono text-sm">{formatCost(item.cost)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Spend by User */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Spend by User</h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {stats.spendByUser.map((item) => (
              <div key={item.user_email} className="flex justify-between items-center">
                <div>
                  <span className="text-sm">{item.user_email}</span>
                  <span className="text-xs text-gray-500 ml-2">({item.count})</span>
                </div>
                <span className="font-mono text-sm">{formatCost(item.cost)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Calls Table */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Recent AI Calls</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Time
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  User
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Task Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Model
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Tier
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Tokens
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Duration
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Cost
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stats.recentCalls.map((call) => (
                <tr key={call.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                    {formatDate(call.created_at)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {call.user_email}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {call.task_type}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 font-mono text-xs">
                    {call.model}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        call.tier === 'flash'
                          ? 'bg-green-100 text-green-800'
                          : call.tier === 'pro'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}
                    >
                      {call.tier}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 text-right font-mono">
                    {call.input_tokens + call.output_tokens}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 text-right">
                    {(call.duration_ms / 1000).toFixed(2)}s
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right font-mono">
                    {formatCost(call.estimated_cost_usd)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

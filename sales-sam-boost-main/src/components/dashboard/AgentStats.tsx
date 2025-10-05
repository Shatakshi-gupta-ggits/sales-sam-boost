import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Mail, Phone, Calendar, TrendingUp } from 'lucide-react';

const AgentStats = () => {
  const [stats, setStats] = useState({
    totalLeads: 0,
    emailsSent: 0,
    callsMade: 0,
    meetingsBooked: 0,
    avgScore: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [leadsResult, activitiesResult, meetingsResult] = await Promise.all([
        supabase.from('leads').select('score'),
        supabase.from('outreach_activities').select('activity_type'),
        supabase.from('meetings').select('id').eq('status', 'scheduled'),
      ]);

      const totalLeads = leadsResult.data?.length || 0;
      const avgScore = totalLeads > 0
        ? Math.round(leadsResult.data!.reduce((sum, lead) => sum + (lead.score || 0), 0) / totalLeads)
        : 0;

      const emailsSent = activitiesResult.data?.filter(a => a.activity_type === 'email').length || 0;
      const callsMade = activitiesResult.data?.filter(a => a.activity_type === 'call').length || 0;
      const meetingsBooked = meetingsResult.data?.length || 0;

      setStats({
        totalLeads,
        emailsSent,
        callsMade,
        meetingsBooked,
        avgScore,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const statCards = [
    { icon: Users, label: 'Total Leads', value: stats.totalLeads, color: 'text-blue-500' },
    { icon: Mail, label: 'Emails Sent', value: stats.emailsSent, color: 'text-purple-500' },
    { icon: Phone, label: 'Calls Made', value: stats.callsMade, color: 'text-green-500' },
    { icon: Calendar, label: 'Meetings Booked', value: stats.meetingsBooked, color: 'text-red-500' },
    { icon: TrendingUp, label: 'Avg Lead Score', value: stats.avgScore, color: 'text-yellow-500' },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      {statCards.map((stat) => (
        <Card key={stat.label}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default AgentStats;
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Lead {
  id: string;
  company_name: string;
  contact_name: string | null;
  contact_email: string | null;
  status: string;
  score: number;
  created_at: string;
}

const statusColors: Record<string, string> = {
  new: 'bg-blue-500',
  researching: 'bg-yellow-500',
  contacted: 'bg-purple-500',
  replied: 'bg-green-500',
  meeting_booked: 'bg-emerald-500',
  hot_lead: 'bg-red-500',
};

const LeadsList = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchLeads();

    const channel = supabase
      .channel('leads-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'leads' },
        () => {
          fetchLeads();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchLeads = async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (error: any) {
      toast({
        title: 'Error fetching leads',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Leads Pipeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {leads.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No leads yet. Add your first lead to get started!
            </p>
          ) : (
            leads.map((lead) => (
              <div
                key={lead.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1">
                  <h3 className="font-semibold">{lead.company_name}</h3>
                  {lead.contact_name && (
                    <p className="text-sm text-muted-foreground">{lead.contact_name}</p>
                  )}
                  {lead.contact_email && (
                    <p className="text-xs text-muted-foreground">{lead.contact_email}</p>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm font-medium">Score: {lead.score}</div>
                  </div>
                  <Badge
                    className={`${statusColors[lead.status]} text-white`}
                  >
                    {lead.status.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default LeadsList;
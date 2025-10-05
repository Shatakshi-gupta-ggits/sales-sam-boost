import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, LogOut, Plus } from 'lucide-react';
import LeadsList from '@/components/dashboard/LeadsList';
import AgentStats from '@/components/dashboard/AgentStats';
import UpcomingMeetings from '@/components/dashboard/UpcomingMeetings';
import AddLeadDialog from '@/components/dashboard/AddLeadDialog';

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddLead, setShowAddLead] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        if (!session?.user) {
          navigate('/auth');
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate('/auth');
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({ title: 'Signed out successfully' });
    navigate('/auth');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">LeadGenius AI</h1>
          <div className="flex items-center gap-4">
            <Button onClick={() => setShowAddLead(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Lead
            </Button>
            <Button variant="ghost" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6">
          <AgentStats />
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <LeadsList />
            </div>
            <div>
              <UpcomingMeetings />
            </div>
          </div>
        </div>
      </main>

      <AddLeadDialog open={showAddLead} onOpenChange={setShowAddLead} />
    </div>
  );
};

export default Dashboard;
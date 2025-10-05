import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface Meeting {
  id: string;
  title: string;
  scheduled_at: string;
  duration_minutes: number;
  leads: {
    company_name: string;
  };
}

const UpcomingMeetings = () => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);

  useEffect(() => {
    fetchMeetings();
  }, []);

  const fetchMeetings = async () => {
    try {
      const { data, error } = await supabase
        .from('meetings')
        .select(`
          *,
          leads (company_name)
        `)
        .eq('status', 'scheduled')
        .gte('scheduled_at', new Date().toISOString())
        .order('scheduled_at', { ascending: true })
        .limit(5);

      if (error) throw error;
      setMeetings(data || []);
    } catch (error) {
      console.error('Error fetching meetings:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming Meetings</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {meetings.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              No upcoming meetings
            </p>
          ) : (
            meetings.map((meeting) => (
              <div
                key={meeting.id}
                className="flex flex-col gap-2 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="font-semibold">{meeting.title}</div>
                <div className="text-sm text-muted-foreground">
                  {meeting.leads.company_name}
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(meeting.scheduled_at), 'MMM dd, yyyy')}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {format(new Date(meeting.scheduled_at), 'HH:mm')} ({meeting.duration_minutes}min)
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default UpcomingMeetings;
-- Create leads table
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  website TEXT,
  industry TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'researching', 'contacted', 'replied', 'meeting_booked', 'hot_lead', 'closed_won', 'closed_lost')),
  score INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create lead_research table
CREATE TABLE public.lead_research (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  research_type TEXT NOT NULL,
  findings JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create outreach_activities table
CREATE TABLE public.outreach_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('email', 'call', 'proposal')),
  content TEXT,
  outcome TEXT,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create meetings table
CREATE TABLE public.meetings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show')),
  meeting_link TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create agent_tasks table
CREATE TABLE public.agent_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  agent_type TEXT NOT NULL CHECK (agent_type IN ('scout', 'analyst', 'writer', 'ambassador', 'coordinator')),
  task_description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
  result JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_research ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outreach_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for leads
CREATE POLICY "Users can view their own leads" ON public.leads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own leads" ON public.leads FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own leads" ON public.leads FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own leads" ON public.leads FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for lead_research
CREATE POLICY "Users can view research for their leads" ON public.lead_research FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.leads WHERE leads.id = lead_research.lead_id AND leads.user_id = auth.uid()));
CREATE POLICY "Users can create research for their leads" ON public.lead_research FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.leads WHERE leads.id = lead_research.lead_id AND leads.user_id = auth.uid()));

-- RLS Policies for outreach_activities
CREATE POLICY "Users can view activities for their leads" ON public.outreach_activities FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.leads WHERE leads.id = outreach_activities.lead_id AND leads.user_id = auth.uid()));
CREATE POLICY "Users can create activities for their leads" ON public.outreach_activities FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.leads WHERE leads.id = outreach_activities.lead_id AND leads.user_id = auth.uid()));
CREATE POLICY "Users can update activities for their leads" ON public.outreach_activities FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.leads WHERE leads.id = outreach_activities.lead_id AND leads.user_id = auth.uid()));

-- RLS Policies for meetings
CREATE POLICY "Users can view meetings for their leads" ON public.meetings FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.leads WHERE leads.id = meetings.lead_id AND leads.user_id = auth.uid()));
CREATE POLICY "Users can create meetings for their leads" ON public.meetings FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.leads WHERE leads.id = meetings.lead_id AND leads.user_id = auth.uid()));
CREATE POLICY "Users can update meetings for their leads" ON public.meetings FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.leads WHERE leads.id = meetings.lead_id AND leads.user_id = auth.uid()));

-- RLS Policies for agent_tasks
CREATE POLICY "Users can view tasks for their leads" ON public.agent_tasks FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.leads WHERE leads.id = agent_tasks.lead_id AND leads.user_id = auth.uid()));
CREATE POLICY "Users can create tasks for their leads" ON public.agent_tasks FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.leads WHERE leads.id = agent_tasks.lead_id AND leads.user_id = auth.uid()));
CREATE POLICY "Users can update tasks for their leads" ON public.agent_tasks FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.leads WHERE leads.id = agent_tasks.lead_id AND leads.user_id = auth.uid()));

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_meetings_updated_at BEFORE UPDATE ON public.meetings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
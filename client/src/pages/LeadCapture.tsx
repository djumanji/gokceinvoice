import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, CheckCircle } from "lucide-react";
import { format } from "date-fns";

function useChatbotSession() {
  const [sessionId, setSessionId] = useState<string | null>(() => localStorage.getItem('chatbot:sessionId'));

  const createOrResume = useMutation({
    mutationFn: async (opts: { categorySlug?: string } = {}) => {
      const res = await apiRequest('POST', '/api/chatbot/sessions', {
        sessionId: sessionId ?? undefined,
        categorySlug: opts.categorySlug,
      });
      return res as { sessionId: string; phase: string; resumed: boolean };
    },
    onSuccess: (data) => {
      localStorage.setItem('chatbot:sessionId', data.sessionId);
      setSessionId(data.sessionId);
    },
  });

  return { sessionId, setSessionId, createOrResume };
}

export default function LeadCapture() {
  const { sessionId, createOrResume } = useChatbotSession();
  const [messages, setMessages] = useState<Array<{ role: 'user'|'assistant'; content: string }>>([
    { role: 'assistant', content: 'Hi! What do you need help with today?' }
  ]);
  const [input, setInput] = useState('');
  const [step, setStep] = useState<'chat' | 'confirm' | 'success'>('chat');
  const [extractedFields, setExtractedFields] = useState<Record<string, any>>({});
  const listRef = useRef<HTMLDivElement>(null);

  // Form state for confirmation
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    customer_zip_code: '',
    title: '',
    description: '',
    budget_min: '',
    budget_max: '',
    urgency_level: '',
    needed_date: undefined as Date | undefined,
    needed_time: '',
  });

  useEffect(() => {
    if (!sessionId && !createOrResume.isPending && !createOrResume.isSuccess) {
      createOrResume.mutate({});
    }
  }, [sessionId]);

  useEffect(() => {
    listRef.current?.lastElementChild?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const sendMessage = useMutation({
    mutationFn: async (text: string) => {
      const res = await apiRequest('POST', '/api/chatbot/messages', { sessionId, message: text });
      return res as { assistantMessage: string; extractedFields: Record<string, any> };
    },
    onSuccess: (data, variables) => {
      setMessages((prev) => [...prev, { role: 'user', content: variables }, { role: 'assistant', content: data.assistantMessage }]);
      setExtractedFields(data.extractedFields || {});
    }
  });

  const confirmLead = useMutation({
    mutationFn: async () => {
      // Construct needed_at from date and time
      let needed_at = null;
      if (formData.needed_date) {
        const date = formData.needed_date;
        if (formData.needed_time) {
          // Parse time like "2:30 PM" or "14:30"
          const timeMatch = formData.needed_time.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?/i);
          if (timeMatch) {
            let hours = parseInt(timeMatch[1]);
            const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
            const ampm = timeMatch[3]?.toUpperCase();

            if (ampm === 'PM' && hours < 12) hours += 12;
            if (ampm === 'AM' && hours === 12) hours = 0;

            date.setHours(hours, minutes);
          }
        }
        needed_at = date.toISOString();
      }

      const payload = {
        ...formData,
        needed_at,
        budget_min: formData.budget_min ? parseFloat(formData.budget_min) : undefined,
        budget_max: formData.budget_max ? parseFloat(formData.budget_max) : undefined,
      };

      const res = await apiRequest('POST', `/api/chatbot/sessions/${sessionId}/confirm`, payload);
      return res as { leadId: string };
    },
    onSuccess: () => {
      setStep('success');
    }
  });

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center px-4 py-8">
        <div className="w-full max-w-2xl text-center">
          <div className="mb-6">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-3xl font-semibold mb-2">Thank you!</h1>
            <p className="text-lg text-muted-foreground">
              Your request has been submitted to the marketplace. Service providers will contact you soon.
            </p>
          </div>
          <Button
            onClick={() => {
              // Reset to start a new conversation
              setStep('chat');
              setMessages([{ role: 'assistant', content: 'Hi! What do you need help with today?' }]);
              setExtractedFields({});
              setFormData({
                customer_name: '',
                customer_email: '',
                customer_phone: '',
                customer_zip_code: '',
                title: '',
                description: '',
                budget_min: '',
                budget_max: '',
                urgency_level: '',
                needed_date: undefined,
                needed_time: '',
              });
            }}
            className="mt-4"
          >
            Start New Request
          </Button>
        </div>
      </div>
    );
  }

  if (step === 'confirm') {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center px-4 py-8">
        <div className="w-full max-w-2xl">
          <h1 className="text-2xl font-semibold mb-4">Confirm Your Request</h1>
          <Card>
            <CardHeader>
              <CardTitle>Please review and complete the details below</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customer_name">Name *</Label>
                  <Input
                    id="customer_name"
                    value={formData.customer_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, customer_name: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="customer_email">Email *</Label>
                  <Input
                    id="customer_email"
                    type="email"
                    value={formData.customer_email}
                    onChange={(e) => setFormData(prev => ({ ...prev, customer_email: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customer_phone">Phone *</Label>
                  <Input
                    id="customer_phone"
                    value={formData.customer_phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, customer_phone: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="customer_zip_code">ZIP Code *</Label>
                  <Input
                    id="customer_zip_code"
                    value={formData.customer_zip_code}
                    onChange={(e) => setFormData(prev => ({ ...prev, customer_zip_code: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="title">Project Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="budget_min">Budget Min</Label>
                  <Input
                    id="budget_min"
                    type="number"
                    value={formData.budget_min}
                    onChange={(e) => setFormData(prev => ({ ...prev, budget_min: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="budget_max">Budget Max</Label>
                  <Input
                    id="budget_max"
                    type="number"
                    value={formData.budget_max}
                    onChange={(e) => setFormData(prev => ({ ...prev, budget_max: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="urgency_level">Urgency</Label>
                <Select value={formData.urgency_level} onValueChange={(value) => setFormData(prev => ({ ...prev, urgency_level: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select urgency level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Service Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.needed_date ? format(formData.needed_date, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.needed_date}
                        onSelect={(date) => setFormData(prev => ({ ...prev, needed_date: date }))}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label htmlFor="needed_time">Time (optional)</Label>
                  <Input
                    id="needed_time"
                    placeholder="e.g., 2:30 PM"
                    value={formData.needed_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, needed_time: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep('chat')}
                  className="flex-1"
                >
                  Back to Chat
                </Button>
                <Button
                  onClick={() => confirmLead.mutate()}
                  disabled={confirmLead.isPending || !formData.customer_name || !formData.customer_email || !formData.customer_phone || !formData.customer_zip_code || !formData.title || !formData.description || !formData.needed_date}
                  className="flex-1"
                >
                  {confirmLead.isPending ? 'Submitting...' : 'Submit to Marketplace'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center px-4 py-8">
      <div className="w-full max-w-2xl">
        <h1 className="text-2xl font-semibold mb-4">Project Lead Capture</h1>
        <div ref={listRef} className="border rounded-md p-4 h-[60vh] overflow-y-auto space-y-3">
          {messages.map((m, idx) => (
            <div key={idx} className={m.role === 'assistant' ? 'text-left' : 'text-right'}>
              <div className={`inline-block px-3 py-2 rounded-md ${m.role === 'assistant' ? 'bg-muted' : 'bg-primary text-primary-foreground'}`}>
                {m.content}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex gap-2">
          <form
            className="flex-1 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const text = input.trim();
              if (!text || sendMessage.isPending || !sessionId) return;
              setInput('');
              sendMessage.mutate(text);
            }}
          >
            <Input
              className="flex-1"
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              aria-label="Message"
            />
            <Button
              type="submit"
              disabled={sendMessage.isPending || !sessionId}
            >
              Send
            </Button>
          </form>
          {messages.length > 1 && (
            <Button
              variant="outline"
              onClick={() => setStep('confirm')}
            >
              Confirm & Submit
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

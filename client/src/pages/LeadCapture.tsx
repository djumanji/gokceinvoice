import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

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
  const listRef = useRef<HTMLDivElement>(null);

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
      return res as { assistantMessage: string };
    },
    onSuccess: (data, variables) => {
      setMessages((prev) => [...prev, { role: 'user', content: variables }, { role: 'assistant', content: data.assistantMessage }]);
    }
  });

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
        <form
          className="mt-4 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const text = input.trim();
            if (!text || sendMessage.isPending || !sessionId) return;
            setInput('');
            sendMessage.mutate(text);
          }}
        >
          <input
            className="flex-1 border rounded-md px-3 py-2"
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            aria-label="Message"
          />
          <button
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground disabled:opacity-60"
            type="submit"
            disabled={sendMessage.isPending || !sessionId}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

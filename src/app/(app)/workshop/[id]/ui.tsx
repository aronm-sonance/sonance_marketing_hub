'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

interface Session {
  id: string;
  title: string;
  channel_id?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface Channel {
  id: string;
  name: string;
}

export default function WorkshopSessionUI({ 
  session: initialSession,
  initialMessages,
  allSessions,
  channels
}: { 
  session: Session;
  initialMessages: Message[];
  allSessions: Session[];
  channels: Channel[];
}) {
  const router = useRouter();
  const [session, setSession] = useState<Session>(initialSession);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputValue, setInputValue] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const updateSessionTitle = async (title: string) => {
    try {
      const response = await fetch(`/api/workshop/${session.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });

      if (!response.ok) throw new Error('Failed to update session');
      const { session: updatedSession } = await response.json();
      setSession(updatedSession);
    } catch (error) {
      console.error('Error updating session:', error);
    }
  };

  const deleteSession = async () => {
    if (!confirm('Delete this workshop session?')) return;

    try {
      const response = await fetch(`/api/workshop/${session.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete session');
      router.push('/workshop');
    } catch (error) {
      console.error('Error deleting session:', error);
      alert('Failed to delete session');
    }
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || isStreaming) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setIsStreaming(true);

    // Add user message to UI immediately
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessage,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);

    // Prepare assistant message for streaming
    const assistantMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, assistantMsg]);

    try {
      const response = await fetch(`/api/workshop/${session.id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage }),
      });

      if (!response.ok) throw new Error('Failed to send message');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error('No reader available');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        assistantMsg.content += chunk;
        
        // Update messages with streaming content
        setMessages(prev => [
          ...prev.slice(0, -1),
          { ...assistantMsg }
        ]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove the pending assistant message on error
      setMessages(prev => prev.slice(0, -1));
      alert('Failed to send message');
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex h-full gap-4">
      {/* Left Panel - Sessions List */}
      <div className="w-80 bg-white/5 border border-white/10 rounded-md flex flex-col">
        <div className="p-4 border-b border-white/10">
          <h2 className="text-sm font-bold uppercase tracking-widest mb-3">Creative Workshop</h2>
          <Link
            href="/workshop"
            className="block w-full text-center bg-white text-black px-4 py-2 rounded text-sm font-bold hover:bg-white/90 transition-colors"
          >
            + New Session
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {allSessions.map(s => (
            <Link
              key={s.id}
              href={`/workshop/${s.id}`}
              className={`block group p-3 rounded cursor-pointer transition-colors ${
                s.id === session.id
                  ? 'bg-white/10 border border-white/20'
                  : 'bg-black/40 border border-white/5 hover:border-white/10'
              }`}
            >
              <div className="text-sm font-medium line-clamp-1">{s.title}</div>
              <div className="text-[10px] text-white/40 mt-1">
                {new Date(s.updated_at).toLocaleDateString()}
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Right Panel - Chat Interface */}
      <div className="flex-1 bg-white/5 border border-white/10 rounded-md flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <input
            type="text"
            value={session.title}
            onChange={(e) => updateSessionTitle(e.target.value)}
            className="flex-1 bg-transparent text-lg font-medium outline-none"
          />
          <button
            onClick={deleteSession}
            className="ml-4 text-white/40 hover:text-red-400 transition-colors"
          >
            Delete
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-white/40">
              <p className="text-lg mb-2">Start a conversation!</p>
              <p className="text-sm">Ask for ideas, brainstorm concepts, or refine your content.</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-4 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-white text-black'
                      : 'bg-white/10 border border-white/10 text-white'
                  }`}
                >
                  <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                  {message.role === 'assistant' && !message.content && (
                    <div className="text-white/40 text-sm">Thinking...</div>
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-white/10">
          <div className="flex gap-3">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message... (Shift+Enter for new line)"
              className="flex-1 bg-black/40 border border-white/10 rounded px-4 py-3 text-sm resize-none focus:outline-none focus:border-white/30 transition-colors"
              rows={3}
              disabled={isStreaming}
            />
            <button
              onClick={sendMessage}
              disabled={!inputValue.trim() || isStreaming}
              className="px-6 py-2 bg-white text-black rounded font-bold hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed self-end"
            >
              {isStreaming ? '...' : 'Send'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

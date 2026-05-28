'use client';

import { useMessages } from '@/hooks/useMessages';
import { useState } from 'react';

export default function MessagesPage() {
  const [selectedCommunity, setSelectedCommunity] = useState<string>('');
  const { messages, isLoading } = useMessages(selectedCommunity);
  const [input, setInput] = useState('');

  return (
    <div className="p-8">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Messages</h1>
          <p className="text-muted-foreground">
            Connect with community members
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-4">
          {/* Community List */}
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="mb-4 font-semibold">Communities</h3>
            <div className="space-y-2">
              <button className="w-full text-left rounded px-3 py-2 hover:bg-accent text-sm">
                Select a community...
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="md:col-span-3 rounded-lg border border-border bg-card flex flex-col h-96">
            {/* Message List */}
            <div className="flex-1 overflow-y-auto p-4">
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="skeleton h-12 rounded" />
                  ))}
                </div>
              ) : messages.length === 0 ? (
                <p className="text-center text-muted-foreground">
                  No messages yet
                </p>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <div key={msg.id} className="p-3 rounded bg-aether-primary/5">
                      <p className="text-sm font-medium">{msg.author.username}</p>
                      <p className="text-sm text-foreground">{msg.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Input */}
            <div className="border-t border-border p-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
                <button className="rounded-lg bg-aether-primary px-4 py-2 font-semibold text-primary-foreground">
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

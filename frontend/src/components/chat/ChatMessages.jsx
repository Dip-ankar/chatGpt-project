import React, { useState } from 'react';
import ChatComposer from './ChatComposer';
import { fakeAIReply } from '../chat/aiClient';
import '../chat/ChatMessages';

const ChatMessages = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    const userMsg = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsSending(true);

    try {
      const reply = await fakeAIReply(input);
      const aiMsg = { role: 'ai', content: reply };
      setMessages((prev) => [...prev, aiMsg]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="chat-window">
      <div className="chat-messages">
        {messages.map((m, idx) => (
          <div key={idx} className={`msg ${m.role}`}>
            {m.content}
          </div>
        ))}
      </div>
      <ChatComposer
        input={input}
        setInput={setInput}
        onSend={handleSend}
        isSending={isSending}
      />
    </div>
  );
};

export default ChatMessages;

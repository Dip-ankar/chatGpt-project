import React, { useEffect, useState } from 'react';
import { io } from "socket.io-client";
import ChatMobileBar from '../components/chat/ChatMobileBar.jsx';
import ChatSidebar from '../components/chat/ChatSidebar.jsx';
import ChatMessages from '../components/chat/ChatMessages.jsx';
import ChatComposer from '../components/chat/ChatComposer.jsx';
import '../components/chat/ChatLayout.css';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import {
  startNewChat,
  selectChat,
  setInput,
  sendingStarted,
  sendingFinished,
  addUserMessage,
  addAIMessage,
  setChats
} from '../store/chatSlice.js';

const Home = () => {
  const dispatch = useDispatch();
  const chats = useSelector(state => state.chat.chats);
  const activeChatId = useSelector(state => state.chat.activeChatId);
  const input = useSelector(state => state.chat.input);
  const isSending = useSelector(state => state.chat.isSending);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [socket, setSocket] = useState(null);

  const activeChat = chats.find(c => c.id === activeChatId) || null;

  const [messages, setMessages] = useState([]);

  // 🆕 Create new chat
  const handleNewChat = async () => {
    let title = window.prompt('Enter a title for the new chat:', '');
    if (title) title = title.trim();
    if (!title) return;

    const response = await axios.post(
      "https://project-01-chatGpt.onrender.com/api/chat",
      { title },
      { withCredentials: true }
    );

    dispatch(startNewChat(response.data.chat));
    getMessages(response.data.chat._id);
    setSidebarOpen(false);
  };

  // 🆕 Fetch messages for a chat
  const getMessages = async (chatId) => {
    const response = await axios.get(
      `https://project-01-chatGpt.onrender.com/api/chat/messages/${chatId}`,
      { withCredentials: true }
    );

    const fetchedMessages = response.data.messages.map(m => ({
      type: m.role === 'user' ? 'user' : 'ai',
      content: m.content
    }));

    setMessages(fetchedMessages);
  };

  // 🆕 Send user message
  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || !activeChatId || isSending) return;

    dispatch(sendingStarted());

    // Immediately add user message locally
    const newMessages = [...messages, { type: 'user', content: trimmed }];
    setMessages(newMessages);

    // Save in Redux
    dispatch(addUserMessage({ chatId: activeChatId, content: trimmed }));

    // Clear input
    dispatch(setInput(''));

    // Send to server
    socket.emit("ai-message", {
      chat: activeChatId,
      content: trimmed
    });
  };

  // 🆕 Initial setup: fetch chats + connect socket
  useEffect(() => {
    axios
      .get("https://project-01-chatGpt.onrender.com/api/chat", {
        withCredentials: true,
      })
      .then((response) => {
        dispatch(setChats(response.data.chats.reverse()));
      });

    const tempSocket = io("https://project-01-chatGpt.onrender.com", {
      withCredentials: true,
    });

    // Listen for AI responses
    tempSocket.on("ai-response", (messagePayload) => {
      console.log("Received AI response:", messagePayload);

      // Add AI reply locally
      setMessages((prevMessages) => [
        ...prevMessages,
        { type: 'ai', content: messagePayload.content }
      ]);

      // Also update Redux
      dispatch(addAIMessage({
        chatId: activeChatId,
        content: messagePayload.content
      }));

      dispatch(sendingFinished());
    });

    setSocket(tempSocket);

    return () => {
      tempSocket.disconnect();
    };
  }, [dispatch, activeChatId]);

  return (
    <div className="chat-layout minimal">
      <ChatMobileBar
        onToggleSidebar={() => setSidebarOpen(o => !o)}
        onNewChat={handleNewChat}
      />
      <ChatSidebar
        chats={chats}
        activeChatId={activeChatId}
        onSelectChat={(id) => {
          dispatch(selectChat(id));
          setSidebarOpen(false);
          getMessages(id);
        }}
        onNewChat={handleNewChat}
        open={sidebarOpen}
      />
      <main className="chat-main" role="main">
        {messages.length === 0 && (
          <div className="chat-welcome" aria-hidden="true">
            <div className="chip">Early Preview</div>
            <h1>ChatGPT Clone</h1>
            <p>
              Ask anything. Paste text, brainstorm ideas, or get quick
              explanations. Your chats stay in the sidebar so you can pick up
              where you left off.
            </p>
          </div>
        )}
        <ChatMessages messages={messages} isSending={isSending} />
        {activeChatId && (
          <ChatComposer
            input={input}
            setInput={(v) => dispatch(setInput(v))}
            onSend={sendMessage}
            isSending={isSending}
          />
        )}
      </main>
      {sidebarOpen && (
        <button
          className="sidebar-backdrop"
          aria-label="Close sidebar"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default Home;

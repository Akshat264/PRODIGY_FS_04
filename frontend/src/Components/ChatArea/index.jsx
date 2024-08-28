import React, { useState, useEffect } from 'react';
import './index.css';
import avatar from '../Header/assets/default-avatar.png';
import io from 'socket.io-client';
const uri= import.meta.env.VITE_API_URL;
const ChatWindow = ({ user }) => {
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [messageInput, setMessageInput] = useState('');
    const [socket, setSocket] = useState(null);
    const [showOptions, setShowOptions] = useState(null); // State to track the currently active options menu
    const token = localStorage.getItem('token');
    const userId = user._id;
    const [receiverId, setReceiverId] = useState(null);
    useEffect(() => {
        const newSocket = io(uri, { query: { userId } });
        setSocket(newSocket);

        newSocket.emit('userConnected', { userId });

        return () => {
            newSocket.emit('userDisconnected', { userId });
            newSocket.disconnect();
        };
    }, [userId]);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await fetch(`${uri}/api/users`, {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                if (!response.ok) {
                    throw new Error('Failed to fetch users');
                }
                const data = await response.json();
                setUsers(data);
            } catch (error) {
                console.error(error);
            }
        };
        fetchUsers();
    }, [token]);

    const handleUserSelect = async (user) => {
        setSelectedUser(user);
        setReceiverId(user._id);
        fetchMessages(user._id);
    };

    useEffect(() => {
        if (!socket) return;

        socket.on('receiveMessage', (message) => {
            if (
                (message.sender === userId && message.receiver === receiverId) ||
                (message.sender === receiverId && message.receiver === userId)
            ) {
                const senderUsername = message.sender === userId ? 'You' : users.find(u => u._id === message.sender)?.username || message.sender;
                
                setMessages((prevMessages) => [...prevMessages, { ...message, sender: senderUsername }]);
            }
        });

        return () => {
            socket.off('receiveMessage');
        };
    }, [socket, userId, receiverId, users]);

    const fetchMessages = async (receiverId) => {
        const response = await fetch(`${uri}/api/messages/${receiverId}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        const previousMessages = await response.json();

        const labeledMessages = previousMessages.map(msg => ({
            ...msg,
            sender: msg.sender === userId ? 'You' : users.find(u => u._id === msg.sender)?.username || msg.sender,
        }));

        setMessages(labeledMessages);
    };

    const sendMessage = async () => {
        if (messageInput.trim()) {
            const messageData = { sender: userId, receiver: receiverId, message: messageInput };
            setMessages((prevMessages) => [...prevMessages, { ...messageData, sender: 'You', _id: Date.now().toString() }]);
            socket.emit('sendMessage', messageData);
            setMessageInput('');
        }
    };

    const handleCopyMessage = (message) => {
        navigator.clipboard.writeText(message.message);
        toggleOptions(message._id);
        alert('Message copied to clipboard');
    };

    const handleDeleteMessage = (messageId) => {
        setMessages((prevMessages) => prevMessages.filter((msg) => msg._id !== messageId));
        toggleOptions(messageId);
        socket.emit('deleteMessage', messageId); // Notify server to delete the message
    };

    const toggleOptions = (messageId) => {
        setShowOptions((prevShowOptions) => (prevShowOptions === messageId ? null : messageId));
    };

    return (
        <div className="chat-window">
            <div className="user-list">
                {users.map((user) => (
                    <div
                        key={user._id}
                        className={`user-item ${selectedUser && selectedUser._id === user._id ? 'selected' : ''}`}
                        onClick={() => handleUserSelect(user)}
                    >
                        <img src={user.profileImage ? `${uri}${user.profileImage}` : avatar} alt="Avatar" />
                        <span>{user.username}</span>
                    </div>
                ))}
            </div>
            <div className="chat-section">
                {selectedUser ? (
                    <div className='chat-section_child'>
                        <div className="messages">
                            {messages.map((msg) => (
                                <div
                                    key={msg._id}
                                    className={`message ${msg.sender === 'You' ? 'sent' : 'received'}`}
                                >
                                    <div className="message-content">
                                        <div className='message_meta'>
                                            <strong>{msg.sender}</strong>
                                            <div className="message-options">
                                            <span onClick={() => toggleOptions(msg._id)}  className="dropdown-arrow">&#11167;</span>
                                            {showOptions === msg._id && (
                                                <div className="options-dropdown">
                                                    <button onClick={() => handleCopyMessage(msg)}>Copy</button>
                                                    <button onClick={() => handleDeleteMessage(msg._id)}>Delete</button>
                                                </div>
                                            )}
                                        </div>
                                        </div> {msg.message}
                                        
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className='btn_msg'>
                        <input
                            type="text"
                            value={messageInput}
                            onChange={(e) => setMessageInput(e.target.value)}
                            className='sendmessage_input'
                            placeholder='Enter your message here'
                        />
                        <button onClick={sendMessage} className='sendmessage_btn'>Send <span style={{fontSize: "2vw"}}>&#11162;</span></button></div>
                    </div>
                ) : (
                    <p>Select a user to start chatting</p>
                )}
            </div>
        </div>
    );
};

export default ChatWindow;

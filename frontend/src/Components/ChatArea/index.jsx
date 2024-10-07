import React, { useState, useEffect } from 'react';
import './index.css';
import avatar from '../Header/assets/default-avatar.png';
import io from 'socket.io-client';

const uri = import.meta.env.VITE_API_URL;

const ChatWindow = ({ user }) => {
    const [users, setUsers] = useState([]);
    const [chatRooms, setChatRooms] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedChatRoom, setSelectedChatRoom] = useState(null);
    const [messages, setMessages] = useState([]);
    const [messageInput, setMessageInput] = useState('');
    const [socket, setSocket] = useState(null);
    const [showOptions, setShowOptions] = useState(null);
    const [viewMode, setViewMode] = useState('users'); // 'users' or 'rooms'
    const token = localStorage.getItem('token');
    const userId = user._id;
    const [receiverId, setReceiverId] = useState(null);
    const [newRoomName, setNewRoomName] = useState('');
    const [sidebarVisible, setSidebarVisible] = useState(false); // State for sidebar visibility
    // Toggle the sidebar visibility
    const toggleSidebar = () => {
        setSidebarVisible(!sidebarVisible);
    };
    useEffect(() => {
        if (!socket) return;
    
        // Handle room messages
        socket.on('receiveRoomMessage', (message) => {
            if (selectedChatRoom && message.roomId === selectedChatRoom._id) {
                const senderUsername = message.sender === userId ? 'You' : users.find(u => u._id === message.sender)?.username || message.sender;
                setMessages((prevMessages) => [...prevMessages, { ...message, sender: senderUsername }]);
            }
        });
    
        // Handle direct messages
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
            socket.off('receiveRoomMessage');
            socket.off('receiveMessage');
        };
    }, [socket, selectedChatRoom, userId, users, receiverId]);
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
        if (socket && selectedChatRoom) {
            socket.emit('joinRoom', { roomId: selectedChatRoom._id, userId });
        }
    
        return () => {
            if (socket && selectedChatRoom) {
                socket.emit('leaveRoom', { roomId: selectedChatRoom._id, userId });
            }
        };
    }, [socket, selectedChatRoom, userId]);
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

        const fetchChatRooms = async () => {
            try {
                const response = await fetch(`${uri}/api/chatrooms`, {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                if (!response.ok) {
                    throw new Error('Failed to fetch chat rooms');
                }
                const data = await response.json();
                setChatRooms(data);
            } catch (error) {
                console.error(error);
            }
        };

        fetchUsers();
        fetchChatRooms();
    }, [token]);

    const handleUserSelect = async (user) => {
        setSelectedUser(user);
        setSelectedChatRoom(null);
        fetchMessages(user._id);
        setReceiverId(user._id);
         // Deselect any chat room
    };

    const handleChatRoomSelect = (room) => {
        setSelectedUser(null);
        setSelectedChatRoom(room);
        fetchMessages(room._id);
        setReceiverId(room._id);  
    };


    useEffect(() => {
        if (selectedUser) {
            fetchMessages(selectedUser._id);
        } else if (selectedChatRoom) {
            fetchMessages(selectedChatRoom._id);
        }
    }, [selectedUser, selectedChatRoom]);
    const fetchMessages = async (receiverId) => {
        let response;
        if (selectedChatRoom) {
            response = await fetch(`${uri}/api/${selectedChatRoom._id}/messages`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
        }
        else{
        response = await fetch(`${uri}/api/messages/${receiverId}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
    }
        const previousMessages = await response.json();

        const labeledMessages = previousMessages.map(msg => ({
            ...msg,
            sender: msg.sender === userId ? 'You' : users.find(u => u._id === msg.sender)?.username || msg.sender,
        }));

        setMessages(labeledMessages);
    };
    const sendMessage = async () => {
        if (messageInput.trim()) {
            if (selectedChatRoom) {
                const roomId = selectedChatRoom._id;
                const messageData = {
                    sender: userId,
                    roomId: roomId,
                    message: messageInput,
                };
                // Emit message to the room
                console.log(messageData);
                // setMessages((prevMessages) => [...prevMessages, { ...messageData, sender: 'You', _id: Date.now().toString() }]);
                socket.emit('sendRoomMessage', messageData);
    
                // Store the message in the database
                try {
                    await fetch(`${uri}/api/${roomId}/messages`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify(messageData),
                    });
                } catch (error) {
                    console.error('Failed to store room message:', error);
                }
            }
            else{
            const messageData = { sender: userId, receiver: receiverId, message: messageInput };
            setMessages((prevMessages) => [...prevMessages, { ...messageData, sender: 'You', _id: Date.now().toString() }]);
            socket.emit('sendMessage', messageData);
            }
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

    const handleCreateRoom = async () => {
        try {
            const response = await fetch(`${uri}/api/createroom`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ name: newRoomName || 'Untitled Room' }), // Use newRoomName or a default name
            });
            if (!response.ok) {
                throw new Error('Failed to create room');
            }
            const newRoom = await response.json();
            setChatRooms([...chatRooms, newRoom]); // Update the chat room list
            setNewRoomName(''); // Reset the input field
        } catch (error) {
            console.error('Error creating room:', error);
        }
    };

    return (
        <div className="chat-window">
             {/* Sidebar toggle button for small screens */}
             <button className="sidebar-toggle" onClick={toggleSidebar}>
                {sidebarVisible ? '←' : '→'}
            </button>

            {/* Sidebar container with sliding effect */}
            <div className={`user-list ${sidebarVisible ? 'visible' : ''}`}>
                <div className="user-list-1">
                    {viewMode === 'users' ? (
                        users.map((user) => (
                            <div
                                key={user._id}
                                className={`user-item ${selectedUser && selectedUser._id === user._id ? 'selected' : ''}`}
                                onClick={() => handleUserSelect(user)}
                            >
                                <img src={user.profileImage ? `${user.profileImage}` : avatar} alt="Avatar" />
                                <span>{user.username}</span>
                            </div>
                        ))
                    ) : (
                        chatRooms.map((room) => (
                            <div
                                key={room._id}
                                className={`user-item ${selectedChatRoom && selectedChatRoom._id === room._id ? 'selected' : ''}`}
                                onClick={() => handleChatRoomSelect(room)}
                            >
                                <span>{room.name}</span>
                            </div>
                        ))
                    )}
                </div>

                {/* List options for switching between users and rooms */}
                <div className="list-options">
                    <div className='buttons_options'><button onClick={() => setViewMode('users')} style={{backgroundColor: viewMode === "users" && "blue"}}>
                        Users
                    </button>
                    <button onClick={() => setViewMode('rooms')} style={{backgroundColor: viewMode === "rooms" && "blue"}}>
                        Chat Rooms
                    </button></div>
                    {viewMode === 'rooms' && (
                        <div className='list-options-create'>
                        <input type="text"
                                placeholder="Enter room name"
                                value={newRoomName}
                                onChange={(e) => setNewRoomName(e.target.value)}
                                className="create-room-input"/>
                        <button onClick={handleCreateRoom} className="create-room-btn">
                            Create New Room
                        </button>
                        </div>
                    )}
                </div>
            </div>
            <div className="chat-section">
                {(viewMode==="users" && selectedUser || viewMode==="rooms" && selectedChatRoom) ? (
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
                                                <span onClick={() => toggleOptions(msg._id)} className="dropdown-arrow">&#11167;</span>
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
                            <button onClick={sendMessage} className='sendmessage_btn'>Send</button>
                        </div>
                    </div>
                ) : (
                    <p>Select a {viewMode === 'users' ? 'user' : 'chat room'} to start chatting</p>
                )}
            </div>
        </div>
    );
};

export default ChatWindow;

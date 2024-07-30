"use client";

import { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../context/AuthContext'; // 正しいパスを指定

export default function Chat() {
    const { user } = useAuth();
    const [posts, setPosts] = useState([]);

    useEffect(() => {
        const q = query(collection(db, "posts"), orderBy("timestamp", "asc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return unsubscribe;
    }, []);

    return (
        <div className="container mx-auto p-4 min-h-screen bg-blue-400">
            <div className="space-y-4">
                {posts.map((post) => (
                    <div
                        key={post.id}
                        className={`p-4 rounded-lg text-black ${post.userId === user?.uid ? 'bg-green-400 ml-auto text-left' : 'bg-white mr-auto text-left'}`}
                        style={{ maxWidth: '75%' }}
                    >
                        <p className="font-semibold">{post.userName}</p> {/* ユーザー名を表示 */}
                        {/* <p>{post.text}</p> */}
                        <p className="font-bold mt-2">{post.response}</p>
                        {/* <p className="text-sm text-gray-500 mt-1">{new Date(post.timestamp.toDate()).toLocaleString()}</p> */}
                    </div>
                ))}
            </div>
        </div>
    );
}

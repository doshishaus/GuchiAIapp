"use client";

import { useAuth } from './context/AuthContext';
import { useState, useCallback, useMemo } from 'react';
import axios from 'axios';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Image from 'next/image';
import bg from "@/public/bg-top.png";
import topimg from "@/public/topicon.png";
import talkicon from "@/public/talkicon.png";


const ReactMediaRecorder = dynamic(
    () => import('react-media-recorder').then(mod => mod.ReactMediaRecorder),
    { ssr: false }
);

const mbtiTypes = [
    "INTJ", "INTP", "ENTJ", "ENTP", "INFJ", "INFP", "ENFJ", "ENFP",
    "ISTJ", "ISFJ", "ESTJ", "ESFJ", "ISTP", "ISFP", "ESTP", "ESFP"
];

export default function Home() {
    const { user, login, logout } = useAuth();
    const [mbti, setMbti] = useState("");
    const [recordedText, setRecordedText] = useState("");
    const [prediction, setPrediction] = useState("");
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSave = useCallback(async () => {
        if (mbti) {
            try {
                await axios.post('/api/saveMBTI', { userId: user.uid, mbti });
                alert('MBTIタイプが保存されました');
            } catch (error) {
                console.error('MBTIタイプの保存エラー:', error);
                alert('MBTIタイプの保存に失敗しました');
            }
        } else {
            alert('MBTIタイプを選択してください');
        }
    }, [mbti, user]);

    const handleRecord = useCallback(async () => {
        if (audioBlob) {
            const formData = new FormData();
            formData.append('audio', audioBlob, 'audio.webm');

            try {
                console.log('音声を /api/speechToText に送信');
                const response = await axios.post('/api/speechToText', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });
                const { transcript } = response.data;
                console.log('テキスト変換結果受信:', transcript);
                setRecordedText(transcript);

                // Vertex AIに送信
                console.log('テキストを /api/vertexAI に送信');
                const aiResponse = await axios.post('/api/vertexAI', { text: transcript, mbti, userId: user.uid, userName: user.displayName });
                console.log('Vertex AIからのレスポンス受信:', aiResponse.data.response);
                setPrediction(aiResponse.data.response);
            } catch (error: any) {
                console.error('音声処理エラー:', error);
                setError('音声処理エラー: ' + (error.response?.data?.details || error.message));
            }
        } else {
            setError('録音された音声がありません');
        }
    }, [audioBlob, mbti]);

    const mbtiOptions = useMemo(() => mbtiTypes.map((type) => (
        <option key={type} value={type}>{type}</option>
    )), []);

    return (
        <div className="container h-screen w-screen mx-auto p-4 bg-sky-500 bg-cover bg-center" style={{ backgroundImage: `url(${bg.src})` }}>
            <h1 className='text-center'>ぐちタイプAI</h1>
            {!user ? (
                <div className='flex h-3/4 justify-center items-center'>
                    <div className='block'>
                        <Image src={topimg} alt='アイコン' width={400} height={400} />
                        <div className="flex w-fit rounded-full mx-auto">
                            <button onClick={login} className="bg-slate-100 text-black p-4 font-black font-sans text-2xl rounded-3xl shadow-lg transform transition-transform hover:scale-105 hover:shadow-2xl">
                                LOGIN(Google)
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div>
                    <div className='flex justify-evenly items-center'>
                        <button onClick={logout} className="bg-yellow-500 text-white p-2 rounded-full w-10">
                            ＜
                        </button>
                        <p>こんにちは、{user.displayName}さん</p>
                    </div>
                    <Image src={talkicon} alt='アイコン' width={400} height={400} className='mx-auto' />

                    <div className="mt-4 text-center">
                        <select
                            value={mbti} onChange={(e) => setMbti(e.target.value)} className="border p-2 rounded text-black font-bold">
                            <option value="">MBTIタイプを選択</option>
                            {mbtiOptions}
                        </select>
                        <button onClick={handleSave} className="bg-blue-500 text-white p-2 rounded mt-2">
                            保存
                        </button>
                    </div>
                    <div className="mt-4">

                        {error && <p className="text-red-500">{error}</p>}
                        <ReactMediaRecorder
                            audio
                            blobPropertyBag={{ type: 'audio/webm' }}
                            onStop={(blobUrl, blob) => setAudioBlob(blob)}
                            render={({ startRecording, stopRecording, mediaBlobUrl }) => (
                                <div className='text-center'>
                                    <button onClick={startRecording} className="bg-green-500 text-white p-2 rounded-md w-10 transform transition-transform duration-150 active:scale-95">
                                        ▶️
                                    </button>
                                    <button onClick={stopRecording} className="bg-red-500 text-white p-2 rounded-md w-10 ml-2 transform transition-transform duration-150 active:scale-95">
                                        ◼️
                                    </button>

                                    <button onClick={handleRecord} className="bg-blue-500 text-white p-2 rounded-md ml-2 font-sans">
                                        ぐちを生成/投稿
                                    </button>
                                    {mediaBlobUrl && <audio src={mediaBlobUrl} controls />}
                                    <p>録音結果: {recordedText}</p>
                                    <p>AIの予測: {prediction}</p>
                                </div>
                            )}
                        />
                        <div className='text-center'>
                            <Link href="/chat" className='block'>
                                <button className="bg-blue-500 text-white p-2 rounded mt-4">チャットページへ</button>
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

import { useRef, useState, useEffect, useCallback } from 'react';
import { Mic, Video, Square, RefreshCcw, Camera } from 'lucide-react';
import { cn } from '../utils/utils';

export const Recorder = ({ onRecordingComplete, mode }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [stream, setStream] = useState(null);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [timer, setTimer] = useState(0);
  const mediaRecorderRef = useRef(null);
  const videoRef = useRef(null);
  const timerRef = useRef(null);

  const stopStream = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  useEffect(() => {
    return () => {
      stopStream();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [stopStream]);

  const startRecording = async () => {
    try {
      const constraints = mode === 'video' 
        ? { video: true, audio: true } 
        : { audio: true };
      
      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(newStream);
      
      if (videoRef.current && mode === 'video') {
        videoRef.current.srcObject = newStream;
      }

      const mediaRecorder = new MediaRecorder(newStream);
      mediaRecorderRef.current = mediaRecorder;
      const chunks = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: mode === 'video' ? 'video/webm' : 'audio/webm' });
        setRecordedBlob(blob);
        onRecordingComplete(blob, mode);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setTimer(0);
      timerRef.current = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Error accessing media devices:", err);
      if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        alert("No camera or microphone found! Please ensure your device the correct hardware plugged in.");
      } else {
        alert("Please grant camera and microphone permissions in your browser settings.");
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      stopStream();
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-md mx-auto p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
      <div className="relative w-full aspect-video bg-gray-900 rounded-xl overflow-hidden flex items-center justify-center">
        {mode === 'video' ? (
          <video 
            ref={videoRef} 
            autoPlay 
            muted 
            playsInline 
            className={cn("w-full h-full object-cover", !stream && "hidden")}
          />
        ) : (
          <div className={cn("flex flex-col items-center gap-2 text-white", !isRecording && "opacity-50")}>
            <Mic size={48} className={isRecording ? "animate-pulse text-red-500" : ""} />
            <span className="text-sm font-mono">{isRecording ? "Recording Audio..." : "Ready to Record"}</span>
          </div>
        )}
        
        {!stream && mode === 'video' && (
          <div className="flex flex-col items-center gap-2 text-gray-400">
            <Camera size={48} />
            <span className="text-sm">Camera Preview</span>
          </div>
        )}

        {isRecording && (
          <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-mono flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-ping" />
            {formatTime(timer)}
          </div>
        )}
      </div>

      <div className="flex gap-4">
        {!isRecording ? (
          <button
            onClick={startRecording}
            className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-full hover:bg-gray-800 transition-colors"
          >
            {mode === 'video' ? <Video size={20} /> : <Mic size={20} />}
            Start {mode === 'video' ? 'Video' : 'Voice'} Answer
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="flex items-center gap-2 px-6 py-3 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
          >
            <Square size={20} />
            Stop Recording
          </button>
        )}
        
        {recordedBlob && !isRecording && (
          <button
            onClick={() => {
              setRecordedBlob(null);
              setTimer(0);
            }}
            className="p-3 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-colors"
            title="Reset"
          >
            <RefreshCcw size={20} />
          </button>
        )}
      </div>
    </div>
  );
};

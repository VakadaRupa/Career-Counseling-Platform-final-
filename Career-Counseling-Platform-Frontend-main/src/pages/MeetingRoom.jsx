import React, { useEffect, useRef, useState } from 'react';
import { Card, Button, Badge, Input } from '../components/ui/BaseComponents';
import { Video, VideoOff, Mic, MicOff, Settings, ExternalLink, Camera, Monitor } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import { useAuth } from '../context/AuthContext';

export default function MeetingRoom() {
  const location = useLocation();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  // Session setup
  const { session } = location.state || {};
  const defaultSession = {
    id: 1,
    title: 'Career Consultation',
    expert: 'Sarah Miller',
    link: 'https://meet.google.com/mff-sixv-xwe', // updated to Google Meet link per user request
  };
  const safeSession = session || defaultSession;

  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);
  const [error, setError] = useState(null);

  const [isEditingLink, setIsEditingLink] = useState(false);
  const [editLinkValue, setEditLinkValue] = useState(safeSession.link);
  const [currentLink, setCurrentLink] = useState(safeSession.link);
  
  // Sync meeting link logic
  useEffect(() => {
    // 1. Load from LocalStorage first (instant)
    const localLink = localStorage.getItem(`cp_meeting_link_${safeSession.id}`);
    if (localLink) {
      setCurrentLink(localLink);
      setEditLinkValue(localLink);
    }

    // 2. Try fetching from supabase
    const fetchLink = async () => {
      try {
        const { data, error } = await supabase
          .from('counseling_sessions')
          .select('link')
          .eq('id', safeSession.id)
          .single();
        
        if (!error && data?.link) {
          setCurrentLink(data.link);
          setEditLinkValue(data.link);
          localStorage.setItem(`cp_meeting_link_${safeSession.id}`, data.link);
        }
      } catch (err) {
        // Fail silently
      }
    };

    fetchLink();

    // 3. Subscribe to changes (Realtime)
    const channel = supabase
      .channel(`session_sync_${safeSession.id}`)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'counseling_sessions',
        filter: `id=eq.${safeSession.id}`
      }, (payload) => {
        if (payload.new.link) {
          setCurrentLink(payload.new.link);
          localStorage.setItem(`cp_meeting_link_${safeSession.id}`, payload.new.link);
        }
      })
      .subscribe();

    // 4. Sync across tabs via storage event (for local fallback)
    const handleStorageChange = (e) => {
      if (e.key === `cp_meeting_link_${safeSession.id}` && e.newValue) {
        setCurrentLink(e.newValue);
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [safeSession.id]);

  // Start camera and microphone
  useEffect(() => {
    startCamera();
    return () => {
      if (stream) stream.getTracks().forEach(track => track.stop());
    };
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(mediaStream);
      if (videoRef.current) videoRef.current.srcObject = mediaStream;
      setIsVideoOn(true);
      setIsMicOn(true);
      setError(null);
    } catch (err) {
      console.error("Error accessing media devices:", err);
      setIsVideoOn(false);
      setIsMicOn(false);
      if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError("No camera or microphone found on this device.");
      } else if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError("Camera/Microphone access denied. Allow permissions in browser settings.");
      } else {
        setError("Could not access camera/microphone: " + err.message);
      }
    }
  };

  const toggleVideo = () => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      videoTrack.enabled = !videoTrack.enabled;
      setIsVideoOn(videoTrack.enabled);
    } else if (error) startCamera();
  };

  const toggleMic = () => {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      audioTrack.enabled = !audioTrack.enabled;
      setIsMicOn(audioTrack.enabled);
    } else if (error) startCamera();
  };

  const handleSaveLink = async () => {
    try {
      // Always save to localStorage immediately for local persistence
      localStorage.setItem(`cp_meeting_link_${safeSession.id}`, editLinkValue);
      setCurrentLink(editLinkValue);

      // Try saving to database as well
      const { error } = await supabase
        .from('counseling_sessions')
        .update({ link: editLinkValue })
        .eq('id', safeSession.id);

      if (error) {
        console.warn("Could not sync to database (table may be missing), link saved locally.");
      }
      
      setIsEditingLink(false);
    } catch (err) {
      console.warn("Link saved locally. Database update failed.");
      setIsEditingLink(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] relative transition-colors duration-300">
      {/* Background */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <img 
          src="https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80&w=1200" 
          alt="Meeting Background" 
          className="h-full w-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--bg-primary)] via-transparent to-[var(--bg-primary)]" />
      </div>

      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 relative z-10">

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left: Camera Preview */}
          <div className="lg:col-span-8">
            <div className="relative aspect-video rounded-2xl bg-[var(--bg-secondary)] overflow-hidden shadow-2xl ring-1 ring-[var(--border-subtle)] transition-colors">
              {stream ? (
                <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover mirror" />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center bg-[var(--bg-secondary)] transition-colors">
                  <div className="h-24 w-24 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center border border-[var(--border-subtle)] transition-colors">
                    <VideoOff size={48} className="text-[var(--text-secondary)]/40" />
                  </div>
                  <p className="mt-4 text-[var(--text-secondary)] transition-colors">{error || "Camera is not available"}</p>
                  <Button onClick={startCamera} variant="outline" className="mt-4 border-[var(--border-subtle)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-all">
                    Retry Camera
                  </Button>
                </div>
              )}

              {/* Overlay Controls */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-[var(--bg-elevated)]/60 backdrop-blur-md p-2 rounded-2xl border border-[var(--border-subtle)] transition-colors">
                <button onClick={toggleMic} className={`flex h-12 w-12 items-center justify-center rounded-xl transition-colors ${isMicOn ? 'bg-[var(--bg-secondary)] hover:bg-[var(--bg-secondary)]/80' : 'bg-[var(--error-text)] hover:opacity-90'}`}>
                  {isMicOn ? <Mic size={20} className="text-[var(--text-primary)]" /> : <MicOff size={20} className="text-white" />}
                </button>
                <button onClick={toggleVideo} className={`flex h-12 w-12 items-center justify-center rounded-xl transition-colors ${isVideoOn ? 'bg-[var(--bg-secondary)] hover:bg-[var(--bg-secondary)]/80' : 'bg-[var(--error-text)] hover:opacity-90'}`}>
                  {isVideoOn ? <Video size={20} className="text-[var(--text-primary)]" /> : <VideoOff size={20} className="text-white" />}
                </button>
                <button className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--bg-secondary)] hover:bg-[var(--bg-secondary)]/80 transition-colors">
                  <Settings size={20} className="text-[var(--text-primary)]" />
                </button>
              </div>
            </div>
          </div>

          {/* Right: Meeting Info */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <Card className="bg-[var(--bg-elevated)] border-[var(--border-subtle)] p-8 text-[var(--text-primary)] transition-colors">
              <Badge variant="info" className="mb-4">Live Session</Badge>
              <h2 className="text-2xl font-bold mb-2 transition-colors">{safeSession.title}</h2>

              {/* Current link */}
              <p className="text-[var(--text-secondary)] mb-4 transition-colors">
                Meeting Link: <span className="text-[var(--text-primary)] font-medium ml-1 transition-colors">{currentLink || "No link available"}</span>
              </p>

              {/* Admin edit */}
              {isAdmin && !isEditingLink && (
                <button onClick={() => setIsEditingLink(true)} className="text-sm text-[var(--text-secondary)] hover:text-[var(--brand-solid)] mb-4 transition-colors">
                  Edit Meeting Link
                </button>
              )}
              {isAdmin && isEditingLink && (
                <div className="flex gap-2 mb-4">
                  <Input
                    value={editLinkValue}
                    onChange={e => setEditLinkValue(e.target.value)}
                    placeholder="https://meet.google.com/..."
                    className="flex-1 bg-[var(--bg-secondary)] border-[var(--border-subtle)] text-[var(--text-primary)] transition-colors"
                  />
                  <Button
                    onClick={handleSaveLink}
                    className="px-4 py-2 bg-[var(--brand-solid)] hover:opacity-90 text-white rounded-xl transition-all border-none"
                  >
                    Save
                  </Button>
                </div>
              )}

              {/* Status */}
              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)]"><Camera size={16} /> <span className="transition-colors">Camera: {isVideoOn ? 'Working' : 'Off'}</span></div>
                <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)]"><Mic size={16} /> <span className="transition-colors">Microphone: {isMicOn ? 'Working' : 'Off'}</span></div>
                <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)]"><Monitor size={16} /> <span className="transition-colors">Network: Stable</span></div>
              </div>

              {/* Join Button */}
              <Button
                onClick={() => {
                  // Stop the camera stream so Google Meet can use it
                  if (stream) {
                    stream.getTracks().forEach(track => track.stop());
                    setStream(null);
                    setIsVideoOn(false);
                    setIsMicOn(false);
                  }
                  window.open(currentLink, '_blank');
                }}
                className="w-full py-6 text-lg bg-[var(--brand-solid)] hover:opacity-90 border-none transition-all shadow-lg shadow-[var(--brand-solid)]/20 text-white"
              >
                Join Google Meeting
                <ExternalLink className="ml-2 h-5 w-5" />
              </Button>

              <p className="mt-4 text-center text-xs text-[var(--text-secondary)]/60 transition-colors">
                Clicking join will open the link in a new tab.
              </p>
            </Card>

            <Card className="bg-[var(--bg-elevated)]/50 border-[var(--border-subtle)]/50 p-6 text-[var(--text-primary)] transition-colors">
              <h4 className="font-semibold mb-3">Meeting Tips</h4>
              <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
                <li>• Find a quiet place for the session</li>
                <li>• Use headphones for better audio</li>
                <li>• Ensure your background is professional</li>
                <li>• Have your resume ready for sharing</li>
              </ul>
            </Card>
          </div>
        </div>
      </main>

      <style>{`
        .mirror {
          transform: scaleX(-1);
        }
      `}</style>
    </div>
  );
}
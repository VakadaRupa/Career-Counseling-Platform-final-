import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, Button, Input, Badge } from '../components/ui/BaseComponents';
import { User, Mail, Shield, Save, Camera, Video, VideoOff } from 'lucide-react';

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    bio: user?.bio || '',
    location: user?.location || ''
  });

  const [showCameraTest, setShowCameraTest] = useState(false);
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);

  const handleSave = (e) => {
    e.preventDefault();
    updateProfile({
      name: formData.name,
      bio: formData.bio,
      location: formData.location
    });
    alert('Profile updated successfully!');
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setShowCameraTest(true);
    } catch (err) {
      alert('Could not access camera: ' + err.message);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCameraTest(false);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-secondary)] transition-colors duration-300">

      
      <div className="h-48 w-full bg-[var(--brand-solid)] relative overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80&w=1200" 
          alt="Profile Banner" 
          className="h-full w-full object-cover opacity-50"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-secondary)] to-transparent" />
      </div>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8 -mt-24 relative z-10">
        <header className="mb-8 flex items-end justify-between">
          <div className="flex items-end gap-6">
            <div className="h-32 w-32 rounded-3xl bg-[var(--bg-elevated)] p-2 shadow-xl border border-[var(--border-subtle)] transition-colors">
              <div className="h-full w-full rounded-2xl bg-[var(--brand-solid)]/10 flex items-center justify-center text-[var(--brand-solid)] border border-[var(--brand-solid)]/10 overflow-hidden transition-colors">
                <img 
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name}`} 
                  alt={user?.name} 
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
            <div className="pb-2">
              <h1 className="text-3xl font-bold text-[var(--text-primary)] transition-colors">{user?.name}</h1>
              <p className="text-[var(--text-secondary)] flex items-center gap-2 transition-colors">
                <Badge variant="info" className="capitalize">{user?.role}</Badge>
                {formData.location && <span>• {formData.location}</span>}
              </p>
            </div>
          </div>
          <div className="pb-2">
            <Button variant="outline" onClick={showCameraTest ? stopCamera : startCamera} className="bg-[var(--bg-elevated)] text-[var(--text-primary)] border-[var(--border-subtle)] hover:bg-[var(--bg-secondary)] transition-all">
              {showCameraTest ? <VideoOff size={18} className="mr-2" /> : <Video size={18} className="mr-2" />}
              {showCameraTest ? 'Stop Camera Test' : 'Test Camera'}
            </Button>
          </div>
        </header>

        {showCameraTest && (
          <Card className="mb-8 overflow-hidden bg-black aspect-video relative shadow-2xl ring-1 ring-white/10">
            <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
            <div className="absolute bottom-4 left-4">
              <Badge variant="success">Camera Working</Badge>
            </div>
          </Card>
        )}

        <Card className="p-8 shadow-sm">
          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1 transition-colors">Full Name</label>
                <Input 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1 transition-colors">Email Address</label>
                <Input 
                  value={formData.email} 
                  disabled
                  className="bg-[var(--bg-secondary)] opacity-70 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1 transition-colors">Location</label>
                <Input 
                  value={formData.location} 
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1 transition-colors">Account Security</label>
                <div className="flex items-center gap-2 h-10 px-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-secondary)] text-sm text-[var(--text-secondary)] transition-colors">
                  <Shield size={16} />
                  <span>Verified Account</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1 transition-colors">Professional Bio</label>
              <textarea 
                className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-3 text-sm text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--brand-solid)]/20 focus:border-[var(--brand-solid)] focus:outline-none transition-all placeholder:text-[var(--text-secondary)]/50"
                rows={4}
                value={formData.bio}
                onChange={(e) => setFormData({...formData, bio: e.target.value})}
              />
            </div>



            <div className="flex justify-end pt-4">
              <Button type="submit" className="bg-[var(--brand-solid)] border-none">
                <Save size={18} className="mr-2" />
                Save Changes
              </Button>
            </div>
          </form>
        </Card>


      </main>
    </div>
  );
}

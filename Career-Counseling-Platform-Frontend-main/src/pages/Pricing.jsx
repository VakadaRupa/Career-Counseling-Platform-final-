import React, { useState, useRef } from 'react';

import { Card, Button, Badge, Input } from '../components/ui/BaseComponents';
import { Check, Star, Zap, Shield, QrCode, Upload, X, Info, CreditCard, Edit3, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePricing } from '../context/PricingContext';
import { motion, AnimatePresence } from 'motion/react';

export default function Pricing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { plans, qrCode, updatePlanPrice, updateQrCode } = usePricing();
  const isAdmin = user?.role === 'admin';
  const fileInputRef = useRef(null);

  const [showPaymentModal, setShowPaymentModal] = useState(null);
  const [editingPrice, setEditingPrice] = useState(null); // ID of the plan being edited
  const [tempPrice, setTempPrice] = useState('');

  const handleQrUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateQrCode(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpgrade = (plan) => {
    if (plan.price === '0') return;
    setShowPaymentModal(plan);
  };

  const confirmPayment = () => {
    alert('Payment verification initiated! Our team will review your transaction.');
    setShowPaymentModal(null);
    navigate('/dashboard');
  };

  const startEditingPrice = (plan) => {
    setEditingPrice(plan.id);
    setTempPrice(plan.price);
  };

  const savePrice = (id) => {
    updatePlanPrice(id, tempPrice);
    setEditingPrice(null);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-secondary)] transition-colors duration-300">

      <main className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge variant="info" className="mb-4 px-4 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-[0.2em]">
              Flexible Plans
            </Badge>
            <h1 className="text-5xl md:text-6xl font-black tracking-tight text-[var(--text-primary)] mb-6 transition-colors">
              Invest in your <span className="text-[var(--brand-solid)] italic serif">Future.</span>
            </h1>
            <p className="max-w-2xl mx-auto text-lg text-[var(--text-secondary)] leading-relaxed transition-colors">
              Choose a plan that fits your career goals. Unlock premium features and expert guidance to accelerate your growth.
            </p>
          </motion.div>
        </div>

        {/* Admin Controls Section */}
        {isAdmin && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-16 p-8 rounded-[2.5rem] bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-2xl relative overflow-hidden group border border-[var(--border-subtle)] transition-colors"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--brand-solid)]/20 blur-[100px] rounded-full -mr-32 -mt-32" />
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex items-center gap-6">
                <div className="h-16 w-16 rounded-2xl bg-[var(--brand-solid)]/10 flex items-center justify-center border border-[var(--brand-solid)]/10 transition-colors">
                  <QrCode size={32} className="text-[var(--brand-solid)]" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-1">Admin: Pricing & QR Management</h3>
                  <p className="text-[var(--text-secondary)] text-sm transition-colors">Update plan costs and the official payment QR code.</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-24 w-24 rounded-xl bg-white p-2 shadow-inner transition-colors">
                  <img src={qrCode} alt="Current QR" className="h-full w-full object-contain" />
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleQrUpload}
                  className="hidden"
                  accept="image/*"
                />
                <Button
                  onClick={() => fileInputRef.current.click()}
                  className="bg-[var(--brand-solid)] hover:opacity-90 text-white rounded-2xl px-6 py-3 flex items-center gap-2 border-none"
                >
                  <Upload size={18} />
                  Change QR Code
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3 items-end">
          {plans.map((plan, idx) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
            >
              <Card className={`relative flex flex-col overflow-hidden transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 border border-[var(--border-subtle)] rounded-[3rem] ${plan.popular ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] ring-4 ring-[var(--brand-solid)]/20 h-[110%]' : 'bg-[var(--bg-elevated)] text-[var(--text-primary)]'
                }`}>
                <div className="p-10 flex-1 flex flex-col">
                  {plan.popular && (
                    <div className="absolute top-8 right-8">
                      <Badge className="bg-[var(--brand-solid)] text-white border-none px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                        Most Popular
                      </Badge>
                    </div>
                  )}

                  <div className="mb-10">
                    <p className={`text-[10px] font-black uppercase tracking-[0.3em] mb-4 ${plan.popular ? 'text-[var(--brand-solid)]' : 'text-[var(--text-secondary)]'} transition-colors`}>
                      {plan.name} Plan
                    </p>
                    <div className="flex items-baseline gap-1 mb-4">
                      <span className="text-5xl font-black tracking-tighter transition-colors">
                        {editingPrice === plan.id ? (
                          <div className="flex items-center gap-2">
                            <span className="text-3xl">$</span>
                            <input
                              type="text"
                              value={tempPrice}
                              onChange={(e) => setTempPrice(e.target.value)}
                              className="w-24 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-xl px-3 py-1 text-3xl font-black text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-solid)]"
                            />
                          </div>
                        ) : (
                          `$${plan.price}`
                        )}
                      </span>
                      <span className={`text-sm font-bold text-[var(--text-secondary)] transition-colors`}>/month</span>

                      {isAdmin && (
                        <div className="ml-auto">
                          {editingPrice === plan.id ? (
                            <button onClick={() => savePrice(plan.id)} className="p-2 text-[var(--brand-solid)] hover:opacity-80">
                              <Save size={18} />
                            </button>
                          ) : (
                            <button onClick={() => startEditingPrice(plan)} className="p-2 text-[var(--text-secondary)] hover:text-[var(--brand-solid)]">
                              <Edit3 size={18} />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    <p className="text-sm leading-relaxed text-[var(--text-secondary)] transition-colors">
                      {plan.description}
                    </p>

                    {plan.price !== '0' && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mt-6 p-4 rounded-2xl flex items-center gap-4 transition-all duration-300 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] hover:bg-[var(--bg-secondary)]/80"
                      >
                        <div className="h-16 w-16 bg-white p-1 rounded-lg shrink-0 shadow-sm transition-colors">
                          <img src={qrCode} alt="Pay QR" className="h-full w-full object-contain" referrerPolicy="no-referrer" />
                        </div>
                        <div className="text-left">
                          <p className={`text-[10px] font-black uppercase tracking-widest mb-1 text-[var(--brand-solid)]`}>
                            Scan to Pay
                          </p>
                          <p className="text-[9px] leading-tight font-medium text-[var(--text-secondary)]/60">
                            Pay ${plan.price} instantly via QR and click below to verify.
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  <div className={`h-px w-full mb-10 bg-[var(--border-subtle)] transition-colors`} />

                  <ul className="flex-1 space-y-5 mb-10">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-4 text-sm font-medium">
                        <div className={`mt-0.5 h-5 w-5 rounded-full flex items-center justify-center shrink-0 bg-[var(--success-bg)] text-[var(--success-text)] transition-colors`}>
                          <Check size={12} strokeWidth={3} />
                        </div>
                        <span className="text-[var(--text-secondary)]">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    variant={plan.variant}
                    className={`w-full py-8 rounded-[2rem] font-black uppercase tracking-widest text-xs transition-all duration-300 ${plan.popular
                        ? 'bg-[var(--brand-solid)] hover:opacity-90 text-white shadow-xl shadow-[var(--brand-solid)]/20 border-none'
                        : 'bg-[var(--bg-secondary)] hover:bg-[var(--bg-secondary)]/80 text-[var(--text-primary)] border border-[var(--border-subtle)]'
                      }`}
                    onClick={() => handleUpgrade(plan)}
                    disabled={plan.price === '0'}
                  >
                    {plan.buttonText}
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>


      </main>

      {/* Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPaymentModal(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-[3rem] shadow-2xl overflow-hidden transition-colors"
            >
              <div className="p-8 md:p-12">
                <button
                  onClick={() => setShowPaymentModal(null)}
                  className="absolute top-8 right-8 p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] rounded-full transition-all"
                >
                  <X size={24} />
                </button>

                <div className="text-center mb-10">
                  <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-[var(--brand-solid)]/10 text-[var(--brand-solid)] mb-6 transition-colors">
                    <CreditCard size={32} />
                  </div>
                  <h2 className="text-3xl font-black text-[var(--text-primary)] mb-2 transition-colors">Complete Payment</h2>
                  <p className="text-[var(--text-secondary)] transition-colors">Scan the QR code below to pay for the <span className="font-bold text-[var(--text-primary)]">{showPaymentModal.name}</span> plan.</p>
                </div>

                <div className="flex flex-col items-center gap-8">
                  <div className="relative p-6 bg-[var(--bg-secondary)] rounded-[2.5rem] border-2 border-dashed border-[var(--border-subtle)] transition-colors">
                    <div className="bg-white p-4 rounded-2xl shadow-lg transition-colors">
                      <img src={qrCode} alt="Payment QR" className="w-48 h-48 object-contain" />
                    </div>
                    <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-[var(--text-primary)] text-[var(--bg-primary)] px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest transition-colors">
                      Scan to Pay
                    </div>
                  </div>

                  <div className="w-full space-y-4">
                    <div className="p-4 rounded-2xl bg-[var(--warning-bg)] border border-[var(--warning-text)]/10 flex gap-3 transition-colors">
                      <Info className="text-[var(--warning-text)] shrink-0" size={20} />
                      <p className="text-xs text-[var(--warning-text)] leading-relaxed">
                        After payment, please click the button below. Our team will verify the transaction and upgrade your account within 24 hours.
                      </p>
                    </div>

                    <Button
                      className="w-full py-8 rounded-2xl bg-[var(--brand-solid)] text-white font-black uppercase tracking-widest text-xs hover:opacity-90 shadow-xl shadow-[var(--brand-solid)]/20 transition-all border-none"
                      onClick={confirmPayment}
                    >
                      I've Made the Payment
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

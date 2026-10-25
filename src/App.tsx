import React, { useState, useEffect } from 'react';
import { PhoneSimulator } from './components/PhoneSimulator';
import { TalkBackInspector } from './components/TalkBackInspector';
import { momoService } from './services/momoService';
import { voiceService } from './services/voiceService';
import {
  MoMoAccount,
  TalkBackAnnouncement,
  TransactionRecord,
} from './types/momo';

export default function App() {
  const [account, setAccount] = useState<MoMoAccount>(momoService.getAccount());
  const [transactions, setTransactions] = useState<TransactionRecord[]>(momoService.getTransactions());
  const [talkBackAnnouncements, setTalkBackAnnouncements] = useState<TalkBackAnnouncement[]>([]);
  const [screenCurtainActive, setScreenCurtainActive] = useState<boolean>(false);
  const [highContrastActive, setHighContrastActive] = useState<boolean>(false);
  const [fontScale, setFontScale] = useState<number>(1.0);
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(false);

  // Register listener for all spoken utterances
  useEffect(() => {
    const unsubSpeech = voiceService.registerAnnouncementListener((text, priority) => {
      const newEntry: TalkBackAnnouncement = {
        id: `ann-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        text,
        priority,
        timestamp: new Date().toLocaleTimeString(),
        source: 'TalkBack / TextToSpeech',
      };
      setTalkBackAnnouncements((prev) => [newEntry, ...prev]);
    });

    return unsubSpeech;
  }, []);

  const handleAccountUpdate = (updated: MoMoAccount) => {
    setAccount(updated);
  };

  const handleNewTransaction = (tx: TransactionRecord) => {
    setTransactions(momoService.getTransactions());
  };

  return (
    <div
      className={`min-h-screen w-full flex items-center justify-center p-0 sm:p-4 md:p-6 transition-colors ${
        highContrastActive ? 'bg-black text-amber-300' : 'bg-slate-950 text-slate-100'
      }`}
    >
      {/* Mobile App Viewport */}
      <div className="w-full sm:max-w-[420px] h-[100dvh] sm:h-auto flex flex-col justify-center">
        <PhoneSimulator
          account={account}
          onAccountUpdate={handleAccountUpdate}
          onNewTransaction={handleNewTransaction}
          screenCurtainActive={screenCurtainActive}
          highContrastActive={highContrastActive}
          fontScale={fontScale}
          onOpenAccessDrawer={() => setIsInspectorOpen(true)}
        />
      </div>

      {/* Small MTN MoMo Access Button & Optimized Accessibility Drawer */}
      <TalkBackInspector
        announcements={talkBackAnnouncements}
        onClearAnnouncements={() => setTalkBackAnnouncements([])}
        screenCurtainActive={screenCurtainActive}
        onToggleScreenCurtain={() => setScreenCurtainActive((prev) => !prev)}
        highContrastActive={highContrastActive}
        onToggleHighContrast={() => setHighContrastActive((prev) => !prev)}
        fontScale={fontScale}
        onFontScaleChange={(scale) => setFontScale(scale)}
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
        onOpen={() => setIsInspectorOpen(true)}
      />
    </div>
  );
}

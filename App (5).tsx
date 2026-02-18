import React, { useState, useRef, useEffect } from 'react';
import { Upgrade, FloatingText, GeodeResult, DepositRequest, WithdrawalRequest, BankDetails } from './types';
import { INITIAL_UPGRADES, GEODE_CHANCE } from './constants';
import MiningArea from './components/MiningArea';
import { UpgradeCard } from './components/UpgradeCard';
import GeodeAnalyzer from './components/GeodeAnalyzer';
import { AdminPanel } from './components/AdminPanel';
import { 
  Coins, Zap, Trophy, TrendingUp, AlertCircle, Pickaxe, Wallet, Users, 
  Calendar, Gift, ExternalLink, Copy, X, Upload, CheckCircle, 
  Lock, LayoutDashboard, Headphones, ShieldCheck, History, ArrowDownLeft, ArrowUpRight
} from 'lucide-react';

type Tab = 'dashboard' | 'mine' | 'withdraw' | 'history' | 'referrals' | 'bonus' | 'admin';

const GOLD_TO_NGN_RATE = 0.28;
const MIN_WITHDRAWAL_GOLD = 5000;

const SLIDESHOW_IMAGES = [
  "https://imagizer.imageshack.com/img924/4245/AiIICh.png",
  "https://imagizer.imageshack.com/img924/1168/AbESf9.png",
  "https://imagizer.imageshack.com/img923/8950/Jk2rRq.png",
  "https://imagizer.imageshack.com/img923/9364/Bx9ya4.png"
];

const FloatingSlideshow: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % SLIDESHOW_IMAGES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full mb-8 flex justify-center px-2">
      <div className="relative w-full max-w-2xl aspect-[16/9] group animate-float-banner">
        <div className="absolute inset-0 bg-yellow-500/20 blur-3xl rounded-full opacity-50 group-hover:opacity-75 transition-opacity"></div>
        {SLIDESHOW_IMAGES.map((url, idx) => (
          <img 
            key={url}
            src={url} 
            alt={`Crest Gold Promo ${idx + 1}`} 
            className={`absolute inset-0 w-full h-full rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-4 border-yellow-500/30 object-cover transition-opacity duration-1000 z-10 ${idx === currentIndex ? 'opacity-100' : 'opacity-0'}`}
          />
        ))}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  // User Identity
  const [userId] = useState<string>(() => 'USER_' + Math.floor(10000 + Math.random() * 90000));
  
  // Platform State (Simulated)
  const [userCount, setUserCount] = useState<number>(3482); 
  
  useEffect(() => {
    // Simulate live platform growth
    const interval = setInterval(() => {
        if (Math.random() > 0.6) {
            setUserCount(prev => prev + 1);
        }
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Financial State
  const [cashBalance, setCashBalance] = useState<number>(0); 
  const [referralEarnings, setReferralEarnings] = useState<number>(0); 
  const [credits, setCredits] = useState<number>(0); 
  const [totalMined, setTotalMined] = useState<number>(0);
  const [clickPower, setClickPower] = useState<number>(0); 
  const [upgrades, setUpgrades] = useState<Upgrade[]>(INITIAL_UPGRADES);
  const [geodesFound, setGeodesFound] = useState<number>(0);
  const [hasDeposited, setHasDeposited] = useState<boolean>(false); 
  
  // Referral Logic
  const [hasReceivedFirstRefBonus, setHasReceivedFirstRefBonus] = useState<boolean>(false);

  // Daily Limit State
  const [dailyMined, setDailyMined] = useState<number>(0);
  const [lastMineDate, setLastMineDate] = useState<string>(new Date().toDateString());

  // Navigation & UI
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [dailyClaimed, setDailyClaimed] = useState(false);
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const nextTextId = useRef(0);

  // Modals & Popups
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [pendingUpgradeId, setPendingUpgradeId] = useState<string | null>(null);
  const [depositFile, setDepositFile] = useState<File | null>(null);
  const [depositStatus, setDepositStatus] = useState<'idle' | 'pending'>('idle');
  const [showDepositSuccess, setShowDepositSuccess] = useState(false);
  const [depositErrorMessage, setDepositErrorMessage] = useState<string | null>(null);
  
  // Withdrawal
  const [withdrawGoldAmount, setWithdrawGoldAmount] = useState<string>('');
  const [withdrawBankDetails, setWithdrawBankDetails] = useState<BankDetails>({
      bankName: '',
      accountNumber: '',
      accountName: ''
  });
  const [includeReferralEarnings, setIncludeReferralEarnings] = useState(false);
  const [showWithdrawalSuccess, setShowWithdrawalSuccess] = useState(false);
  const [showWithdrawalError, setShowWithdrawalError] = useState(false);
  const [withdrawalErrorMessage, setWithdrawalErrorMessage] = useState('');

  // Admin Security
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPin, setAdminPin] = useState('');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);

  // Persistence/Admin Data
  const [depositRequests, setDepositRequests] = useState<DepositRequest[]>([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [showCopiedPopup, setShowCopiedPopup] = useState(false);

  const hasActiveMiners = upgrades.some(u => u.count > 0);

  const getDailyLimit = () => {
    return upgrades.reduce((acc, u) => acc + (u.count * (u.dailyLimit || 0)), 0);
  };

  const dailyLimit = getDailyLimit();
  
  useEffect(() => {
    const today = new Date().toDateString();
    if (today !== lastMineDate) {
        setDailyMined(0);
        setLastMineDate(today);
        setDailyClaimed(false);
    }
  }, [lastMineDate]);

  const handleMine = (e: React.MouseEvent) => {
    if (!hasActiveMiners) return; 

    if (dailyMined >= dailyLimit) {
        spawnFloatingText(e.clientX, e.clientY, "LIMIT REACHED", "text-red-500 font-black");
        return;
    }

    const remaining = dailyLimit - dailyMined;
    const actualGain = Math.min(clickPower, remaining);

    setCredits(prev => prev + actualGain);
    setTotalMined(prev => prev + actualGain);
    setDailyMined(prev => prev + actualGain);

    if (Math.random() < GEODE_CHANCE) {
      setGeodesFound(prev => prev + 1);
      spawnFloatingText(e.clientX, e.clientY, "GEODE FOUND!", "text-yellow-400 scale-125");
    } else {
      spawnFloatingText(e.clientX, e.clientY, `+${Math.floor(actualGain)}`, "text-yellow-200");
    }
  };

  const spawnFloatingText = (x: number, y: number, text: string, colorClass: string) => {
    const id = nextTextId.current++;
    const offsetX = (Math.random() - 0.5) * 40; 
    const offsetY = (Math.random() - 0.5) * 40 - 20;
    setFloatingTexts(prev => [...prev, { id, text, x: x + offsetX, y: y + offsetY }]);
    setTimeout(() => {
      setFloatingTexts(prev => prev.filter(ft => ft.id !== id));
    }, 800);
  };

  const handleAdminAccess = () => {
    if (isAdminAuthenticated) {
        setActiveTab(activeTab === 'admin' ? 'dashboard' : 'admin');
    } else {
        setShowAdminLogin(true);
    }
  };

  const handleAdminLoginSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (adminPin === '2011') {
          setIsAdminAuthenticated(true);
          setShowAdminLogin(false);
          setActiveTab('admin');
          setAdminPin('');
      } else {
          setAdminPin('');
      }
  };

  const handleCustomerSupport = () => {
    window.open('https://t.me/Crestgoldsupport', '_blank');
  };

  const buyUpgrade = (id: string) => {
    const upgradeIndex = upgrades.findIndex(u => u.id === id);
    if (upgradeIndex === -1) return;
    const upgrade = upgrades[upgradeIndex];
    
    if (upgrade.currency === 'NGN') {
      if (cashBalance >= upgrade.price) {
        setCashBalance(prev => prev - upgrade.price);
        performUpgrade(upgradeIndex);
      } else {
        const today = new Date().setHours(0,0,0,0);
        const hasExistingToday = depositRequests.some(r => 
            r.minerId === id && 
            new Date(r.timestamp).setHours(0,0,0,0) === today &&
            (r.status === 'pending' || r.status === 'approved')
        );

        if (hasExistingToday) {
            setDepositErrorMessage("You can only deposit for each miner once per day.");
            setShowDepositModal(true); 
            return;
        }

        setDepositErrorMessage(null);
        setPendingUpgradeId(id);
        setShowDepositModal(true);
      }
      return;
    }

    const cost = Math.floor(upgrade.price * Math.pow(upgrade.costMultiplier, upgrade.count));
    if (credits >= cost) {
      setCredits(prev => prev - cost);
      performUpgrade(upgradeIndex);
    }
  };

  const performUpgrade = (index: number) => {
    const newUpgrades = [...upgrades];
    const upgrade = newUpgrades[index];
    newUpgrades[index] = { ...upgrade, count: upgrade.count + 1 };
    setUpgrades(newUpgrades);
    setClickPower(prev => prev + upgrade.basePower);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setDepositFile(e.target.files[0]);
    }
  };

  const submitDeposit = () => {
    if (!depositFile || !pendingUpgradeId) return;
    const upgrade = upgrades.find(u => u.id === pendingUpgradeId);
    if (!upgrade) return;

    setDepositStatus('pending');

    const newRequest: DepositRequest = {
      id: Math.random().toString(36).substr(2, 9).toUpperCase(),
      userId: userId, 
      minerId: pendingUpgradeId,
      minerName: upgrade.name,
      amount: upgrade.price,
      timestamp: Date.now(),
      proofImage: depositFile,
      status: 'pending'
    };

    setTimeout(() => {
      setDepositRequests(prev => [...prev, newRequest]);
      setShowDepositModal(false);
      setDepositStatus('idle');
      setDepositFile(null);
      setPendingUpgradeId(null);
      setShowDepositSuccess(true);
    }, 1500);
  };

  const handleWithdrawalSubmit = () => {
    const goldAmount = parseInt(withdrawGoldAmount);
    if (isNaN(goldAmount) || goldAmount < MIN_WITHDRAWAL_GOLD) {
        setWithdrawalErrorMessage(`Minimum withdrawal is ${MIN_WITHDRAWAL_GOLD} Gold.`);
        setShowWithdrawalError(true);
        return;
    }
    if (goldAmount > credits) {
        setWithdrawalErrorMessage("Insufficient Gold balance.");
        setShowWithdrawalError(true);
        return;
    }
    if (!withdrawBankDetails.accountName || !withdrawBankDetails.accountNumber || !withdrawBankDetails.bankName) {
        setWithdrawalErrorMessage("Please complete all bank fields.");
        setShowWithdrawalError(true);
        return;
    }

    const goldValueInNgn = goldAmount * GOLD_TO_NGN_RATE;
    const referralNgnToWithdraw = includeReferralEarnings ? referralEarnings : 0;
    const totalNgnPayout = goldValueInNgn + referralNgnToWithdraw;

    setCredits(prev => prev - goldAmount);
    if (includeReferralEarnings) setReferralEarnings(0);

    const newRequest: WithdrawalRequest = {
        id: Math.random().toString(36).substr(2, 9).toUpperCase(),
        userId: userId,
        amountGold: goldAmount,
        amountReferralNgn: referralNgnToWithdraw,
        totalNgnValue: totalNgnPayout,
        bankDetails: { ...withdrawBankDetails },
        timestamp: Date.now(),
        status: 'pending'
    };

    setWithdrawalRequests(prev => [...prev, newRequest]);
    setShowWithdrawalSuccess(true);
    setWithdrawGoldAmount('');
    setIncludeReferralEarnings(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setShowCopiedPopup(true);
    setTimeout(() => setShowCopiedPopup(false), 2000);
  };

  const handleDailyClaim = () => {
    if (dailyClaimed) return;
    setCredits(prev => prev + 30);
    setDailyClaimed(true);
  };

  // --- Views ---

  const DashboardView = () => (
    <div className="h-full flex flex-col p-6 bg-slate-900 pb-24 overflow-y-auto animate-in fade-in duration-500">
         <FloatingSlideshow />
         <div className="mb-8 flex justify-between items-center">
           <div>
             <h2 className="text-3xl font-black text-white tracking-tight italic uppercase">Dashboard</h2>
             <p className="text-slate-400 text-sm font-medium">Miner ID: <span className="font-mono text-yellow-500">{userId}</span></p>
           </div>
           <button onClick={handleCustomerSupport} className="bg-slate-800 p-3 rounded-2xl text-blue-400 border border-slate-700 hover:bg-slate-700 transition-all">
             <Headphones size={24} />
           </button>
         </div>

         <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gradient-to-br from-green-950/40 to-slate-900 border border-green-800/50 rounded-2xl p-5 shadow-xl">
               <span className="text-green-400 text-[10px] font-black uppercase tracking-widest block mb-2">Deposit Balance</span>
               <span className="text-2xl font-black text-white">₦{cashBalance.toLocaleString()}</span>
            </div>
             <div className="bg-gradient-to-br from-blue-950/40 to-slate-900 border border-blue-800/50 rounded-2xl p-5 shadow-xl">
               <span className="text-blue-400 text-[10px] font-black uppercase tracking-widest block mb-2">Ref Earnings</span>
               <span className="text-2xl font-black text-white">₦{referralEarnings.toLocaleString()}</span>
            </div>
         </div>

         <div className="bg-gradient-to-br from-slate-800 to-slate-950 border border-slate-700 rounded-3xl p-7 relative overflow-hidden shadow-2xl mb-8">
            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
            <div className="flex flex-col relative z-10">
               <span className="text-slate-500 text-xs font-black uppercase tracking-widest mb-3">Available Gold</span>
               <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-5xl font-black text-white tracking-tighter">{Math.floor(credits).toLocaleString()}</span>
                  <span className="text-lg text-yellow-500 font-black">GOLD</span>
               </div>
               <div className="h-1 w-full bg-slate-800 rounded-full mt-4 overflow-hidden">
                  <div className="h-full bg-yellow-500" style={{ width: '65%' }}></div>
               </div>
               <p className="text-xs text-yellow-600 font-bold mt-4 flex items-center gap-1">
                 <TrendingUp size={12} /> Approx. Value: ₦{Math.floor(credits * GOLD_TO_NGN_RATE).toLocaleString()}
               </p>
            </div>
            <div className="absolute bottom-7 right-7 opacity-20 text-yellow-500">
               <Coins size={80} />
            </div>
         </div>

         <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-black text-white flex items-center gap-2 italic uppercase">
              <Zap size={20} className="text-yellow-500 fill-yellow-500"/> Active Fleet
            </h3>
            <button onClick={() => setActiveTab('mine')} className="text-xs text-yellow-500 font-bold hover:underline">Market</button>
         </div>
         
         <div className="space-y-4 mb-8">
            {upgrades.filter(u => u.count > 0).length === 0 ? (
                <div className="text-center py-12 bg-slate-800/30 rounded-3xl border border-dashed border-slate-700">
                    <Pickaxe size={32} className="mx-auto mb-3 text-slate-600" />
                    <p className="text-slate-500 font-bold">No Active Miners</p>
                    <button onClick={() => setActiveTab('mine')} className="text-yellow-500 text-sm font-bold mt-2">Deploy First Miner</button>
                </div>
            ) : (
                upgrades.filter(u => u.count > 0).map(miner => (
                    <div key={miner.id} className="bg-slate-800/80 border border-slate-700 p-5 rounded-2xl flex items-center gap-5 shadow-lg group hover:border-yellow-500/50 transition-all">
                        <div className="w-14 h-14 bg-slate-900 rounded-xl flex items-center justify-center text-3xl shadow-inner group-hover:scale-110 transition-transform">
                            {miner.icon}
                        </div>
                        <div className="flex-1">
                            <h4 className="font-black text-white uppercase text-sm tracking-wide">{miner.name}</h4>
                            <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 font-bold">
                                <span className="text-yellow-500">Lvl {miner.count}</span>
                                <span className="w-1 h-1 bg-slate-700 rounded-full"></span>
                                <span className="text-green-400">+{miner.basePower * miner.count} Power</span>
                            </div>
                        </div>
                        <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.6)] animate-pulse"></div>
                    </div>
                ))
            )}
         </div>

         <div className="mt-auto space-y-3">
             <button 
                onClick={() => window.open('https://chat.whatsapp.com/KbGDUWqqXpE44MTJNHIJBG', '_blank')}
                className="w-full bg-green-600 hover:bg-green-500 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-green-900/20 uppercase tracking-widest text-xs"
            >
                <Users size={20} /> Community Group
            </button>
         </div>
      </div>
  );

  const MineView = () => (
    <div className="flex flex-col md:flex-row h-full overflow-hidden relative pb-16 md:pb-0">
        <div className="absolute inset-0 pointer-events-none z-[100] overflow-hidden">
          {floatingTexts.map(ft => (
            <div
              key={ft.id}
              className={`absolute font-black text-2xl pointer-events-none select-none transition-all duration-800 animate-float-up ${ft.text.includes("GEODE") ? "text-yellow-400 text-3xl drop-shadow-[0_0_10px_rgba(234,179,8,0.8)]" : "text-white"}`}
              style={{ left: ft.x, top: ft.y }}
            >
              {ft.text}
            </div>
          ))}
        </div>

        <div className="hidden lg:flex w-[380px] bg-slate-950 border-r border-slate-800 flex-col z-10 p-6 overflow-y-auto">
            <h2 className="font-black text-xl text-white mb-6 uppercase italic tracking-tighter">Market</h2>
            {upgrades.map(upgrade => {
               const cost = upgrade.currency === 'CREDITS' ? Math.floor(upgrade.price * Math.pow(upgrade.costMultiplier, upgrade.count)) : upgrade.price;
               const canAfford = upgrade.currency === 'NGN' ? cashBalance >= upgrade.price : credits >= cost;
               return <UpgradeCard key={upgrade.id} upgrade={upgrade} canAfford={canAfford} onBuy={buyUpgrade}/>;
            })}
        </div>

        <div className="flex-1 flex flex-col relative overflow-hidden bg-black">
           <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-yellow-900/10 via-black to-black opacity-60"></div>
           
           <div className="absolute top-6 left-0 right-0 z-20 flex flex-col items-center px-6">
             {/* FloatingBanner/Slideshow removed from miner section per request */}
             {hasActiveMiners && (
                <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-700 rounded-2xl p-4 flex flex-col items-center gap-2 shadow-2xl w-full max-w-sm">
                    <div className="flex justify-between w-full text-[10px] text-slate-500 font-black uppercase tracking-widest">
                        <span>Daily Capacity</span>
                        <span className={dailyMined >= dailyLimit ? "text-red-500" : "text-yellow-500"}>
                            {Math.floor(dailyMined).toLocaleString()} / {dailyLimit.toLocaleString()}
                        </span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div 
                            className={`h-full transition-all duration-500 ${dailyMined >= dailyLimit ? "bg-red-500" : "bg-gradient-to-r from-yellow-600 to-yellow-400"}`}
                            style={{ width: `${Math.min(100, (dailyMined / dailyLimit) * 100)}%` }}
                        ></div>
                    </div>
                </div>
             )}
           </div>

           <div className="flex-1 relative z-10">
             <MiningArea 
                onMine={handleMine} 
                clickPower={clickPower} 
                miningInProgress={false}
                isLocked={!hasActiveMiners}
                isLimitReached={hasActiveMiners && dailyMined >= dailyLimit}
             />
           </div>
           
           <div className="lg:hidden h-1/2 bg-slate-900 overflow-y-auto p-6 border-t border-slate-800 pb-28">
              <h3 className="text-white font-black mb-4 uppercase tracking-widest italic text-sm">Deploy Miners</h3>
              {upgrades.map(upgrade => {
                 const cost = upgrade.currency === 'CREDITS' ? Math.floor(upgrade.price * Math.pow(upgrade.costMultiplier, upgrade.count)) : upgrade.price;
                 const canAfford = upgrade.currency === 'NGN' ? cashBalance >= upgrade.price : credits >= cost;
                 return <UpgradeCard key={upgrade.id} upgrade={upgrade} canAfford={canAfford} onBuy={buyUpgrade}/>;
              })}
           </div>
        </div>

        <div className="hidden xl:flex w-[380px] bg-slate-950 border-l border-slate-800 flex-col z-10 p-6 overflow-y-auto">
           <GeodeAnalyzer geodeCount={geodesFound} onAnalyzeComplete={(r) => {
               setCredits(prev => prev + r.value);
               setTotalMined(prev => prev + r.value);
               setGeodesFound(prev => prev - 1);
           }}/>
        </div>
    </div>
  );

  const HistoryView = () => (
    <div className="h-full flex flex-col p-6 bg-slate-900 pb-24 overflow-y-auto animate-in fade-in duration-500">
        <FloatingSlideshow />
        <h2 className="text-3xl font-black text-white mb-8 tracking-tight italic uppercase">Transaction History</h2>
        
        <div className="space-y-8">
            <div>
                <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                   <ArrowDownLeft size={14} className="text-green-500" /> Total Deposits
                </h3>
                {depositRequests.length === 0 ? (
                    <div className="bg-slate-800/30 border border-dashed border-slate-700 p-8 rounded-2xl text-center">
                        <p className="text-slate-500 text-sm">No deposit history yet.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {depositRequests.map(req => (
                            <div key={req.id} className="bg-slate-800/80 border border-slate-700 p-4 rounded-2xl flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-slate-900 rounded-xl text-green-500"><ArrowDownLeft size={20}/></div>
                                    <div>
                                        <p className="text-white font-black text-sm uppercase">{req.minerName}</p>
                                        <p className="text-[10px] text-slate-500 font-mono uppercase">{new Date(req.timestamp).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-white font-black">₦{req.amount.toLocaleString()}</p>
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${
                                        req.status === 'approved' ? 'text-green-500' : req.status === 'declined' ? 'text-red-500' : 'text-yellow-500'
                                    }`}>
                                        {req.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div>
                <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                   <ArrowUpRight size={14} className="text-red-500" /> Total Withdrawals
                </h3>
                {withdrawalRequests.length === 0 ? (
                    <div className="bg-slate-800/30 border border-dashed border-slate-700 p-8 rounded-2xl text-center">
                        <p className="text-slate-500 text-sm">No withdrawal history yet.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {withdrawalRequests.map(req => (
                            <div key={req.id} className="bg-slate-800/80 border border-slate-700 p-4 rounded-2xl flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-slate-900 rounded-xl text-red-500"><ArrowUpRight size={20}/></div>
                                    <div>
                                        <p className="text-white font-black text-sm uppercase">Payout</p>
                                        <p className="text-[10px] text-slate-500 font-mono uppercase">{new Date(req.timestamp).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-white font-black">₦{req.totalNgnValue.toLocaleString()}</p>
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${
                                        req.status === 'approved' ? 'text-green-500' : req.status === 'declined' ? 'text-red-500' : 'text-yellow-500'
                                    }`}>
                                        {req.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    </div>
  );

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-950 text-slate-200 font-sans selection:bg-yellow-500/30">
      
      {/* Header */}
      <header className="h-20 border-b border-slate-800 bg-slate-900/90 backdrop-blur-xl flex items-center justify-between px-8 z-[60] shadow-2xl shrink-0">
        <div className="flex items-center gap-3">
           <div className="bg-yellow-500 p-2.5 rounded-2xl shadow-lg shadow-yellow-500/20 rotate-3 group hover:rotate-12 transition-transform">
              <Pickaxe size={24} className="text-black" />
           </div>
           <div>
             <h1 className="font-black text-xl leading-none tracking-tighter text-white italic uppercase">Crest Gold</h1>
             <span className="text-[10px] text-yellow-500 font-black uppercase tracking-widest">Enterprise Mining</span>
           </div>
        </div>
        
        <div className="flex items-center gap-8">
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-2 text-white font-black text-2xl tracking-tighter">
              <span className="text-yellow-500 font-serif">₦</span>
              <span>{Math.floor(credits * GOLD_TO_NGN_RATE).toLocaleString()}</span>
            </div>
          </div>
          <button 
             onClick={handleAdminAccess}
             className={`p-3 rounded-2xl transition-all ${
               isAdminAuthenticated ? 'bg-green-500/10 text-green-500 border border-green-500/30' : 'bg-slate-800 text-slate-500 border border-slate-700'
             }`}
          >
             {isAdminAuthenticated ? <ShieldCheck size={20} /> : <Lock size={20} />}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative">
        {activeTab === 'dashboard' && <DashboardView />}
        {activeTab === 'mine' && <MineView />}
        {activeTab === 'history' && <HistoryView />}
        {activeTab === 'withdraw' && (
            <div className="h-full flex flex-col items-center p-6 bg-slate-900 pb-24 overflow-y-auto animate-in fade-in duration-500">
                <FloatingSlideshow />
                <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-3xl p-8 shadow-2xl mt-4">
                    <div className="flex flex-col items-center mb-8 text-center">
                       <div className="w-20 h-20 bg-yellow-500/10 rounded-3xl flex items-center justify-center mb-6 text-yellow-500 shadow-inner">
                         <Wallet size={40} />
                       </div>
                       <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">Withdraw</h2>
                       <p className="text-slate-400 text-sm font-bold mt-2">Manual Audit Mode Active</p>
                    </div>

                    {!hasDeposited && depositRequests.length === 0 ? (
                        <div className="bg-red-500/10 border border-red-500/30 p-5 rounded-2xl flex items-start gap-4">
                            <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={24} />
                            <div>
                                <h4 className="font-black text-red-500 text-xs uppercase tracking-widest">Locked</h4>
                                <p className="text-xs text-slate-300 mt-1 leading-relaxed">Account activation required. Purchase at least one miner via deposit to enable withdrawals.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-5">
                            <div>
                                <label className="block text-[10px] uppercase text-slate-500 font-black tracking-widest mb-2">Gold Amount</label>
                                <div className="relative">
                                    <input 
                                        type="number" 
                                        value={withdrawGoldAmount}
                                        onChange={(e) => setWithdrawGoldAmount(e.target.value)}
                                        placeholder={`Min ${MIN_WITHDRAWAL_GOLD}`}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-2xl p-4 text-white focus:outline-none focus:border-yellow-500 transition-all font-black text-lg" 
                                    />
                                    <span className="absolute right-4 top-4 text-slate-600 font-black text-xs">GOLD</span>
                                </div>
                            </div>
                            
                            <div className="space-y-4 pt-4 border-t border-slate-700">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Payout Destination</p>
                                <input 
                                    type="text" 
                                    placeholder="Bank Name"
                                    value={withdrawBankDetails.bankName}
                                    onChange={(e) => setWithdrawBankDetails({...withdrawBankDetails, bankName: e.target.value})}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500 font-bold" 
                                />
                                <input 
                                    type="text" 
                                    placeholder="Account Number"
                                    value={withdrawBankDetails.accountNumber}
                                    onChange={(e) => setWithdrawBankDetails({...withdrawBankDetails, accountNumber: e.target.value})}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500 font-mono font-bold" 
                                />
                                <input 
                                    type="text" 
                                    placeholder="Account Holder Name"
                                    value={withdrawBankDetails.accountName}
                                    onChange={(e) => setWithdrawBankDetails({...withdrawBankDetails, accountName: e.target.value})}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500 font-bold" 
                                />
                            </div>

                            <button 
                                onClick={handleWithdrawalSubmit}
                                className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-black py-4 rounded-2xl transition-all shadow-xl shadow-yellow-900/10 uppercase tracking-widest text-xs"
                            >
                                Submit Request
                            </button>
                        </div>
                    )}
                </div>
            </div>
        )}
        {activeTab === 'referrals' && (
             <div className="h-full flex flex-col items-center p-6 bg-slate-900 pb-24 overflow-y-auto">
                <FloatingSlideshow />
                <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-3xl p-10 shadow-2xl text-center mt-4">
                    <div className="w-24 h-24 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-8 text-blue-400 shadow-inner">
                        <Users size={48} />
                    </div>
                    <h2 className="text-3xl font-black text-white mb-3 uppercase italic tracking-tighter">Refer & Earn</h2>
                    <p className="text-slate-400 mb-10 text-sm font-bold leading-relaxed px-4">
                        Grow the network and earn <span className="text-green-400">10% commission</span> instantly on your friend's <span className="underline italic">first</span> deposit.
                    </p>

                    <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 flex items-center gap-4 mb-8">
                        <div className="flex-1 text-left overflow-hidden">
                            <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest mb-1">Referral Link</p>
                            <p className="text-white font-mono text-xs truncate">crestminer.gold/ref/{userId.toLowerCase()}</p>
                        </div>
                        <button 
                            onClick={() => copyToClipboard(`https://crestminer.gold/ref/${userId.toLowerCase()}`)}
                            className="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all text-yellow-500 border border-slate-700"
                        >
                            <Copy size={20} />
                        </button>
                    </div>

                    <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-blue-900/20 uppercase tracking-widest text-xs mb-4">
                        Share Link
                    </button>
                </div>
            </div>
        )}
        {activeTab === 'bonus' && (
             <div className="h-full flex flex-col items-center p-6 bg-slate-900 pb-24 overflow-y-auto">
                <FloatingSlideshow />
                <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-3xl p-10 shadow-2xl text-center relative overflow-hidden mt-4">
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-yellow-500 via-white to-yellow-500"></div>
                    <div className="w-28 h-28 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-8 text-yellow-500 animate-pulse">
                        <Gift size={56} />
                    </div>
                    <h2 className="text-3xl font-black text-white mb-3 uppercase italic tracking-tighter">Daily Bonus</h2>
                    <p className="text-slate-400 mb-10 font-bold px-4">Loyalty is rewarded. Collect your free gold every 24 hours.</p>

                    <button 
                        onClick={handleDailyClaim}
                        disabled={dailyClaimed}
                        className={`w-full font-black py-5 rounded-2xl transition-all uppercase tracking-widest text-xs
                            ${dailyClaimed 
                                ? 'bg-slate-700 text-slate-500 cursor-not-allowed border border-slate-600' 
                                : 'bg-gradient-to-r from-yellow-500 to-amber-600 hover:scale-105 text-black shadow-2xl shadow-amber-900/20'
                            }`}
                    >
                        {dailyClaimed ? 'Claimed - Back in 24h' : 'Claim 30 Gold'}
                    </button>
                </div>
            </div>
        )}
        {activeTab === 'admin' && isAdminAuthenticated && (
           <AdminPanel 
             depositRequests={depositRequests} 
             withdrawalRequests={withdrawalRequests}
             userCount={userCount}
             onApproveDeposit={(id) => {
                 setDepositRequests(prev => prev.map(r => {
                     if (r.id === id) {
                         const userDeposits = prev.filter(req => req.userId === r.userId && req.status === 'approved');
                         if (userDeposits.length === 0) {
                             const commission = r.amount * 0.1;
                             setReferralEarnings(curr => curr + commission);
                         }
                         setCashBalance(curr => curr + r.amount);
                         setHasDeposited(true);
                         return { ...r, status: 'approved' };
                     }
                     return r;
                 }));
             }} 
             onDeclineDeposit={(id) => setDepositRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'declined' } : r))} 
             onApproveWithdrawal={(id) => setWithdrawalRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'approved' } : r))}
             onDeclineWithdrawal={(id) => {
                 const req = withdrawalRequests.find(r => r.id === id);
                 if (req) {
                     setCredits(prev => prev + req.amountGold);
                     setReferralEarnings(prev => prev + req.amountReferralNgn);
                 }
                 setWithdrawalRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'declined' } : r));
             }}
           />
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="h-24 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 flex items-center justify-around px-4 z-[70] shrink-0 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
         <NavButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard size={24} />} label="Home" />
         <NavButton active={activeTab === 'mine'} onClick={() => setActiveTab('mine')} icon={<Pickaxe size={24} />} label="Mine" />
         <NavButton active={activeTab === 'history'} onClick={() => setActiveTab('history')} icon={<History size={24} />} label="History" />
         <NavButton active={activeTab === 'withdraw'} onClick={() => setActiveTab('withdraw')} icon={<Wallet size={24} />} label="Payout" />
         <NavButton active={activeTab === 'referrals'} onClick={() => setActiveTab('referrals')} icon={<Users size={24} />} label="Invite" />
         <NavButton active={activeTab === 'bonus'} onClick={() => setActiveTab('bonus')} icon={<Calendar size={24} />} label="Gifts" />
      </nav>

      {/* Modals & Popups */}
      {showAdminLogin && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/95 backdrop-blur-2xl">
           <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-sm p-10 relative shadow-[0_0_100px_rgba(0,0,0,0.8)]">
              <button onClick={() => setShowAdminLogin(false)} className="absolute top-6 right-6 text-slate-600 hover:text-white"><X size={28} /></button>
              <div className="text-center mb-8">
                 <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 text-red-500"><Lock size={40} /></div>
                 <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Security Key</h2>
              </div>
              <form onSubmit={handleAdminLoginSubmit} className="space-y-6">
                 <input 
                    type="password" maxLength={4} placeholder="PIN" value={adminPin}
                    onChange={(e) => setAdminPin(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-5 text-center text-4xl tracking-[0.5em] text-white focus:outline-none focus:border-red-500 font-mono"
                    autoFocus
                 />
                 <button type="submit" className="w-full bg-red-600 hover:bg-red-500 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-red-900/20 uppercase tracking-widest text-xs">Auth</button>
              </form>
           </div>
        </div>
      )}

      {showDepositModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl">
           <div className="bg-slate-800 border border-slate-700 rounded-3xl w-full max-w-sm p-8 relative shadow-2xl">
              <button onClick={() => setShowDepositModal(false)} className="absolute top-6 right-6 text-slate-500"><X size={24} /></button>
              <h2 className="text-2xl font-black text-white mb-2 uppercase italic">Top Up</h2>
              <p className="text-slate-400 text-xs font-bold mb-6">Required for {upgrades.find(u => u.id === pendingUpgradeId)?.name}</p>
              
              {depositErrorMessage ? (
                  <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl text-red-400 text-xs font-bold mb-6 flex items-start gap-3">
                      <AlertCircle className="shrink-0" size={16} />
                      {depositErrorMessage}
                  </div>
              ) : (
                  <>
                    <div className="bg-yellow-500/10 border border-yellow-500/20 p-6 rounded-2xl mb-8 text-center shadow-inner">
                        <p className="text-slate-500 text-[10px] uppercase font-black tracking-widest mb-2">Total Amount</p>
                        <p className="text-4xl font-black text-yellow-500">₦{upgrades.find(u => u.id === pendingUpgradeId)?.price.toLocaleString()}</p>
                    </div>

                    <div className="space-y-4 mb-8 bg-slate-900/50 p-5 rounded-2xl border border-slate-700">
                        <div>
                            <label className="text-[10px] text-slate-600 font-black uppercase tracking-widest block mb-1">Bank</label>
                            <p className="font-bold text-white text-sm">Moniepoint Microfinance Bank</p>
                        </div>
                        <div>
                            <label className="text-[10px] text-slate-600 font-black uppercase tracking-widest block mb-1">Account No.</label>
                            <div className="flex gap-2">
                            <p className="font-mono font-black text-yellow-500 text-lg">9033856757</p>
                            <button onClick={() => copyToClipboard('9033856757')} className="ml-auto text-slate-500 hover:text-white"><Copy size={16}/></button>
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] text-slate-600 font-black uppercase tracking-widest block mb-1">Name</label>
                            <p className="font-bold text-white text-sm">David Ayinde</p>
                        </div>
                    </div>

                    <div className="mb-8">
                        <div className="border-2 border-dashed border-slate-700 rounded-2xl p-8 text-center hover:border-yellow-500 transition-all cursor-pointer relative bg-slate-900/30 group">
                            <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"/>
                            {depositFile ? (
                            <div className="flex items-center justify-center gap-2 text-green-400 font-bold text-sm">
                                <CheckCircle size={20} /> Proof Attached
                            </div>
                            ) : (
                            <div className="flex flex-col items-center gap-3 text-slate-500 group-hover:text-yellow-500">
                                <Upload size={32} />
                                <span className="text-xs font-black uppercase tracking-widest">Upload Screenshot</span>
                            </div>
                            )}
                        </div>
                    </div>

                    <button 
                        onClick={submitDeposit} disabled={!depositFile || depositStatus === 'pending'}
                        className="w-full bg-green-600 hover:bg-green-500 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-green-900/20 disabled:bg-slate-700 disabled:shadow-none uppercase tracking-widest text-xs"
                    >
                        {depositStatus === 'pending' ? 'Submitting...' : 'I Have Paid'}
                    </button>
                  </>
              )}
           </div>
        </div>
      )}

      {showDepositSuccess && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-6 bg-black/95 backdrop-blur-md">
            <div className="bg-slate-900 border border-green-500/50 rounded-3xl w-full max-w-sm p-10 text-center shadow-[0_0_80px_rgba(34,197,94,0.1)]">
                <div className="w-20 h-20 bg-green-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8 text-green-500"><CheckCircle size={48} /></div>
                <h2 className="text-2xl font-black text-white uppercase italic">Deposit Received</h2>
                <p className="text-slate-400 font-bold mt-4 mb-10 leading-relaxed uppercase tracking-tight text-sm italic">deposit submitted for approval</p>
                <button onClick={() => setShowDepositSuccess(false)} className="w-full bg-green-600 hover:bg-green-500 text-white font-black py-4 rounded-2xl uppercase tracking-widest text-xs">Confirm</button>
            </div>
        </div>
      )}

      {showCopiedPopup && (
        <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[2000] animate-in slide-in-from-bottom-5 fade-in">
           <div className="bg-yellow-500 text-black px-6 py-2 rounded-full font-black text-xs uppercase tracking-widest shadow-2xl">Copied to Clipboard</div>
        </div>
      )}

      {showWithdrawalSuccess && (
         <div className="fixed inset-0 z-[1100] flex items-center justify-center p-6 bg-black/95 backdrop-blur-md">
            <div className="bg-slate-900 border border-green-500/50 rounded-3xl w-full max-w-sm p-10 text-center shadow-[0_0_80px_rgba(34,197,94,0.1)]">
                <div className="w-20 h-20 bg-green-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8 text-green-500"><CheckCircle size={48} /></div>
                <h2 className="text-2xl font-black text-white uppercase italic">Processing</h2>
                <p className="text-slate-400 font-bold mt-4 mb-10 leading-relaxed uppercase tracking-tight text-sm italic">withdrawal request submitted</p>
                <button onClick={() => setShowWithdrawalSuccess(false)} className="w-full bg-green-600 hover:bg-green-500 text-white font-black py-4 rounded-2xl uppercase tracking-widest text-xs">Acknowledge</button>
            </div>
         </div>
      )}

      {showWithdrawalError && (
         <div className="fixed inset-0 z-[1100] flex items-center justify-center p-6 bg-black/95">
            <div className="bg-slate-900 border border-red-500/50 rounded-3xl w-full max-w-sm p-10 text-center shadow-[0_0_80px_rgba(239,68,68,0.1)]">
                <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8 text-red-500"><AlertCircle size={48} /></div>
                <h2 className="text-2xl font-black text-white uppercase italic">Error</h2>
                <p className="text-slate-400 font-bold mt-4 mb-10 leading-relaxed">{withdrawalErrorMessage}</p>
                <button onClick={() => setShowWithdrawalError(false)} className="w-full bg-red-600 hover:bg-red-500 text-white font-black py-4 rounded-2xl uppercase tracking-widest text-xs">Close</button>
            </div>
         </div>
      )}

      <style>{`
        @keyframes float-up {
          0% { opacity: 1; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(-100px) scale(1.5); }
        }
        .animate-float-up { animation: float-up 0.8s cubic-bezier(0.1, 0.9, 0.2, 1) forwards; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
      `}</style>
    </div>
  );
};

const NavButton: React.FC<{active: boolean; onClick: () => void; icon: React.ReactNode; label: string}> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all duration-300 ${active ? 'bg-yellow-500/10 text-yellow-500' : 'text-slate-500 hover:text-slate-300'}`}
  >
    <div className={`transition-transform duration-300 ${active ? '-translate-y-1 scale-110' : ''}`}>{icon}</div>
    <span className="text-[10px] font-black mt-2 uppercase tracking-tighter truncate w-full text-center">{label}</span>
  </button>
);

export default App;
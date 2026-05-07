import { useState, useEffect, useMemo, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Search, Copy, CheckCircle2, ShieldCheck, User, Phone, MessageCircle, RefreshCw } from 'lucide-react';

// === CONFIGURAÇÕES ===
const TOTAL_NUMBERS = 300;
const PRIZE_DESCRIPTION = "Gift Card Shopee R$300";
const PIX_KEY = "14184167705";
const WHATSAPP_NUMBER = "5522992119137";

// COLE O SEU LINK DO GOOGLE SCRIPT AQUI ENTRE AS ASPAS
const GOOGLE_SHEET_URL = "https://script.google.com/macros/s/AKfycbx8NgVa0yZ2Ge4Nknr8RYZVMS_eqsRUwwWB778qPlhTv9c16-8iTcVeD9_7RafpDY3q/exec";
const MIA_PHOTO = "https://lh3.googleusercontent.com/d/13_xWnd0XyCY-cgyroR-TuAElxQ9ubMJe";

export default function App() {
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [paidNumbers, setPaidNumbers] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSuccessModal, setIsSuccessModal] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [userName, setUserName] = useState('');
  const [userWhatsapp, setUserWhatsapp] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // === FUNÇÃO DE SINCRONIZAÇÃO (BUSCA DADOS DA PLANILHA) ===
  const fetchSyncData = async () => {
    if (!GOOGLE_SHEET_URL) return;
    setIsSyncing(true);
    try {
      // O t=${Date.now()} evita que o celular use uma versão velha (cache)
      const response = await fetch(`${GOOGLE_SHEET_URL}?action=read&t=${Date.now()}`);
      const data = await response.json();
      if (data && data.paidNumbers) {
        setPaidNumbers(data.paidNumbers);
        // Salva localmente como backup
        localStorage.setItem('mia_paid_numbers', JSON.stringify(data.paidNumbers));
      }
    } catch (error) {
      console.warn("Sincronizando via backup local...");
      const saved = localStorage.getItem('mia_paid_numbers');
      if (saved) setPaidNumbers(JSON.parse(saved));
    } finally {
      setIsSyncing(false);
    }
  };

  // Carregamento inicial e Auto-Sync a cada 15 segundos
  useEffect(() => {
    const savedPhoto = localStorage.getItem('mia_user_photo');
    if (savedPhoto) setUserPhoto(savedPhoto);

    fetchSyncData();
    const interval = setInterval(fetchSyncData, 15000); // Sincroniza a cada 15 seg
    return () => clearInterval(interval);
  }, []);

  const handlePhotoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setUserPhoto(base64String);
        localStorage.setItem('mia_user_photo', base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  // === SALVAR PAGAMENTO (ADMIN CONFIGURANDO NO PC) ===
  const savePaidNumbers = async (numbers: number[]) => {
    setPaidNumbers(numbers);
    localStorage.setItem('mia_paid_numbers', JSON.stringify(numbers));
    
    if (isAdminMode && GOOGLE_SHEET_URL) {
      try {
        await fetch(GOOGLE_SHEET_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'update_paid_list',
            paidNumbers: numbers
          })
        });
        // Força uma atualização após salvar
        setTimeout(fetchSyncData, 2000);
      } catch (e) {
        console.error("Erro ao salvar lista paga:", e);
      }
    }
  };

  const handleNumberClick = (num: number) => {
    if (paidNumbers.includes(num) && !isAdminMode) return;
    if (isAdminMode) {
      const newPaid = paidNumbers.includes(num) 
        ? paidNumbers.filter(n => n !== num) 
        : [...paidNumbers, num];
      savePaidNumbers(newPaid);
      return;
    }
    setSelectedNumbers(prev => prev.includes(num) ? prev.filter(n => n !== num) : [...prev, num]);
  };

  const calculateTotal = useMemo(() => {
    const count = selectedNumbers.length;
    const groupsOfThree = Math.floor(count / 3);
    const individualOnes = count % 3;
    return (groupsOfThree * 25) + (individualOnes * 10);
  }, [selectedNumbers]);

  const copyPix = () => {
    navigator.clipboard.writeText(PIX_KEY);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // === CONFIRMAR RESERVA (ENVIA PARA PLANILHA NA HORA) ===
  const handleFinalReserve = async () => {
    if (!userName || !userWhatsapp) {
      alert("Por favor, preencha seu nome e WhatsApp.");
      return;
    }
    
    setIsSending(true);
    
    if (GOOGLE_SHEET_URL) {
      try {
        await fetch(GOOGLE_SHEET_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'reserve',
            nome: userName,
            whatsapp: userWhatsapp,
            numeros: selectedNumbers.sort((a,b)=>a-b).join(', '),
            valor: calculateTotal,
            data: new Date().toLocaleString('pt-BR')
          })
        });
      } catch (error) {
        console.error("Erro ao enviar reserva:", error);
      }
    }

    setIsSending(false);
    setIsModalOpen(false);
    setIsSuccessModal(true);
  };

  return (
    <div className="min-h-screen pb-40 bg-gray-50">
      {/* Botão de Sync Flutuante (Visual) */}
      {isSyncing && (
        <div className="fixed top-4 right-4 z-50 bg-white/80 p-2 rounded-full shadow-sm">
          <RefreshCw className="w-4 h-4 text-lilas animate-spin" />
        </div>
      )}

      <section className="hero-gradient pt-10 pb-8 px-5 text-center relative overflow-hidden">
        <div className="absolute top-[-60px] right-[-60px] w-52 h-52 bg-rosa/15 rounded-full blur-3xl"></div>
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="hero-img-wrap relative group mx-auto">
          <img src={userPhoto || MIA_PHOTO} alt="Mia" className="w-full h-full object-contain filter drop-shadow-lg" referrerPolicy="no-referrer" />
          {isAdminMode && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
              <label className="cursor-pointer text-white text-[0.6rem] font-bold uppercase tracking-widest bg-lilas px-2 py-1 rounded mb-1">
                Trocar Foto <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
              </label>
            </div>
          )}
        </motion.div>
        
        <h1 className="text-2xl font-bold text-lilas-dark leading-tight mt-4">Rifa solidária da Mia ❤️</h1>
        <p className="text-[0.9rem] text-[#7a5c8a] max-w-[300px] mx-auto mt-2">Sua ajuda é fundamental para a endoscopia da nossa gatinha.</p>

        <div className="prize-badge inline-flex items-center gap-2 bg-white/50 px-4 py-2 rounded-full mt-4 border border-rosa/20">
          <Heart className="w-4 h-4 fill-rosa text-rosa" />
          <span className="text-sm font-bold text-rosa-dark">{PRIZE_DESCRIPTION}</span>
        </div>

        <div className="flex justify-center gap-4 mt-6">
            <div className="info-card bg-white p-3 rounded-2xl shadow-sm border border-pink-50 min-w-[100px]">
              <div className="text-[0.6rem] font-bold text-gray-400 uppercase tracking-wider">1 Número</div>
              <div className="text-rosa-dark font-bold">R$ 10,00</div>
            </div>
            <div className="info-card bg-white p-3 rounded-2xl shadow-sm border border-lilas-light/20 min-w-[100px]">
              <div className="text-[0.6rem] font-bold text-gray-400 uppercase tracking-wider">Combo 3</div>
              <div className="text-lilas font-bold">R$ 25,00</div>
            </div>
        </div>
      </section>

      <div className="px-5 -mt-4 relative z-10">
        <div className="bg-white rounded-2xl p-4 shadow-xl flex items-center gap-3 border border-rosa-light/50">
          <Search className="w-5 h-5 text-gray-300" />
          <input 
            type="text" 
            placeholder="Buscar seu número..." 
            className="w-full outline-none text-sm font-medium" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>
      </div>

      <main className="px-5 mt-8 max-w-[600px] mx-auto">
        <div className="flex justify-between items-center mb-4 px-1">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Selecione:</h2>
          <div className="flex gap-3 text-[0.65rem] font-bold">
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-verde-light"></div>Livre</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-vermelho"></div>Pago</span>
          </div>
        </div>

        <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-2">
          {Array.from({ length: TOTAL_NUMBERS }, (_, i) => i + 1)
            .filter(num => searchTerm ? num.toString().includes(searchTerm) : true)
            .map((num) => (
            <button 
              key={num} 
              onClick={() => handleNumberClick(num)} 
              className={`num-btn aspect-square rounded-xl text-sm font-bold transition-all duration-200 border-b-4 
                ${paidNumbers.includes(num) 
                  ? 'bg-vermelho border-vermelho-dark text-white' 
                  : selectedNumbers.includes(num) 
                    ? 'bg-lilas border-lilas-dark text-white scale-95 shadow-inner' 
                    : 'bg-verde-light border-[#c5e8d5] text-verde-dark hover:bg-verde hover:text-white'
                }`}
            >
              {num}
            </button>
          ))}
        </div>

        <div className="explain-box mt-10 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <h3 className="text-sm font-bold text-lilas-dark mb-4 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" /> Passo a passo:
          </h3>
          <div className="space-y-4">
             <div className="flex gap-3">
               <div className="w-6 h-6 rounded-full bg-rosa/10 text-rosa flex items-center justify-center text-xs font-bold shrink-0">1</div>
               <p className="text-xs text-gray-600 leading-relaxed">Escolha seus números favoritos na tabela acima.</p>
             </div>
             <div className="flex gap-3">
               <div className="w-6 h-6 rounded-full bg-rosa/10 text-rosa flex items-center justify-center text-xs font-bold shrink-0">2</div>
               <p className="text-xs text-gray-600 leading-relaxed">Clique em <b>Reservar</b> e informe seu nome e WhatsApp.</p>
             </div>
             <div className="flex gap-3">
               <div className="w-6 h-6 rounded-full bg-rosa/10 text-rosa flex items-center justify-center text-xs font-bold shrink-0">3</div>
               <p className="text-xs text-gray-600 leading-relaxed">Faça o Pix e nos envie o comprovante. Confirmaremos seu número em segundos!</p>
             </div>
          </div>
        </div>
      </main>

      <div className="mt-12 px-5 flex flex-col items-center gap-4 pb-20">
        <button 
          onClick={() => setIsAdminMode(!isAdminMode)} 
          className="text-[0.65rem] font-bold py-2 px-4 rounded-full border border-gray-200 text-gray-400 uppercase tracking-widest hover:bg-gray-100 transition-colors"
        >
          {isAdminMode ? "Sair do Modo Editor" : "Acesso Restrito"}
        </button>
        <p className="text-[0.6rem] text-gray-300">Mia Rifa Versão 2.4 - Sincronização Ativa</p>
      </div>

      <AnimatePresence>
        {selectedNumbers.length > 0 && !isAdminMode && (
          <motion.div 
            initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
            className="fixed bottom-0 left-0 right-0 p-5 bg-white/90 backdrop-blur-md border-t border-rosa-light/30 shadow-[0_-10px_40px_rgba(0,0,0,0,0.05)] z-40"
          >
            <div className="max-w-[600px] mx-auto flex items-center justify-between gap-4">
              <div className="flex-1">
                <div className="text-[0.6rem] font-black text-gray-400 uppercase tracking-wider mb-1">
                  {selectedNumbers.length} {selectedNumbers.length === 1 ? 'Número' : 'Números'}
                </div>
                <div className="text-2xl font-black text-lilas-dark leading-none">
                  R$ {calculateTotal.toFixed(2)}
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(true)} 
                className="bg-lilas hover:bg-lilas-dark text-white px-8 py-4 rounded-2xl font-bold transition-all active:scale-95 shadow-lg shadow-lilas/20"
              >
                Reservar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white rounded-3xl p-7 w-full max-w-[450px] shadow-2xl">
            <h2 className="text-xl font-black text-lilas-dark mb-2">Quase lá! 🐾</h2>
            <p className="text-gray-500 text-sm mb-6">Informe seus dados para que possamos identificar seu pagamento.</p>
            
            <div className="space-y-4 mb-8">
              <div className="relative">
                <User className="absolute left-4 top-4 w-5 h-5 text-gray-300" />
                <input 
                  type="text" 
                  placeholder="Seu Nome Completo" 
                  className="w-full bg-gray-50 p-4 pl-12 rounded-2xl outline-none border-2 border-transparent focus:border-lilas/20 transition-all" 
                  value={userName} 
                  onChange={(e) => setUserName(e.target.value)} 
                />
              </div>
              <div className="relative">
                <Phone className="absolute left-4 top-4 w-5 h-5 text-gray-300" />
                <input 
                  type="tel" 
                  placeholder="Seu WhatsApp" 
                  className="w-full bg-gray-50 p-4 pl-12 rounded-2xl outline-none border-2 border-transparent focus:border-lilas/20 transition-all" 
                  value={userWhatsapp} 
                  onChange={(e) => setUserWhatsapp(e.target.value)} 
                />
              </div>
            </div>

            <div className="bg-rosa/5 p-5 rounded-2xl mb-8 border border-rosa/10">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="text-[0.6rem] font-bold text-rosa/60 uppercase mb-1">Chave PIX (Telefone)</div>
                  <div className="font-black text-lilas-dark text-lg">{PIX_KEY}</div>
                </div>
                <button 
                  onClick={copyPix} 
                  className={`p-3 rounded-xl transition-all ${copied ? 'bg-green-500 text-white' : 'bg-white text-rosa shadow-sm border border-rosa/10'}`}
                >
                  {copied ? <CheckCircle2 className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-[0.65rem] text-rosa-dark/60 italic leading-relaxed text-center">
                Você pode copiar a chave acima e pagar no seu banco.<br/>Após clicar em confirmar, nos envie o comprovante!
              </p>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 text-gray-400 font-bold text-sm">Cancelar</button>
              <button 
                onClick={handleFinalReserve} 
                disabled={isSending}
                className="flex-[2] bg-lilas text-white py-4 rounded-2xl font-bold shadow-lg shadow-lilas/20 active:scale-95 transition-all"
              >
                {isSending ? "Processando..." : "Confirmar Reserva"}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {isSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[40px] p-10 text-center w-full max-w-[400px] shadow-2xl relative">
            <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">
              ✓
            </div>
            <h2 className="text-2xl font-black text-lilas-dark mb-4">Sucesso!</h2>
            <p className="text-gray-500 text-sm mb-8 leading-relaxed">
              Tudo pronto, <b>{userName}</b>! Agora é só nos enviar o comprovante para ativarmos seus números.
            </p>
            
            <a 
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=Olá!%20Acabei%20de%20reservar%20os%20números%20${selectedNumbers.join(',%20')}%20para%20ajudar%20a%20Mia.%20Aqui%20está%20o%20comprovante!`}
              target="_blank" 
              rel="noopener noreferrer" 
              className="w-full inline-flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white rounded-2xl py-5 font-bold mb-4 shadow-lg shadow-green-200 transition-all active:scale-95"
            >
              <MessageCircle className="w-5 h-5" /> Enviar Comprovante
            </a>
            
            <button 
              onClick={() => { setIsSuccessModal(false); setSelectedNumbers([]); }} 
              className="text-gray-300 text-xs font-bold uppercase tracking-widest hover:text-gray-500"
            >
              Voltar ao Site
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}    
    const savedPhoto = localStorage.getItem('mia_user_photo');
    if (savedPhoto) setUserPhoto(savedPhoto);
  }, []);

  const handlePhotoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setUserPhoto(base64String);
        localStorage.setItem('mia_user_photo', base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearPhoto = () => {
    setUserPhoto(null);
    localStorage.removeItem('mia_user_photo');
  };

  const savePaidNumbers = (numbers: number[]) => {
    setPaidNumbers(numbers);
    localStorage.setItem('mia_paid_numbers', JSON.stringify(numbers));
  };

  const handleNumberClick = (num: number) => {
    if (paidNumbers.includes(num) && !isAdminMode) return;
    
    if (isAdminMode) {
      const newPaid = paidNumbers.includes(num)
        ? paidNumbers.filter(n => n !== num)
        : [...paidNumbers, num];
      savePaidNumbers(newPaid);
      setSelectedNumbers(prev => prev.filter(n => n !== num));
      return;
    }

    setSelectedNumbers(prev => {
      if (prev.includes(num)) return prev.filter(n => n !== num);
      return [...prev, num];
    });
  };

  // Logic: 3 numbers = 25, 1 number = 10
  const calculateTotal = useMemo(() => {
    const count = selectedNumbers.length;
    const groupsOfThree = Math.floor(count / 3);
    const individualOnes = count % 3;
    return (groupsOfThree * 25) + (individualOnes * 10);
  }, [selectedNumbers]);

  const copyPix = () => {
    navigator.clipboard.writeText(PIX_KEY);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirm = () => {
    if (selectedNumbers.length > 0) setIsModalOpen(true);
  };

  const [isSending, setIsSending] = useState(false);

  const handleFinalReserve = async () => {
    if (!userName || !userWhatsapp) {
      alert("Por favor, preencha seu nome e WhatsApp.");
      return;
    }

    // Se houver URL configurada, envia para a planilha
    if (GOOGLE_SHEET_URL) {
      setIsSending(true);
      try {
        await fetch(GOOGLE_SHEET_URL, {
          method: 'POST',
          mode: 'no-cors', // Necessário para Google Apps Script
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nome: userName,
            whatsapp: userWhatsapp,
            numeros: selectedNumbers.sort((a,b)=>a-b).join(', '),
            total: calculateTotal
          })
        });
      } catch (error) {
        console.error("Erro ao enviar para planilha:", error);
      } finally {
        setIsSending(false);
      }
    }

    setIsModalOpen(false);
    setIsSuccessModal(true);
  };

  return (
    <div className="min-h-screen pb-40">
      {/* HERO SECTION */}
      <section className="hero-gradient pt-10 pb-8 px-5 text-center relative overflow-hidden">
        <div className="absolute top-[-60px] right-[-60px] w-52 h-52 bg-rosa/15 rounded-full blur-3xl"></div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="hero-img-wrap relative group"
        >
          <img 
            src={userPhoto || MIA_PHOTO} 
            alt="Mia" 
            className="w-full h-full object-contain filter drop-shadow-lg" 
            referrerPolicy="no-referrer" 
          />
          
          {isAdminMode && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
              <label className="cursor-pointer text-white text-[0.6rem] font-bold uppercase tracking-widest bg-lilas px-2 py-1 rounded mb-1">
                Trocar Foto
                <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
              </label>
              {userPhoto && (
                <button 
                  onClick={clearPhoto}
                  className="text-white text-[0.5rem] underline opacity-70 hover:opacity-100"
                >
                  Remover
                </button>
              )}
            </div>
          )}
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-bold text-lilas-dark leading-tight mb-2"
        >
          Rifa solidária para<br />ajudar a Mia ❤️
        </motion.h1>
        
        <p className="text-[0.95rem] text-[#7a5c8a] max-w-[340px] mx-auto mb-6 leading-relaxed">
          Estou fazendo esta rifa para arrecadar ajuda para a endoscopia da Mia. Cada participação faz diferença.
        </p>

        <div className="prize-badge shadow-sm">
          🎁 Prêmio: {PRIZE_DESCRIPTION}
        </div>

        <div className="mt-2">
          <a href="#grade-section" className="btn-primary-custom">Escolher meus números</a>
        </div>

        {/* INFO CARDS */}
        <div className="grid grid-cols-3 gap-2.5 max-w-[480px] mx-auto mt-8">
          <div className="info-card">
            <div className="text-xl font-bold text-lilas">{TOTAL_NUMBERS - paidNumbers.length}</div>
            <div className="text-[0.7rem] text-[#999] uppercase font-medium">disponíveis</div>
          </div>
          <div className="info-card">
            <div className="text-xl font-bold text-rosa">R$10</div>
            <div className="text-[0.7rem] text-[#999] uppercase font-medium">por número</div>
          </div>
          <div className="info-card">
            <div className="text-xl font-bold text-lilas">R$25</div>
            <div className="text-[0.7rem] text-[#999] uppercase font-medium">3 números</div>
          </div>
        </div>
      </section>

      {/* EXPLANATION */}
      <section className="max-w-[600px] mx-auto px-5 py-10">
        <h2 className="text-xl font-bold text-lilas-dark mb-5 text-center">Como funciona?</h2>
        <div className="explain-box">
          <p className="text-[0.92rem] leading-relaxed text-[#555] mb-5">
            Estou fazendo esta rifa para arrecadar ajuda para a endoscopia da <strong>Mia</strong>. Toda participação fará uma diferença enorme para a saúde dela. 🐾
          </p>
          <ul className="space-y-3.5">
            {[ "Escolha um ou mais números na grade abaixo", "Clique em \"Confirmar seleção\" e preencha seus dados", "Realize o pagamento via Pix e envie o comprovante" ].map((txt, i) => (
              <li key={i} className="flex gap-4 items-start text-[0.9rem] text-[#555]">
                <div className="w-5.5 h-5.5 bg-gradient-to-br from-rosa to-lilas text-white rounded-full flex items-center justify-center shrink-0 text-[0.7rem] font-bold mt-0.5">{i+1}</div>
                <p>{txt}</p>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="explain-box border-l-4 border-lilas">
          <p className="text-[0.85rem] font-bold text-lilas mb-1.5 uppercase">💰 Tabela de preços</p>
          <div className="grid grid-cols-2 gap-y-1 text-[0.88rem] text-[#555]">
            <p>1 número = <strong>R$10</strong></p>
            <p>2 números = <strong>R$20</strong></p>
            <p>3 números = <strong className="text-rosa">R$25</strong></p>
            <p>5 números = <strong className="text-rosa">R$45</strong></p>
          </div>
          <p className="text-[0.75rem] text-[#888] mt-3 italic underline decoration-rosa/30 underline-offset-4">A cada grupo de 3, você paga apenas R$25!</p>
        </div>
      </section>

      {/* LEGEND */}
      <section className="max-w-[600px] mx-auto px-5 py-0">
        <div className="flex flex-wrap gap-2.5 justify-center mb-8">
           <div className="flex items-center gap-2 bg-white rounded-full px-4 py-1.5 text-[0.8rem] font-medium shadow-sm border border-gray-100">
             <div className="w-2.5 h-2.5 rounded-full bg-verde"></div> Disponível
           </div>
           <div className="flex items-center gap-2 bg-white rounded-full px-4 py-1.5 text-[0.8rem] font-medium shadow-sm border border-gray-100">
             <div className="w-2.5 h-2.5 rounded-full bg-amarelo"></div> Reservado
           </div>
           <div className="flex items-center gap-2 bg-white rounded-full px-4 py-1.5 text-[0.8rem] font-medium shadow-sm border border-gray-100">
             <div className="w-2.5 h-2.5 rounded-full bg-vermelho"></div> Pago
           </div>
        </div>
      </section>

      {/* GRADE & SEARCH */}
      <section id="grade-section" className="max-w-[600px] mx-auto px-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-lilas-dark">Selecione</h2>
          <div className="flex items-center gap-2 bg-white border border-gray-mid rounded-full px-3.5 py-1.5">
            <Search className="w-4 h-4 text-gray-400" />
            <input 
              type="number" 
              placeholder="Buscar..." 
              className="bg-transparent border-none outline-none text-sm w-16"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
           {Array.from({ length: TOTAL_NUMBERS }, (_, i) => i + 1).map(num => {
             const isPaid = paidNumbers.includes(num);
             const isSelected = selectedNumbers.includes(num);
             const matchesSearch = searchTerm && parseInt(searchTerm) === num;

             return (
               <button
                 key={num}
                 onClick={() => handleNumberClick(num)}
                 className={`
                    num-btn
                    ${isPaid ? 'vermelho' : isSelected ? 'selecionado' : 'verde'}
                    ${matchesSearch ? 'ring-2 ring-lilas ring-offset-1' : ''}
                 `}
               >
                 {String(num).padStart(3, '0')}
               </button>
             );
           })}
        </div>
      </section>

      {/* STICKY SUMMARY FOOTER */}
      <AnimatePresence>
        {selectedNumbers.length > 0 && (
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="summary-wrap"
          >
            <div className="max-w-[500px] mx-auto">
              <div className="text-[0.8rem] text-[#555] mb-2 leading-relaxed flex flex-wrap gap-1 hide-scrollbar max-h-12 overflow-y-auto">
                <span className="font-bold mr-1">Selecionados:</span> 
                {selectedNumbers.sort((a,b)=>a-b).map(n => (
                  <span key={n} className="bg-rosa-light text-rosa-dark rounded px-1.5 py-0.5 text-[0.7rem] font-bold">
                    {String(n).padStart(3, '0')}
                  </span>
                ))}
              </div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm text-[#555]">{selectedNumbers.length} selecionado(s)</span>
                <span className="text-xl font-bold text-lilas">R${calculateTotal}</span>
              </div>
              <button onClick={handleConfirm} className="w-full btn-primary-custom">
                Confirmar seleção →
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* WHATSAPP FAB */}
      <a 
        href={`https://wa.me/${WHATSAPP_NUMBER}?text=Ol%C3%A1%21+Quero+participar+da+rifa+da+Mia+🐱`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-28 right-5 w-12 h-12 bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-lg z-30 ring-4 ring-white/20 transition-transform active:scale-90"
      >
        <MessageCircle className="w-6 h-6" />
      </a>

      {/* RODA PÉ FINAL */}
      <footer className="mt-20 px-5 text-center text-[0.7rem] text-[#aaa] space-y-2">
        <p>🐱 A Mia agradece imensamente seu apoio e carinho.</p>
        <p>Todos os direitos reservados · Rifa Solidária da Mia</p>
        
        <button 
          onClick={() => setIsAdminMode(!isAdminMode)}
          className={`mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full border transition-colors ${isAdminMode ? 'bg-lilas text-white border-lilas font-bold' : 'border-gray-200 text-gray-400'}`}
        >
          <ShieldCheck className="w-3 h-3" />
          {isAdminMode ? 'Modo Admin Ativo' : 'Acesso Admin'}
        </button>
      </footer>

      {/* MODAL RESERVA (BOTTOM SHEET) */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4">
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="modal-slide-up"
            >
              <div className="w-10 h-1 bg-gray-mid rounded-full mx-auto mb-4 sm:hidden"></div>
              <h2 className="text-xl font-bold text-lilas-dark text-center mb-6">Confirmar reserva</h2>
              
              <div className="space-y-4 mb-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#888] uppercase tracking-wider">Nome completo *</label>
                  <input 
                    type="text" 
                    className="w-full bg-gray-light border-none rounded-xl p-3.5 outline-none focus:ring-2 focus:ring-lilas/20 transition-all font-medium"
                    placeholder="Como podemos te chamar?"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#888] uppercase tracking-wider">WhatsApp *</label>
                  <input 
                    type="tel" 
                    className="w-full bg-gray-light border-none rounded-xl p-3.5 outline-none focus:ring-2 focus:ring-lilas/20 transition-all font-medium"
                    placeholder="(00) 00000-0000"
                    value={userWhatsapp}
                    onChange={(e) => setUserWhatsapp(e.target.value)}
                  />
                </div>
              </div>

              <div className="bg-gray-light rounded-2xl p-4 mb-6 text-[0.85rem] space-y-2.5">
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="text-[#888]">Números</span>
                  <strong className="text-lilas">{selectedNumbers.sort((a,b)=>a-b).join(', ')}</strong>
                </div>
                <div className="flex justify-between border-b border-gray-200 py-2">
                  <span className="text-[#888]">Total de itens</span>
                  <strong>{selectedNumbers.length}</strong>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="text-sm font-bold text-[#555]">Total a pagar</span>
                  <strong className="text-xl text-rosa">R${calculateTotal},00</strong>
                </div>
              </div>

              <div className="bg-gradient-to-br from-rosa-light/50 to-lilas-light/50 rounded-2xl p-5 text-center mb-6 border border-white">
                <p className="text-[0.7rem] text-[#999] uppercase font-bold mb-2">Chave Pix</p>
                <div className="text-xl font-bold text-lilas-dark tracking-wide mb-4 flex items-center justify-center gap-2">
                  {PIX_KEY}
                </div>
                <button 
                  onClick={copyPix}
                  className={`w-full flex items-center justify-center gap-2 py-3 rounded-full font-bold transition-all shadow-sm ${copied ? 'bg-green-500 text-white' : 'bg-white text-rosa border border-rosa-light hover:bg-rosa-light'}`}
                >
                   {copied ? <><CheckCircle2 className="w-5 h-5"/> Chave copiada!</> : "📋 Copiar chave Pix"}
                </button>
              </div>

              <button 
                onClick={handleFinalReserve} 
                className={`w-full btn-primary-custom py-4 flex items-center justify-center gap-2 ${isSending ? 'opacity-70 cursor-not-allowed' : ''}`}
                disabled={isSending}
              >
                {isSending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Enviando reserva...
                  </>
                ) : (
                  "Reservar meus números ❤️"
                )}
              </button>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-full mt-4 text-[#aaa] text-xs font-bold uppercase tracking-widest py-2"
              >
                Voltar
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL SUCESSO */}
      <AnimatePresence>
        {isSuccessModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4">
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              className="modal-slide-up text-center"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-rosa to-lilas rounded-full flex items-center justify-center text-white text-3xl mx-auto mb-5 shadow-lg shadow-rosa/20">✨</div>
              <h2 className="text-2xl font-bold text-lilas-dark mb-2">Quase lá!</h2>
              <p className="text-sm text-[#888] leading-relaxed mb-8 px-4">Para concluir, realize o Pix e envie o comprovante. Seus números estão reservados!</p>
              
              <a 
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=Ol%C3%A1!%20Acabei+de+reservar+os+n%C3%BAmeros+${selectedNumbers.join(',%20')}+na+rifa+da+Mia.%20Total:%20R$${calculateTotal}.%20Seguindo+com+o+comprovante!`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 bg-[#25D366] text-white rounded-full py-4 font-bold mb-4 shadow-xl shadow-green-500/20 active:scale-95 transition-transform"
              >
                 <MessageCircle className="w-5 h-5 fill-white" />
                 Enviar comprovante agora
              </a>
              <button 
                onClick={() => { setIsSuccessModal(false); setSelectedNumbers([]); }}
                className="w-full text-[#aaa] text-xs font-bold uppercase py-2"
              >
                Voltar para a grade
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

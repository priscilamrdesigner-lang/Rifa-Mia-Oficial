import { useState, useEffect, useMemo, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Search, Copy, CheckCircle2, ShieldCheck, User, Phone, MessageCircle } from 'lucide-react';

// Configuration
const TOTAL_NUMBERS = 300;
const PRIZE_DESCRIPTION = "Gift Card Shopee R$300";
const PIX_KEY = "14184167705";
const WHATSAPP_NUMBER = "5522992119137";

// COLE A SUA URL DO GOOGLE APPS SCRIPT AQUI ENTRE AS ASPAS
const GOOGLE_SHEET_URL = "https://script.google.com/macros/s/AKfycbwI0ZP0-eKQJno_qBocL2WSQaubLfIvmGJHOfQFszV2gSzOgqMD5z0cm-_yaZvLSzQ3/exec";

// Using the user's provided photo from Google Drive with the correct direct link format
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

  useEffect(() => {
    const savedNumbers = localStorage.getItem('mia_paid_numbers');
    if (savedNumbers) setPaidNumbers(JSON.parse(savedNumbers));
    
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

  const handleFinalReserve = async () => {
    if (!userName || !userWhatsapp) {
      alert("Por favor, preencha seu nome e WhatsApp");
      return;
    }

    setIsSending(true);
    try {
      const response = await fetch(GOOGLE_SHEET_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: userName,
          whatsapp: userWhatsapp,
          numeros: selectedNumbers.join(", "),
          valor: calculateTotal,
          data: new Date().toLocaleString("pt-BR")
        })
      });

      setIsModalOpen(false);
      setIsSuccessModal(true);
    } catch (error) {
      console.error("Erro ao enviar:", error);
      alert("Ocorreu um erro ao salvar sua reserva. Tente novamente ou fale no WhatsApp.");
    } finally {
      setIsSending(false);
    }
  };

  const filteredNumbers = useMemo(() => {
    const all = Array.from({ length: TOTAL_NUMBERS }, (_, i) => i + 1);
    if (!searchTerm) return all;
    return all.filter(num => num.toString().includes(searchTerm));
  }, [searchTerm]);

  return (
    <div className="min-h-screen pb-40">
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
                <button onClick={clearPhoto} className="text-white text-[0.5rem] underline opacity-70 hover:opacity-100">
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

        <div className="prize-badge">
          <Heart className="w-4 h-4 fill-rosa" />
          <span>Prêmio: {PRIZE_DESCRIPTION}</span>
        </div>

        <div className="flex justify-center gap-4 mt-2">
            <div className="info-card">
              <div className="text-[0.65rem] uppercase font-bold text-[#aaa] mb-1">Valor</div>
              <div className="text-rosa-dark font-bold">R$ 10,00</div>
            </div>
            <div className="info-card">
              <div className="text-[0.65rem] uppercase font-bold text-[#aaa] mb-1">Promoção</div>
              <div className="text-lilas font-bold">3 por R$ 25</div>
            </div>
        </div>
      </section>

      <div className="px-5 -mt-4 relative z-10">
        <div className="bg-white rounded-2xl p-4 shadow-xl shadow-rosa/5 flex items-center gap-3 border border-rosa-light/50">
          <Search className="w-5 h-5 text-[#ccc]" />
          <input 
            type="text" 
            placeholder="Buscar número específico..." 
            className="w-full bg-transparent border-none outline-none text-sm font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <main className="px-5 mt-8">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h2 className="text-xl font-bold text-lilas-dark">Números</h2>
            <p className="text-xs text-[#aaa] mt-1">Clique para selecionar</p>
          </div>
          <div className="flex gap-3">
             <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-green-200 border border-green-400"></div>
                <span className="text-[0.65rem] font-bold text-[#888] uppercase">Livre</span>
             </div>
             <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-200 border border-red-400"></div>
                <span className="text-[0.65rem] font-bold text-[#888] uppercase">Pago</span>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-5 sm:grid-cols-8 gap-2.5">
          {filteredNumbers.map((num) => {
            const isPaid = paidNumbers.includes(num);
            const isSelected = selectedNumbers.includes(num);
            
            return (
              <button
                key={num}
                onClick={() => handleNumberClick(num)}
                className={`num-btn ${isPaid ? 'vermelho' : isSelected ? 'selecionado' : 'verde'}`}
              >
                {num}
              </button>
            );
          })}
        </div>

        <div className="explain-box mt-10">
          <h3 className="text-sm font-bold text-lilas-dark mb-4 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-rosa" />
            Como funciona?
          </h3>
          <ul className="space-y-3">
            <li className="flex gap-3 text-xs leading-relaxed text-[#666]">
              <span className="flex-shrink-0 w-5 h-5 bg-rosa-light rounded-full flex items-center justify-center text-rosa font-bold">1</span>
              Escolha seus números da sorte acima. Aproveite a promoção de 3 números!
            </li>
            <li className="flex gap-3 text-xs leading-relaxed text-[#666]">
              <span className="flex-shrink-0 w-5 h-5 bg-rosa-light rounded-full flex items-center justify-center text-rosa font-bold">2</span>
              Clique em "Reservar" e faça o Pix usando a nossa chave.
            </li>
            <li className="flex gap-3 text-xs leading-relaxed text-[#666]">
              <span className="flex-shrink-0 w-5 h-5 bg-rosa-light rounded-full flex items-center justify-center text-rosa font-bold">3</span>
              Envie o comprovante pelo WhatsApp. Assim que confirmado, o número ficará vermelho.
            </li>
          </ul>
        </div>
      </main>

      <div className="mt-10 px-5 flex justify-center pb-10">
        <button 
          onClick={() => setIsAdminMode(!isAdminMode)}
          className="flex items-center gap-2 text-[0.65rem] font-bold uppercase tracking-widest text-[#ccc] hover:text-lilas transition-colors"
        >
          <ShieldCheck className="w-3 h-3" />
          {isAdminMode ? "Sair do modo edição" : "Acesso Administrativo"}
        </button>
      </div>

      <AnimatePresence>
        {selectedNumbers.length > 0 && !isAdminMode && (
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="summary-wrap"
          >
            <div className="max-w-[600px] mx-auto flex items-center justify-between gap-4">
              <div className="flex-1">
                <div className="text-[0.65rem] font-bold text-[#aaa] uppercase mb-0.5">Selecionados: {selectedNumbers.length}</div>
                <div className="text-xl font-black text-lilas-dark">R$ {calculateTotal.toFixed(2)}</div>
              </div>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="btn-primary-custom !px-8 h-[52px] flex items-center gap-2"
              >
                Reservar <Heart className="w-4 h-4 fill-white" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4">
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              className="modal-slide-up"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-rosa-light rounded-xl flex items-center justify-center text-rosa">
                  <User className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-lilas-dark">Finalizar Reserva</h2>
              </div>

              <div className="space-y-4 mb-8">
                <div>
                  <label className="text-[0.65rem] font-bold text-[#aaa] uppercase ml-1 mb-1 block">Seu Nome</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Maria Silva"
                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3 outline-none focus:border-rosa-light transition-all font-medium"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[0.65rem] font-bold text-[#aaa] uppercase ml-1 mb-1 block">WhatsApp</label>
                  <input 
                    type="tel" 
                    placeholder="Ex: 22 99999-9999"
                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3 outline-none focus:border-rosa-light transition-all font-medium"
                    value={userWhatsapp}
                    onChange={(e) => setUserWhatsapp(e.target.value)}
                  />
                </div>
              </div>

              <div className="bg-gray-50 rounded-2xl p-5 mb-8 border-2 border-dashed border-gray-200">
                <div className="text-[0.65rem] font-bold text-[#aaa] uppercase text-center mb-3">Pagamento via Pix</div>
                <div className="flex flex-col items-center gap-3 mb-4">
                  <div className="text-xs text-[#888]">Chave CPF:</div>
                  <div className="text-lg font-black text-lilas-dark tracking-wider">{PIX_KEY}</div>
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

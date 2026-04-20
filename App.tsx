import { useState, useEffect, useMemo, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Search, Copy, CheckCircle2, ShieldCheck, User, Phone, MessageCircle } from 'lucide-react';

// Configuration
const TOTAL_NUMBERS = 300;
const PRIZE_DESCRIPTION = "Gift Card Shopee R$300";
const PIX_KEY = "14184167705";
const WHATSAPP_NUMBER = "55229921191137";

// COLE A SUA URL DO GOOGLE APPS SCRIPT AQUI ENTRE AS ASPAS
const GOOGLE_SHEET_URL = "https://script.google.com/macros/s/AKfycbwI0ZP0-eKQJno_qBocL2WSQaubLfIvmGJHOfQFszV2gSzOgqMD5z0cm-_yaZvLSzQ3/exec";

// Using the user's provided photo from Google Drive with the correct direct link format
const MIA_PHOTO = "https://drive.google.com/uc?export=view&id=13_xWnd0XyCY-cgyroR-TuAElxQ9ubMJe";
// Backup photo: "https://images.unsplash.com/photo-1548247416-ec66f4900b2e?auto=format&fit=crop&q=80&w=800"

export default function App() {
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [paidNumbers, setPaidNumbers] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSuccessModal, setIsSuccessModal] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Photo State with persistence
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  
  const [userName, setUserName] = useState('');
  const [userWhatsapp, setUserWhatsapp] = useState('');

  // Persistence for numbers and photo
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

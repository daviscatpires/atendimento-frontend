import React, { useState, useEffect, useRef } from 'react';
import api from '../../api';
import './Chat.css';

function Chat() {
  const [mensagens, setMensagens] = useState([]);
  const [mensagem, setMensagem] = useState('');
  const [atendimentos, setAtendimentos] = useState([]);
  const [selectedAtendimento, setSelectedAtendimento] = useState(null);
  const [sending, setSending] = useState(false);
  const messagesBoxRef = useRef(null);
  const isAtBottomRef = useRef(true);
  const [user, setUser] = useState(null);
  const [showOptions, setShowOptions] = useState(false);
  const [arquivo, setArquivo] = useState(null);
  const [empresas, setEmpresas] = useState([]);
  const [atendentes, setAtendentes] = useState([]);
  const [showRedirectModal, setShowRedirectModal] = useState(false);
  const [selectedAtendente, setSelectedAtendente] = useState(null);
  // ✅ Buscar usuário logado
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
  
        const res = await api.get('/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
  
        setUser(res.data);
      } catch (error) {
        console.error("❌ Erro ao buscar usuário:", error);
      }
    };
  
    fetchUser();
  }, []);

  // ✅ Buscar atendimentos e ordenar por última atividade
  useEffect(() => {
    const fetchAtendimentos = async () => {
      try {
        const res = await api.get('/atendimentos');
        
        // 🔍 Ordena atendimentos pelo tempo da última mensagem (do mais recente para o mais antigo)
        const atendimentosOrdenados = res.data.sort((a, b) => {
          const ultimoMsgA = a.messages.length > 0 ? new Date(a.messages[a.messages.length - 1].timestamp) : new Date(a.inicioAtendimento);
          const ultimoMsgB = b.messages.length > 0 ? new Date(b.messages[b.messages.length - 1].timestamp) : new Date(b.inicioAtendimento);
          return ultimoMsgB - ultimoMsgA; 
        });

        setAtendimentos(atendimentosOrdenados);
      } catch (err) {
        console.error('❌ Erro ao buscar atendimentos:', err);
      }
    };

    fetchAtendimentos();
    const interval = setInterval(fetchAtendimentos, 5000); // Atualiza a cada 5s
    return () => clearInterval(interval);
  }, []);

  // ✅ Selecionar atendimento e buscar mensagens associadas
  const handleSelecionarAtendimento = async (atendimento) => {
    setSelectedAtendimento(atendimento);
    setMensagens([]);
    isAtBottomRef.current = true;

    try {
      const res = await api.get(`/atendimentos/${atendimento._id}/mensagens`);
      setMensagens(res.data);
      scrollToBottom();
    } catch (err) {
      console.error('❌ Erro ao buscar mensagens do atendimento:', err);
    }
  };

  // 📌 Buscar empresas e atendentes ao abrir modal
  const handleRedirectClick = async () => {
    try {
      const response = await api.get("/atendimentos/opcoes-redirecionamento");
      console.log("✅ Opções de redirecionamento recebidas:", response.data);
  
      const { empresas, atendentes } = response.data;
      setEmpresas(empresas);
      setAtendentes(atendentes);
      setShowRedirectModal(true); // Abre o modal
  } catch (error) {
      console.error("❌ Erro ao buscar opções de redirecionamento:", error);
      alert("Erro ao buscar opções de redirecionamento.");
  }
  
  };
  const agrupadosPorEmpresa = (atendentes) => {
    return atendentes.reduce((acc, at) => {
      if (!at.empresa) return acc; // Ignora atendentes sem empresa vinculada
  
      if (!acc[at.empresa]) {
        acc[at.empresa] = [];
      }
      acc[at.empresa].push(at);
  
      return acc;
    }, {});
  };
  
  

  // 🟢 Exibir menu de ações
const toggleOptions = () => {
  setShowOptions(!showOptions);
};

  // 📌 Encerrar atendimento
  const handleEndConversation = async () => {
    if (!selectedAtendimento) {
      alert("Selecione um atendimento antes de encerrar.");
      return;
    }
  
    try {
      const response = await api.post(`/atendimentos/${selectedAtendimento._id}/encerrar`);
  
      if (!response.data.success) throw new Error(response.data.error || "Erro ao encerrar atendimento.");
  
      alert("Atendimento encerrado e avaliação enviada.");
      setAtendimentos(atendimentos.filter(a => a._id !== selectedAtendimento._id)); // Remove da lista
      setSelectedAtendimento(null); // Limpa o atendimento atual
    } catch (error) {
      console.error("❌ Erro ao encerrar atendimento:", error);
      alert("Erro ao encerrar atendimento.");
    }
  };

// 📌 Redirecionar atendimento
const handleRedirect = async () => {
  if (!selectedAtendimento || !selectedAtendente) {
    alert("Selecione um atendimento e um atendente.");
    return;
  }

  try {
    const response = await api.post(`/atendimentos/${selectedAtendimento._id}/redirecionar`, {
        novoAtendenteId: selectedAtendente
    });

    if (!response.data.success) throw new Error(response.data.error || "Erro ao redirecionar atendimento.");

    alert("Atendimento redirecionado com sucesso.");
    setAtendimentos(atendimentos.filter(a => a._id !== selectedAtendimento._id)); // Remove da lista
    setSelectedAtendimento(null);
    setShowRedirectModal(false);
} catch (error) {
    console.error("❌ Erro ao redirecionar atendimento:", error);
    alert("Erro ao redirecionar atendimento.");
}

};


  // ✅ Atualiza mensagens automaticamente sem duplicação
  useEffect(() => {
    if (!selectedAtendimento) return;

    const interval = setInterval(async () => {
        try {
            const res = await api.get(`/atendimentos/${selectedAtendimento._id}/mensagens`);

            // 🔥 Evita duplicação verificando se a mensagem já existe no estado
            setMensagens((prevMensagens) => {
                const novasMensagens = res.data.filter(
                    (msg) => !prevMensagens.some((prevMsg) => prevMsg._id === msg._id)
                );
                return [...prevMensagens, ...novasMensagens];
            });

            if (isAtBottomRef.current) {
                scrollToBottom();
            }
        } catch (err) {
            console.error('❌ Erro ao buscar novas mensagens:', err);
        }
    }, 3000);

    return () => clearInterval(interval);
}, [selectedAtendimento]);


  // ✅ Enviar mensagem ou arquivo
  const enviarMensagem = async (e) => {
    e.preventDefault();
    if (!selectedAtendimento || (!mensagem.trim() && !arquivo)) return;

    try {
        const formData = new FormData();
        if (mensagem.trim()) formData.append("conteudo", mensagem);
        if (arquivo) formData.append("arquivo", arquivo);

        setSending(true);
        await api.post(`/atendimentos/${selectedAtendimento._id}/enviar`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });

        setMensagem('');
        setArquivo(null);
        setSending(false);
        scrollToBottom();
    } catch (err) {
        console.error('❌ Erro ao enviar mensagem:', err);
        setSending(false);
    }
};


  // 🔄 Rolar para o final do chat
  const scrollToBottom = () => {
    setTimeout(() => {
      if (messagesBoxRef.current) {
        messagesBoxRef.current.scrollTop = messagesBoxRef.current.scrollHeight;
      }
    }, 100);
  };

  const handleLogout = () => {
    console.log("🔴 Saindo do sistema...");
    localStorage.removeItem('token');
    sessionStorage.clear();
    window.location.href = "/login";
  };

  return (
    <div className="chat-container flex h-screen">
      {/* Sidebar */}
      <div className="sidebar w-80 min-w-[320px] bg-gray-800 text-white p-4 flex flex-col">
        <div className="sidebar-header mb-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold">Atendimentos</h2>
        </div>

        {/* Botões Dashboard e Logout */}
        <div className="sidebar-actions mb-4 flex flex-col space-y-2">
          {user?.tipo === "admin" && (
            <button className="dashboard-button bg-blue-500 text-white p-2 rounded" onClick={() => window.location.href = "/dashboard"}>
              Dashboard
            </button>
          )}
          <button className="logout-button bg-red-500 text-white p-2 rounded" onClick={handleLogout}>
            Sair
          </button>
        </div>

        {/* Lista de atendimentos */}
        <div className="conversas-list flex-1 overflow-y-auto">
          {atendimentos.map((atendimento) => (
            <div
              key={atendimento._id}
              className={`conversa-item p-2 hover:bg-gray-700 rounded cursor-pointer ${selectedAtendimento?._id === atendimento._id ? 'bg-gray-600' : ''}`}
              onClick={() => handleSelecionarAtendimento(atendimento)}
            >
              <p className="font-semibold">{atendimento.cliente.nome || "Cliente Anônimo"}</p>
              <p className="text-sm text-gray-400">
                <strong>{atendimento.messages.length > 0 ? atendimento.messages[atendimento.messages.length - 1].name : "Sem mensagens"}:</strong> 
                {" "}{atendimento.messages.length > 0 ? atendimento.messages[atendimento.messages.length - 1].text : "Nenhuma mensagem ainda"}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Chat */}
      <div className="chat-box flex-1 flex flex-col bg-white p-6">
        {selectedAtendimento ? (
          <>
            <h2 className="text-xl font-bold mb-4">{selectedAtendimento.cliente.nome}</h2>
            
            <div ref={messagesBoxRef} className="messages-box flex-1 overflow-y-auto">
              {mensagens.length === 0 ? (
                <p className="text-center text-gray-500">Sem mensagens</p>
              ) : (
                mensagens.map((msg) => (
                  <div key={msg._id} className={`message-container flex ${msg.from === selectedAtendimento.cliente.telefone ? 'justify-start' : 'justify-end'}`}>
                    <div className={`message-box p-3 rounded-lg max-w-[70%] ${msg.from === selectedAtendimento.cliente.telefone ? 'received' : 'sent'}`}>
                      <p className="text-sm font-semibold">
                        {msg.from === selectedAtendimento.cliente.telefone ? selectedAtendimento.cliente.nome : "Você"}
                      </p>

                      {/* 📩 Exibir mensagens de texto */}
                      {msg.text && <p className="content mt-1">{msg.text}</p>}

                      {/* 🖼️ Exibir imagem reduzida */}
                      {msg.mediaType === "image" && msg.mediaUrl && (
                        <img src={msg.mediaUrl} alt="Imagem recebida" className="reduced-image" />
 
                      )}

                      {/* 🎵 Exibir áudio recebido */}
                      {msg.mediaType === "audio" && msg.mediaUrl && (
                        <audio controls className="mt-2">
                          <source src={msg.mediaUrl} type="audio/ogg" />
                          Seu navegador não suporta áudio.
                        </audio>
                      )}

                      {/* 📄 Exibir documento recebido */}
                      {msg.mediaType === "document" && msg.mediaUrl && (
                        <a href={msg.mediaUrl} target="_blank" rel="noopener noreferrer" className="mt-2 text-blue-500 underline">
                          📄 Baixar Documento
                        </a>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>


            {/* 🔹 Formulário de Envio */}
            <form onSubmit={enviarMensagem} className="mt-4 flex">
              <input 
                type="text" 
                className="w-full p-2 border rounded-l-md" 
                placeholder="Digite sua mensagem" 
                value={mensagem} 
                onChange={(e) => setMensagem(e.target.value)} 
              />

              <input 
                type="file" 
                onChange={(e) => setArquivo(e.target.files[0])}  
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="btn p-2 bg-gray-300 cursor-pointer">📎</label>

              <button type="submit" className="btn p-2 bg-blue-500 text-white rounded-r-md">
                {sending ? "Enviando..." : "Enviar"}
              </button>
            </form>

            {/* Botão flutuante de ações */}
            <div className="action-menu">
            <button className="action-button" onClick={toggleOptions}>+</button>
            {showOptions && (
              <div className="action-options">
                <button onClick={handleRedirectClick}>Redirecionar</button>
                <button onClick={handleEndConversation}>Encerrar Atendimento</button>
              </div>
            )}
          </div>


          {showRedirectModal && (
          <div className="modal">
            <div className="modal-content">
              <h3>Redirecionar Atendimento</h3>
              
              <label>Escolha um Atendente:</label>
              <select onChange={(e) => setSelectedAtendente(e.target.value)}>
                <option value="">Selecione</option>

                {Object.entries(agrupadosPorEmpresa(atendentes)).map(([empresa, atendentes]) => (
                  <optgroup key={empresa} label={empresa}>
                    {atendentes.map((at) => (
                      <option key={at._id} value={at._id}>
                        {at.nome} ({at.setor})
                      </option>
                    ))}
                  </optgroup>
                ))}
                
              </select>

              <button onClick={handleRedirect}>Confirmar</button>
              <button onClick={() => setShowRedirectModal(false)}>Cancelar</button>
            </div>
          </div>
        )}



          </>
        ) : (
          <p className="text-center text-gray-500">Selecione um atendimento</p>
        )}
      </div>
    </div>
  );
}

export default Chat;

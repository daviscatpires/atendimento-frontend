// api.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',  // Assegure-se de que o baseURL está correto
  headers: {
    Authorization: `Bearer ${localStorage.getItem('token')}`
  }
});
console.log(localStorage.getItem('token'));

// Função para buscar todas as mensagens
export const getMessages = async () => {
  try {
    const response = await api.get('/messages');
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar mensagens:', error);
    throw error;
  }
};

// Função para buscar mensagens de uma conversa específica
export const getConversation = async (contactId, page = 1) => {
  try {
    const response = await api.get(`/messages/conversation/${contactId}?page=${page}&limit=10`);
    return response.data;
  } catch (error) {
    console.error('❌ Erro ao buscar conversa:', error);
    throw error;
  }
};


// Função para enviar uma nova mensagem
export const sendMessage = async (conteudo, destinatarioId) => {
  try {
    const res = await api.post('/messages/send', {
      destinatarioId,
      conteudo,
    });

    return res.data;
  } catch (err) {
    console.error('❌ Erro ao enviar mensagem:', err);
    throw err;
  }
};



export default api;
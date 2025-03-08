// Login.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const navigate = useNavigate();  // Agora você pode usar o hook aqui!

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', { email, senha });
  
      console.log('Resposta do login:', res.data); // 🔍 Verifica o que o backend retorna
  
      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
        console.log('Token salvo:', localStorage.getItem('token')); // 🔍 Confirma se o token foi salvo
  
        window.location.href = "/chat"; // Redireciona para tela de chat
      } else {
        console.error('Erro: Token não recebido');
      }
    } catch (err) {
      console.error('Erro no login:', err.response?.data?.message || err);
    }
  };
  

  return (
    <div className="container">
      <h2 className="text-2xl font-bold mb-4">Login</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          className="block w-full mb-4 p-2 border rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
        />
        <input
          type="password"
          className="block w-full mb-4 p-2 border rounded"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          placeholder="Senha"
        />
        <button className="btn w-full">Entrar</button>
      </form>
    </div>
  );
}

export default Login;

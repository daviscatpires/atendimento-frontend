import React, { useEffect, useState } from "react";
import { BarChart, XAxis, YAxis, Tooltip, ResponsiveContainer, Bar, PieChart, Pie, Cell, LineChart, Line } from "recharts";import "./Dashboard.css";
import api from '../../api';


const Dashboard = () => {

 // Estados corrigidos
 const [dados, setDados] = useState(null);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState(null);

 useEffect(() => {
   const fetchDashboardData = async () => {
     try {
       const res = await api.get("/dashboard");
       console.log("📡 Dados recebidos da API:", res.data);
       setDados(res.data);
     } catch (error) {
       console.error("❌ Erro ao buscar dados do dashboard:", error);
       setError("Erro ao carregar dados.");
     } finally {
       setLoading(false);
     }
   };
   fetchDashboardData();
 }, []);

 // Evitar erro de `dados is not defined`
 if (loading) return <p className="loading-text">Carregando dados...</p>;
 if (error) return <p className="error-text">{error}</p>;
 if (!dados) return <p className="error-text">Nenhum dado disponível.</p>;
 

  // Função para calcular porcentagem dos atendimentos por setor
  const calcularPercentual = (setorTotal) => {
    return Number(((setorTotal / (dados.totalAtendimentos || 1)) * 100).toFixed(1));
  };


  // Cálculo do crescimento dos atendimentos
  const calcularCrescimento = () => {
    const meses = dados?.atendimentosUltimos3Meses || [];
    if (meses.length < 2) return "N/A"; // Corrigido para evitar erro com menos de 2 meses

    const penultimo = Number(meses[meses.length - 2]?.total ?? 0);
    const ultimo = Number(meses[meses.length - 1]?.total ?? 0);

    if (penultimo === 0) return "0%";
    const crescimento = ((ultimo - penultimo) / penultimo) * 100;
    return `${crescimento.toFixed(1)}%`;
  };

  // Função para deslogar
  const handleLogout = () => {
    console.log("🔴 Saindo do sistema...");
    localStorage.removeItem('token');
    sessionStorage.clear();
    window.location.href = "/login";
  };

  // Função para adicionar legenda nos gráficos
  const Legend = ({ items }) => (
    <div className="legend-container">
      {items.map(({ color, label }, index) => (
        <div key={index} className="legend-item">
          <span className="legend-color" style={{ backgroundColor: color }}></span>
          <span className="legend-text">{label}</span>
        </div>
      ))}
    </div>
  );
  
  // const calcularCrescimento = () => {
  //   const meses = dados.atendimentosUltimos3Meses;
  //   if (meses.length < 3) return "N/A";
  //   const penultimo = meses[1].total;
  //   const ultimo = meses[2].total;
  //   const crescimento = ((ultimo - penultimo) / penultimo) * 100;
  //   return `${crescimento.toFixed(1)}%`;
  // };

  return (
    <div className="dashboard-container">
      <h2 className="dashboard-title">📊 Dashboard de Atendimento</h2>
      <div className="logout-container">
        <button className="dashboard-button" onClick={() => window.location.href = "/chat"}>Chat</button>
        <button className="logout-button" onClick={handleLogout}>Sair</button>
      </div>

      <div className="dashboard-grid">
        
        {/* Atendimentos por usuário (TOP 3) */}
        <div className="card">
          <h3 className="card-title">👥 Top 3 Atendimentos por Usuário</h3>
          {dados.atendimentosPorUsuario
            .sort((a, b) => b.trintaDias - a.trintaDias) // Ordena do maior para o menor
            .slice(0, 2) // Pega apenas os 3 primeiros
            .map((usuario, index) => (
              <div key={index} className="user-card">
                <p className="user-name"><strong>{usuario.nome}</strong></p>
                <div className="user-details">
                  <p>📅 Hoje: {usuario.hoje}</p>
                  <p>🗓 Semana: {usuario.seteDias}</p>
                  <p>📆 Mês: {usuario.trintaDias}</p>
                </div>
                <div className="user-name">
                  <p>📆 Avaliação: {usuario.trintaDias}</p>
                  <p>📆 Tempo médio: {usuario.trintaDias} minutos</p>
                </div>
              </div>
            ))}
        </div>


        {/* Atendimentos Finalizados vs Abertos */}
        <div className="card">
          <h3 className="card-title">📌 Atendimentos Finalizados vs Abertos</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={[
              { name: "Hoje", finalizados: dados.atendimentosFinalizados.hoje, abertos: dados.atendimentosAbertos.hoje },
              { name: "Últimos 7 Dias", finalizados: dados.atendimentosFinalizados.seteDias, abertos: dados.atendimentosAbertos.seteDias },
              { name: "Últimos 30 Dias", finalizados: dados.atendimentosFinalizados.trintaDias, abertos: dados.atendimentosAbertos.trintaDias }
            ]}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="finalizados" fill="#4CAF50" name="Finalizados" />
              <Bar dataKey="abertos" fill="#F44336" name="Abertos" />
            </BarChart>
          </ResponsiveContainer>
          <p>📆 Hoje: {dados.atendimentosAbertos.hoje} em aberto</p>
          <p>📅 Últimos 7 Dias: {dados.atendimentosAbertos.seteDias} em aberto</p>
          <p>📅 Últimos 30 Dias: {dados.atendimentosAbertos.trintaDias} em aberto</p>

        </div>

        {/* 📭 Conversas Não Respondidas */}
        <div className="card">
          <h3 className="card-title">📭 Conversas Não Respondidas</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={[
                  { name: "Não Respondidas", value: dados.conversasRecebidas - dados.conversasRespondidas.hoje },
                  { name: "Respondidas", value: dados.conversasRespondidas.hoje }
                ]}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#FF6384"
              >
                <Cell fill="#FF6384" />
                <Cell fill="#36A2EB" />
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <Legend
            items={[
              { color: "#FF6384", label: "Não Respondidas" },
              { color: "#36A2EB", label: "Respondidas" }
            ]}
          />
          <p>📆 Hoje: {dados.conversasRecebidas - dados.conversasRespondidas.hoje} conversas não respondidas</p>
          <p>📅 Últimos 7 Dias: {dados.conversasRecebidas - dados.conversasRespondidas.seteDias}</p>
          <p>📅 Últimos 30 Dias: {dados.conversasRecebidas - dados.conversasRespondidas.trintaDias}</p>
        </div>


        {/* Retenção de Cliente */}
        <div className="card">
          <h3 className="card-title">🔄 Retenção de Cliente</h3>
          <p className="card-value">{dados.retencaoClientes}%</p>

          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={[{ name: "Não Retidas", value: 100 - dados.retencaoClientes }, { name: "Retidas", value: dados.retencaoClientes}]} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#FF6384">
                <Cell fill="#FF6384" />
                <Cell fill="#36A2EB" />
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <Legend items={[
            { color: "#36A2EB", label: "Retidos" },
            { color: "#FF6384", label: "Não Retidos" }
          ]} />
        </div>

        {/* Comparação com Período Anterior */}
        <div className="card">
          <h3 className="card-title">📊 Comparação dos Últimos 3 Meses</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={dados.atendimentosUltimos3Meses}>
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="total" fill="#36A2EB" barSize={50} />
            </BarChart>
          </ResponsiveContainer>
          <p className="text-center font-semibold">📈 Crescimento do Último Mês: <span className="text-green-600">{calcularCrescimento()}</span></p>
        </div>

        {/* Setores Mais Solicitados */}
      <div className="card">
        <h3 className="card-title">🏢 Setores Mais Solicitados</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={dados.setoresMaisSolicitados}>
            <XAxis dataKey="setor" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="total" fill="#36A2EB" />
          </BarChart>
        </ResponsiveContainer>
      </div>


        {/* Avaliação do Bot */}
        <div className="card">
          <h3 className="card-title">🤖 Avaliação do Bot</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={dados.avaliacaoBot.meses}>
              <XAxis dataKey="mes" />
              <YAxis domain={[3.5, 5]} />
              <Tooltip />
              <Line type="monotone" dataKey="valor" stroke="#36A2EB" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>


        {/* 📩 Conversas Iniciadas pela Empresa */}
        <div className="card">
          <h3 className="card-title">📩 Conversas Iniciadas pela Empresa</h3>
          <p className="card-value">{dados.conversasIniciadas} conversas</p>
        </div>

        {/* 📥 Conversas Iniciadas pelo Cliente */}
        <div className="card">
          <h3 className="card-title">📥 Conversas Iniciadas pelo Cliente</h3>
          <p className="card-value">{dados.conversasRecebidas} conversas</p>
        </div>

        {/* Tempo médio de atendimento */}
        <div className="card">
          <h3 className="card-title">⏳ Tempo Médio de Atendimento</h3>
          <p className="card-value">Hoje: {dados.tempoMedioAtendimento.hoje} min</p>
          <p className="card-value">Últimos 7 Dias: {dados.tempoMedioAtendimento.seteDias} min</p>
          <p className="card-value">Últimos 30 Dias: {dados.tempoMedioAtendimento.trintaDias} min</p>          <ResponsiveContainer width="100%" height={250}>
              <LineChart data={dados?.tempoMedioAtendimento?.meses?.length ? dados.tempoMedioAtendimento.meses : [{ mes: "Sem Dados", valor: 0 }]}>              
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="valor" stroke="#4CAF50" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

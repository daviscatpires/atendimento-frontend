/* eslint-disable react/prop-types */
import  { useEffect, useState } from "react";
import { BarChart, XAxis, YAxis, Tooltip, ResponsiveContainer, Bar, LineChart, Line } from "recharts";import "./Dashboard.css";
import api from '../../api';


const Dashboard = () => {

 // Estados corrigidos
 const [dados, setDados] = useState({
  atendimentosAbertos: { hoje: 0, seteDias: 0, trintaDias: 0 },
  atendimentosFinalizados: { hoje: 0, seteDias: 0, trintaDias: 0 },
  atendimentosPorUsuario: [],
  atendimentosUltimos3Meses: [],
  setoresMaisSolicitados: [],
  tempoMedioAtendimento: { hoje: "0.0", seteDias: "0.0", trintaDias: "0.0" },
  avaliacaoBot: { meses: [{ mes: "Sem Dados", valor: 0 }] },
  avaliacaoPorUsuario: [],
  retencaoClientes: "0.0"
});
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
  // eslint-disable-next-line no-unused-vars
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

  const setores = dados?.setoresMaisSolicitados?.length 
    ? dados.setoresMaisSolicitados 
    : [{ setor: "Nenhum dado", total: 0 }];

  const atendimentos3Meses = dados?.atendimentosUltimos3Meses?.length 
    ? dados.atendimentosUltimos3Meses 
    : [{ mes: "Sem Dados", total: 0 }];    

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
          {(dados?.atendimentosPorUsuario?.length ? dados.atendimentosPorUsuario : [{ atendente: "Nenhum dado", hoje: 0, seteDias: 0, trintaDias: 0, tempoMedio: "N/A", avaliacao: "N/A" }])
            .sort((a, b) => b.totalAtendimentos - a.totalAtendimentos)
            .slice(0, 3)
            .map((usuario, index) => (
              <div key={index} className="user-card">
                <p className="user-name"><strong>{usuario.atendente ?? "Desconhecido"}</strong></p>
                <div className="user-details">
                  <p>📅 Hoje: {usuario.hoje ?? 0}</p>
                  <p>🗓 Semana: {usuario.seteDias ?? 0}</p>
                  <p>📆 Mês: {usuario.totalAtendimentos ?? 0}</p>
                </div>
                <div className="user-name">
                  <p>📆 Avaliação: {usuario.avaliacao ?? "N/A"}</p>
                  <p>📆 Tempo médio: {usuario.tempoMedio ?? "N/A"} minutos</p>
                </div>
              </div>
            ))}

          {/* 🔹 Botão "Ver Mais" que leva para a página de todos os atendentes */}
          <div className="view-more-container">
            <a href="/atendentes" className="view-more-button">👀 Ver Mais</a>
          </div>
        </div>


        {/* 📌 Atendimentos Finalizados vs Abertos */}
        <div className="card">
          <h3 className="card-title">📌 Atendimentos Finalizados vs Abertos</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={[
              { name: "Hoje", finalizados: dados?.atendimentosFinalizados?.hoje ?? 0, abertos: dados?.atendimentosAbertos?.hoje ?? 0 },
              { name: "Últimos 7 Dias", finalizados: dados?.atendimentosFinalizados?.seteDias ?? 0, abertos: dados?.atendimentosAbertos?.seteDias ?? 0 },
              { name: "Últimos 30 Dias", finalizados: dados?.atendimentosFinalizados?.trintaDias ?? 0, abertos: dados?.atendimentosAbertos?.trintaDias ?? 0 }
            ]}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="finalizados" fill="#4CAF50" name="Finalizados" />
              <Bar dataKey="abertos" fill="#F44336" name="Abertos" />
            </BarChart>
          </ResponsiveContainer>
          
          <p>📆 Hoje: {dados?.atendimentosAbertos?.hoje ?? 0} em aberto</p>
          <p>📅 Últimos 7 Dias: {dados?.atendimentosAbertos?.seteDias ?? 0} em aberto</p>
          <p>📅 Últimos 30 Dias: {dados?.atendimentosAbertos?.trintaDias ?? 0} em aberto</p>

          {/* 🔹 Lista de Atendimentos Abertos - Botões estilizados */}
          <h4 className="card-subtitle">📂 Atendimentos Abertos</h4>
          <div className="open-appointments-container">
            {dados?.atendimentosAbertosDetalhes?.length > 0 ? (
              dados.atendimentosAbertosDetalhes.map((conversa) => (
              <a key={conversa._id} href={`/chat?atendimentoId=${conversa._id}`} className="open-appointment-card">
                <div className="appointment-info">
                  <strong>🔴 {conversa.cliente?.nome || "Cliente Desconhecido"}</strong>
                  <p>📅 {new Date(conversa.inicioAtendimento).toLocaleString()}</p>
                </div>
                <button className="open-appointment-button">Responder 🔗</button>
              </a>

              ))
            ) : (
              <p className="no-open-appointments">✅ Nenhum atendimento aberto no momento.</p>
            )}
          </div>
        </div>

        {/* 📭 Conversas Não Respondidas vs Respondidas */}
        <div className="card">
          <h3 className="card-title">📭 Conversas Não Respondidas vs Respondidas</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={[
              { name: "Hoje", naoRespondidas: dados?.conversasNaoRespondidas?.hoje ?? 0, respondidas: dados?.conversasRecebidas?.hoje ?? 0 },
              { name: "Últimos 7 Dias", naoRespondidas: dados?.conversasNaoRespondidas?.seteDias ?? 0, respondidas: dados?.conversasRecebidas?.seteDias ?? 0 },
              { name: "Últimos 30 Dias", naoRespondidas: dados?.conversasNaoRespondidas?.trintaDias ?? 0, respondidas: dados?.conversasRecebidas?.trintaDias ?? 0 }
            ]}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="naoRespondidas" fill="#F44336" name="Não Respondidas" />
              <Bar dataKey="respondidas" fill="#4CAF50" name="Respondidas" />
            </BarChart>
          </ResponsiveContainer>

          <p>📆 Hoje: {dados?.conversasNaoRespondidas?.hoje ?? 0} conversas não respondidas</p>
          <p>📅 Últimos 7 Dias: {dados?.conversasNaoRespondidas?.seteDias ?? 0} conversas não respondidas</p>
          <p>📅 Últimos 30 Dias: {dados?.conversasNaoRespondidas?.trintaDias ?? 0} conversas não respondidas</p>

          {/* 🔹 Lista de Conversas Não Respondidas - Botões estilizados */}
          <h4 className="card-subtitle">📂 Conversas Não Respondidas</h4>
          <div className="open-appointments-container">
            {dados?.conversasNaoRespondidasDetalhes?.length > 0 ? (
              dados.conversasNaoRespondidasDetalhes.map((conversa) => (
              <a key={conversa._id} href={`/chat?atendimentoId=${conversa._id}`} className="open-appointment-card">
                <div className="appointment-info">
                  <strong>🔴 {conversa.cliente?.nome || "Cliente Desconhecido"}</strong>
                  <p>📅 {new Date(conversa.ultimaMensagem?.timestamp).toLocaleString()}</p>
                </div>
                <button className="open-appointment-button">Responder 🔗</button>
              </a>

              ))
            ) : (
              <p className="no-open-appointments">✅ Nenhuma conversa não respondida no momento.</p>
            )}
          </div>
        </div>

        {/* Retenção de Cliente
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
        </div> */}

        {/* 📊 Comparação com Período Anterior */}
        <div className="card">
          <h3 className="card-title">📊 Comparação de atendimento dos Últimos 3 Meses</h3>
          
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={atendimentos3Meses}>
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="total" fill="#36A2EB" barSize={50} />
            </BarChart>
          </ResponsiveContainer>

          {/* 🔹 Exibir crescimento e uma descrição extra */}
          <p className="text-center font-semibold mt-2">
            📈 Crescimento de atendimento do Último Mês: <span className="text-green-600">{calcularCrescimento()}</span>
          </p>
        </div>

        {/* 🏢 Setores Mais Solicitados */}
        <div className="card">
          <h3 className="card-title">🏢 Setores Mais Solicitados</h3>
          
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={setores}>
              <XAxis dataKey="setor" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="total" fill="#36A2EB" />
            </BarChart>
          </ResponsiveContainer>

          {/* 🔹 Listagem dos setores mais solicitados abaixo do gráfico */}
          <div className="sector-list">
            {setores.length > 0 ? (
              setores.map((s, index) => (
                <p key={index} className="sector-item">
                  <strong>{s.setor}:</strong> {s.total} atendimentos
                </p>
              ))
            ) : (
              <p className="text-gray-500 text-sm text-center mt-2">Nenhum setor encontrado.</p>
            )}
          </div>
        </div>


        {/* Avaliação do Bot */}
        <div className="card">
          <h3 className="card-title">🤖 Avaliação do Bot</h3>
          
          {/* 🔹 Exibir a Nota Geral do Bot */}
          <p className="card-value">⭐ Nota Geral: {dados?.avaliacaoBot?.geral ?? "N/A"}</p>

          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={dados?.avaliacaoBot?.meses?.length ? dados.avaliacaoBot.meses : [{ mes: "Sem Dados", valor: 0 }]}>
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
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={[
              { periodo: "Hoje", total: dados.conversasIniciadas.hoje },
              { periodo: "Últimos 7 Dias", total: dados.conversasIniciadas.seteDias },
              { periodo: "Últimos 30 Dias", total: dados.conversasIniciadas.trintaDias }
            ]}>
              <XAxis dataKey="periodo" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="total" stroke="#36A2EB" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* 📥 Conversas Iniciadas pelo Cliente */}
        <div className="card">
          <h3 className="card-title">📥 Conversas Iniciadas pelo Cliente</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={[
              { periodo: "Hoje", total: dados.conversasRecebidas.hoje },
              { periodo: "Últimos 7 Dias", total: dados.conversasRecebidas.seteDias },
              { periodo: "Últimos 30 Dias", total: dados.conversasRecebidas.trintaDias }
            ]}>
              <XAxis dataKey="periodo" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="total" stroke="#F44336" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>


        {/* ⏳ Tempo Médio de Atendimento */}
        <div className="card">
          <h3 className="card-title">⏳ Tempo Médio de Atendimento</h3>
          <p className="card-value"><strong>Geral:</strong> {dados?.tempoMedioAtendimento?.geral ?? "0.0"} min</p> {/* Exibindo o tempo médio geral acima do gráfico */}
          
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={[
              { periodo: "Hoje", total: parseFloat(dados?.tempoMedioAtendimento?.hoje ?? 0) },
              { periodo: "Últimos 7 Dias", total: parseFloat(dados?.tempoMedioAtendimento?.seteDias ?? 0) },
              { periodo: "Últimos 30 Dias", total: parseFloat(dados?.tempoMedioAtendimento?.trintaDias ?? 0) }
            ]}>
              <XAxis dataKey="periodo" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="total" fill="#36A2EB" />
            </BarChart>
          </ResponsiveContainer>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;

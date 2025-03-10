import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from '../../api';
import "./Atendentes.css";

const Atendentes = () => {
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAtendentes = async () => {
      try {
        const res = await api.get("/dashboard/atendentes");
        setDados(res.data);
      } catch (error) {
        console.error("❌ Erro ao buscar atendentes:", error);
        setError("Erro ao carregar dados.");
      } finally {
        setLoading(false);
      }
    };
    fetchAtendentes();
  }, []);

  if (loading) return <p className="loading-text">Carregando dados...</p>;
  if (error) return <p className="error-text">{error}</p>;
  if (!dados || !dados.length) return <p className="error-text">Nenhum atendente encontrado.</p>;

  return (
    <div className="atendentes-container">
      <h2 className="atendentes-title">👥 Todos os Atendentes</h2>
      <div className="logout-container">
        <button className="logout-button" onClick={() => navigate(`/dashboard`)}>✏️ Voltar</button>
      </div>

      <div className="atendentes-list">
        {dados.map((usuario, index) => (
          <div key={index} className="atendente-card">
            <p className="atendente-name"><strong>{usuario.atendente ?? "Desconhecido"}</strong></p>
            <p className="atendente-info">🏢 {usuario.empresa ?? "Não informado"}</p>
            <p className="atendente-info">📌 {usuario.setor ?? "Não informado"}</p>
            <div className="atendente-details">
              <p>📆 Mês: {usuario.totalAtendimentos ?? 0}</p>
              <p>📆 Avaliação: {usuario.avaliacao ?? "N/A"}</p>
              <p>⏳ Tempo médio: {usuario.tempoMedio ?? "N/A"} min</p>
            </div>
            <button className="edit-button" onClick={() => navigate(`/atendentes/editar/${usuario._id}`)}>✏️ Editar</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Atendentes;

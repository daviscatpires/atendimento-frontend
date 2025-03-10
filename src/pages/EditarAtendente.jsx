import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api";
import "./EditarAtendente.css";

const EditarAtendente = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ nome: "", setor: "", empresa: "", senha: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAtendente = async () => {
      try {
        const res = await api.get(`/dashboard/atendentes/${id}`);
        setFormData(res.data);
      } catch (error) {
        console.error("❌ Erro ao buscar atendente:", error);
        setError("Erro ao carregar dados.");
      } finally {
        setLoading(false);
      }
    };
    fetchAtendente();
  }, [id]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/dashboard/atendentes/${id}`, formData);
      alert("Atendente atualizado com sucesso!");
      navigate("/atendentes");
    } catch (error) {
      console.error("❌ Erro ao atualizar atendente:", error);
      alert("Erro ao atualizar atendente.");
    }
  };

  if (loading) return <p className="loading-text">Carregando dados...</p>;
  if (error) return <p className="error-text">{error}</p>;

  return (
    <div className="editar-atendente-container">
      <h2>✏️ Editar Atendente</h2>
      <form onSubmit={handleSubmit}>
        <label>Nome:</label>
        <input type="text" name="nome" value={formData.nome} onChange={handleChange} required />
        
        <label>Setor:</label>
        <input type="text" name="setor" value={formData.setor} onChange={handleChange} required />

        <label>Empresa:</label>
        <input type="text" name="empresa" value={formData.empresa} onChange={handleChange} required />

        <label>Nova Senha (opcional):</label>
        <input type="password" name="senha" value={formData.senha} onChange={handleChange} />

        <button type="submit">Salvar Alterações</button>
        <button type="button" className="cancel-button" onClick={() => navigate("/atendentes")}>Cancelar</button>
      </form>
    </div>
  );
};

export default EditarAtendente;

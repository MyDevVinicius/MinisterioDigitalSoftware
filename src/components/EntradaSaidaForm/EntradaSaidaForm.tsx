import React, { useState, useEffect, FormEvent } from "react";
import styled from "styled-components";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Tipagem da entrada/saída
interface EntradaSaida {
  observacao: string;
  tipoTransacao: "Entrada" | "Saida"; // Tipo de transação
  tipo:
    | "Dizimo"
    | "Oferta"
    | "Doacao"
    | "Campanha"
    | "Pagamento"
    | "Salario"
    | "Ajuda de Custo"; // Tipo de transação
  formaPagamento: "Dinheiro" | "PIX" | "Debito" | "Credito";
  valor: number;
  dataTransacao: string; // Data da transação (Entrada ou Saída)
  membroId?: number; // ID do membro (se entrada)
}

interface Membro {
  id: number;
  nome: string;
}

const Container = styled.div`
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 8px;
  background-color: #f9f9f9;

  @media (max-width: 768px) {
    max-width: 100%;
    padding: 15px;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const Label = styled.label`
  font-size: 16px;
  margin-bottom: 5px;
`;

const Input = styled.input`
  padding: 10px;
  font-size: 16px;
  border: 1px solid #ccc;
  border-radius: 4px;
`;

const Select = styled.select`
  padding: 10px;
  font-size: 16px;
  border: 1px solid #ccc;
  border-radius: 4px;
`;

const Button = styled.button`
  padding: 10px;
  background-color: #007bff;
  color: white;
  font-size: 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    background-color: #0056b3;
  }
`;

const EntradaSaidaForm: React.FC = () => {
  const [formData, setFormData] = useState<EntradaSaida>({
    observacao: "",
    tipoTransacao: "Entrada", // Tipo de transação default
    tipo: "Dizimo", // Tipo default para entrada
    formaPagamento: "Dinheiro",
    valor: 0,
    dataTransacao: new Date().toISOString().slice(0, 19),
  });

  const [membros, setMembros] = useState<Membro[]>([]);

  useEffect(() => {
    const fetchMembros = async () => {
      try {
        const nomeBanco = localStorage.getItem("nome_banco");
        const chaveVerificacao = localStorage.getItem("codigo_verificacao");

        if (!nomeBanco || !chaveVerificacao) {
          toast.error("Nome do banco ou chave de verificação não encontrados!");
          return;
        }

        const response = await fetch("/api/memberList", {
          method: "GET",
          headers: {
            "x-verificacao-chave": chaveVerificacao,
            "x-nome-banco": nomeBanco,
          },
        });

        if (!response.ok) {
          throw new Error("Erro ao buscar membros");
        }

        const data = await response.json();
        setMembros(data.membros || []); // Armazena os membros na variável de estado
      } catch (error) {
        toast.error("Erro ao carregar membros.");
      }
    };

    if (formData.tipoTransacao === "Entrada") {
      fetchMembros();
    }
  }, [formData.tipoTransacao]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const nomeBanco = localStorage.getItem("nome_banco");
    const chaveVerificacao = localStorage.getItem("codigo_verificacao");

    if (!nomeBanco || !chaveVerificacao) {
      toast.error("Nome do banco ou chave de verificação não encontrados!");
      return;
    }

    try {
      const response = await fetch("/api/entradasaida", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-verificacao-chave": chaveVerificacao,
          "x-nome-banco": nomeBanco,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message);
        setFormData({
          observacao: "",
          tipoTransacao: "Entrada",
          tipo: "Dizimo",
          formaPagamento: "Dinheiro",
          valor: 0,
          dataTransacao: new Date().toISOString().slice(0, 19),
        });
      } else {
        toast.error(data.message || "Erro ao registrar transação.");
      }
    } catch (error) {
      toast.error("Erro ao enviar dados.");
    }
  };

  return (
    <Container>
      <h2>Registrar Entrada/Saída</h2>
      <Form onSubmit={handleSubmit}>
        <Label>Observação</Label>
        <Input
          type="text"
          name="observacao"
          value={formData.observacao}
          onChange={handleChange}
        />
        <Label>Tipo de Transação</Label>
        <Select
          name="tipoTransacao"
          value={formData.tipoTransacao}
          onChange={handleChange}
        >
          <option value="Entrada">Entrada</option>
          <option value="Saida">Saída</option>
        </Select>
        <Label>Tipo</Label>
        <Select name="tipo" value={formData.tipo} onChange={handleChange}>
          <option value="Dizimo">Dízimo</option>
          <option value="Oferta">Oferta</option>
          <option value="Doacao">Doação</option>
          <option value="Campanha">Campanha</option>
          <option value="Pagamento">Pagamento</option>
          <option value="Salario">Salário</option>
          <option value="Ajuda de Custo">Ajuda de Custo</option>
        </Select>
        {formData.tipoTransacao === "Entrada" && formData.tipo === "Dizimo" && (
          <>
            <Label>Membro</Label>
            <Select
              name="membroId"
              value={formData.membroId || ""}
              onChange={handleChange}
            >
              <option value="">Selecione um Membro</option>
              {membros.map((membro) => (
                <option key={membro.id} value={membro.id}>
                  {membro.nome}
                </option>
              ))}
            </Select>
          </>
        )}
        <Label>Forma de Pagamento</Label>
        <Select
          name="formaPagamento"
          value={formData.formaPagamento}
          onChange={handleChange}
        >
          <option value="Dinheiro">Dinheiro</option>
          <option value="PIX">PIX</option>
          <option value="Debito">Débito</option>
          <option value="Credito">Crédito</option>
        </Select>
        <Label>Valor</Label>
        <Input
          type="number"
          name="valor"
          value={formData.valor}
          onChange={handleChange}
        />
        <Label>Data da Transação</Label>
        <Input
          type="datetime-local"
          name="dataTransacao"
          value={formData.dataTransacao}
          onChange={handleChange}
        />
        <Button type="submit">Registrar Transação</Button>
      </Form>
      <ToastContainer />
    </Container>
  );
};

export default EntradaSaidaForm;

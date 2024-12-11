// src/components/EntradaSaidaForm.tsx
import React, { useState, useEffect, FormEvent } from "react";
import styled from "styled-components";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Definindo a tipagem da entrada/saída
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
  const [isMembro, setIsMembro] = useState<boolean>(true);

  useEffect(() => {
    // Função para buscar os membros da API
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

    // Carrega os membros quando o tipo de transação for "Entrada"
    if (formData.tipoTransacao === "Entrada") {
      fetchMembros();
    }
  }, [formData.tipoTransacao]); // Dependência para carregar quando o tipo de transação mudar

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));

    if (name === "tipoTransacao") {
      setIsMembro(value === "Entrada");
    }
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
      const response = await fetch(`/api/entradasaida?banco=${nomeBanco}`, {
        method: "POST",
        body: JSON.stringify(formData),
        headers: {
          "Content-Type": "application/json",
          "x-verificacao-chave": chaveVerificacao, // Enviando a chave de verificação
          "x-nome-banco": nomeBanco, // Enviando o nome do banco
        },
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Entrada/Saída registrada com sucesso!");
        setFormData({
          observacao: "",
          tipoTransacao: "Entrada",
          tipo: "Dizimo",
          formaPagamento: "Dinheiro",
          valor: 0,
          dataTransacao: new Date().toISOString().slice(0, 19),
        });
      } else {
        toast.error(data.message || "Erro ao registrar entrada/saída.");
      }
    } catch (error) {
      toast.error("Erro ao registrar entrada/saída.");
    }
  };

  return (
    <Container>
      <h2>Adicionar Entrada/Saída</h2>
      <Form onSubmit={handleSubmit}>
        <div>
          <Label htmlFor="observacao">Observação:</Label>
          <Input
            type="text"
            id="observacao"
            name="observacao"
            value={formData.observacao}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <Label htmlFor="tipoTransacao">Tipo de Transação:</Label>
          <Select
            id="tipoTransacao"
            name="tipoTransacao"
            value={formData.tipoTransacao}
            onChange={handleChange}
          >
            <option value="Entrada">Entrada</option>
            <option value="Saida">Saída</option>
          </Select>
        </div>

        <div>
          <Label htmlFor="tipo">Tipo:</Label>
          <Select
            id="tipo"
            name="tipo"
            value={formData.tipo}
            onChange={handleChange}
            disabled={formData.tipoTransacao === "Saida"}
          >
            <option value="Dizimo">Dizimo</option>
            <option value="Oferta">Oferta</option>
            <option value="Doacao">Doacao</option>
            <option value="Campanha">Campanha</option>
            <option value="Pagamento">Pagamento</option>
            <option value="Salario">Salario</option>
            <option value="Ajuda de Custo">Ajuda de Custo</option>
          </Select>
        </div>

        <div>
          <Label htmlFor="valor">Valor:</Label>
          <Input
            type="number"
            id="valor"
            name="valor"
            value={formData.valor}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <Label htmlFor="formaPagamento">Forma de Pagamento:</Label>
          <Select
            id="formaPagamento"
            name="formaPagamento"
            value={formData.formaPagamento}
            onChange={handleChange}
          >
            <option value="Dinheiro">Dinheiro</option>
            <option value="PIX">PIX</option>
            <option value="Debito">Débito</option>
            <option value="Credito">Crédito</option>
          </Select>
        </div>

        {isMembro && (
          <div>
            <Label htmlFor="membroId">Membro:</Label>
            <Select
              id="membroId"
              name="membroId"
              value={formData.membroId || ""}
              onChange={handleChange}
            >
              <option value="">Selecione o membro</option>
              {membros.map((membro) => (
                <option key={membro.id} value={membro.id}>
                  {membro.nome}
                </option>
              ))}
            </Select>
          </div>
        )}

        <Button type="submit">Registrar</Button>
      </Form>
      <ToastContainer />
    </Container>
  );
};

export default EntradaSaidaForm;

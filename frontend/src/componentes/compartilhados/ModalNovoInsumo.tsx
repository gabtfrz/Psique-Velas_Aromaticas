import { useCallback, useEffect, useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal } from "@/componentes/ui/Modal";
import { Campo } from "@/componentes/ui/Campo";
import { CampoSelecao } from "@/componentes/ui/CampoSelecao";
import { CampoMonetario } from "@/componentes/ui/CampoMonetario";
import { Botao } from "@/componentes/ui/Botao";
import { schemaInsumo } from "@/utils/validadores";
import type { EntradaInsumo } from "@/utils/validadores";
import { calcularPrecoUnitario } from "@/utils/calculadores";
import { OPCOES_CATEGORIA_INSUMO, OPCOES_UNIDADE_MEDIDA } from "@/constantes";
import type { Insumo } from "@/tipos";

// ─── Conversores ─────────────────────────────────────────────────────────────

function insumoParaEntrada(i: Insumo): EntradaInsumo {
  return {
    nome: i.nome,
    categoria: i.categoria,
    unidadeMedida: i.unidadeMedida,
    precoUnitario: i.precoUnitario,
    fornecedor: i.fornecedor,
    quantidadeEmbalagem: i.quantidadeEmbalagem,
    precoEmbalagem: i.precoEmbalagem,
  };
}

const valoresIniciais: EntradaInsumo = {
  nome: "",
  categoria: "cera",
  unidadeMedida: "g",
  precoUnitario: 0,
  fornecedor: "",
  quantidadeEmbalagem: undefined,
  precoEmbalagem: undefined,
};

// ─── Props ───────────────────────────────────────────────────────────────────

interface PropsModalNovoInsumo {
  aberto: boolean;
  aoFechar: () => void;
  aoSalvar: (dados: EntradaInsumo) => void;
  insumoParaEditar?: Insumo;
}

// ─── Componente ──────────────────────────────────────────────────────────────

export function ModalNovoInsumo({
  aberto,
  aoFechar,
  aoSalvar,
  insumoParaEditar,
}: PropsModalNovoInsumo) {
  // Fonte de verdade de "o preço unitário foi editado à mão": enquanto for `false`, o
  // preço unitário é auto-preenchido a partir da quantidade/preço da embalagem a cada
  // mudança; quando a gestora digita diretamente no campo, vira `true` e o cálculo
  // automático para de sobrescrever o valor (só "Recalcular da embalagem" volta a preenchê-lo).
  const [precoUnitarioEditadoManualmente, setPrecoUnitarioEditadoManualmente] =
    useState(false);

  const {
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<EntradaInsumo>({
    resolver: zodResolver(schemaInsumo) as Resolver<EntradaInsumo>,
    defaultValues: valoresIniciais,
  });

  useEffect(() => {
    if (aberto) {
      reset(
        insumoParaEditar
          ? insumoParaEntrada(insumoParaEditar)
          : valoresIniciais,
      );
      setPrecoUnitarioEditadoManualmente(false);
    }
  }, [aberto, insumoParaEditar, reset]);

  const unidadeSelecionada = watch("unidadeMedida");
  const quantidadeEmbalagemWatched = watch("quantidadeEmbalagem");
  const precoEmbalagemWatched = watch("precoEmbalagem");

  const aoMudarQuantidadeEmbalagem = useCallback(
    (v: string) => {
      const quantidade = v === "" ? undefined : Number(v);
      setValue("quantidadeEmbalagem", quantidade, { shouldValidate: true });
      if (precoUnitarioEditadoManualmente) {
        return;
      }
      setValue(
        "precoUnitario",
        calcularPrecoUnitario(precoEmbalagemWatched ?? 0, quantidade ?? 0),
        { shouldValidate: true },
      );
    },
    [setValue, precoEmbalagemWatched, precoUnitarioEditadoManualmente],
  );

  const aoMudarPrecoEmbalagem = useCallback(
    (v: number) => {
      setValue("precoEmbalagem", v, { shouldValidate: true });
      if (precoUnitarioEditadoManualmente) {
        return;
      }
      setValue(
        "precoUnitario",
        calcularPrecoUnitario(v, quantidadeEmbalagemWatched ?? 0),
        { shouldValidate: true },
      );
    },
    [setValue, quantidadeEmbalagemWatched, precoUnitarioEditadoManualmente],
  );

  const aoMudarPrecoUnitario = useCallback(
    (v: number) => {
      setValue("precoUnitario", v, { shouldValidate: true });
      setPrecoUnitarioEditadoManualmente(true);
    },
    [setValue],
  );

  const aoRecalcularPrecoUnitario = useCallback(() => {
    setValue(
      "precoUnitario",
      calcularPrecoUnitario(
        precoEmbalagemWatched ?? 0,
        quantidadeEmbalagemWatched ?? 0,
      ),
      { shouldValidate: true },
    );
    setPrecoUnitarioEditadoManualmente(false);
  }, [setValue, precoEmbalagemWatched, quantidadeEmbalagemWatched]);

  function onSubmit(dados: EntradaInsumo) {
    aoSalvar(dados);
  }

  const titulo = insumoParaEditar ? "Editar insumo" : "Novo insumo";
  const rotuloUnidade =
    OPCOES_UNIDADE_MEDIDA.find((o) => o.valor === unidadeSelecionada)?.rotulo ??
    "";

  return (
    <Modal aberto={aberto} aoFechar={aoFechar} titulo={titulo} largura="md">
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Campo
            rotulo="Nome"
            nome="nome"
            valor={watch("nome")}
            aoMudar={(v) => setValue("nome", v, { shouldValidate: true })}
            erro={errors.nome?.message}
            obrigatorio
          />

          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <CampoSelecao
              rotulo="Categoria"
              nome="categoria"
              opcoes={OPCOES_CATEGORIA_INSUMO}
              valor={watch("categoria")}
              aoMudar={(v) =>
                setValue("categoria", v as EntradaInsumo["categoria"], {
                  shouldValidate: true,
                })
              }
              erro={errors.categoria?.message}
            />
            <CampoSelecao
              rotulo="Unidade de medida"
              nome="unidadeMedida"
              opcoes={OPCOES_UNIDADE_MEDIDA}
              valor={watch("unidadeMedida")}
              aoMudar={(v) =>
                setValue("unidadeMedida", v as EntradaInsumo["unidadeMedida"], {
                  shouldValidate: true,
                })
              }
              erro={errors.unidadeMedida?.message}
            />
          </div>

          {/* Rótulos em uma linha só nas duas colunas (a unidade já aparece no campo
              "Unidade de medida" acima) para os inputs ficarem nivelados. */}
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <Campo
              rotulo="Qtde. embalagem"
              nome="quantidadeEmbalagem"
              tipo="number"
              valor={
                quantidadeEmbalagemWatched !== undefined
                  ? String(quantidadeEmbalagemWatched)
                  : ""
              }
              aoMudar={aoMudarQuantidadeEmbalagem}
              erro={errors.quantidadeEmbalagem?.message}
              placeholder={`Ex.: 1000${rotuloUnidade ? ` (${unidadeSelecionada})` : ""}`}
            />
            <CampoMonetario
              rotulo="Preço total da embalagem"
              nome="precoEmbalagem"
              valor={precoEmbalagemWatched}
              aoMudar={aoMudarPrecoEmbalagem}
              erro={errors.precoEmbalagem?.message}
            />
          </div>

          <div>
            <CampoMonetario
              rotulo="Preço unitário"
              nome="precoUnitario"
              valor={watch("precoUnitario")}
              aoMudar={aoMudarPrecoUnitario}
              erro={errors.precoUnitario?.message}
            />
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginTop: 4,
              }}
            >
              <p style={{ margin: 0, fontSize: 12, color: "var(--cor-muted)" }}>
                {precoUnitarioEditadoManualmente
                  ? "valor editado manualmente"
                  : "calculado da embalagem"}
              </p>
              <button
                type="button"
                onClick={aoRecalcularPrecoUnitario}
                style={{
                  fontSize: 12,
                  color: "var(--cor-musgo)",
                  background: "none",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                Recalcular da embalagem
              </button>
            </div>
          </div>

          <Campo
            rotulo="Fornecedor"
            nome="fornecedor"
            valor={watch("fornecedor") ?? ""}
            aoMudar={(v) => setValue("fornecedor", v, { shouldValidate: true })}
            erro={errors.fornecedor?.message}
            placeholder="Nome do fornecedor (opcional)"
          />

          {/* Ações */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 8,
              paddingTop: 8,
              borderTop: "1px solid var(--cor-argila-borda)",
            }}
          >
            <Botao variante="secundario" aoClicar={aoFechar} tipo="button">
              Cancelar
            </Botao>
            <Botao variante="primario" tipo="submit" carregando={isSubmitting}>
              {insumoParaEditar ? "Salvar alterações" : "Cadastrar insumo"}
            </Botao>
          </div>
        </div>
      </form>
    </Modal>
  );
}

export default ModalNovoInsumo;

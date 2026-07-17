// supabase/functions/criar-usuario/index.ts
//
// Edge Function `criar-usuario` — único caminho para cadastrar uma nova
// gestora no sistema. Roda inteiramente no servidor (Deno), nunca no
// frontend: quem chama precisa estar autenticada E ter `papel = 'master'`
// (validado aqui via RPC `eh_master()`, não confiando em nada vindo do body).
//
// Fluxo:
//   1) CORS (OPTIONS).
//   2) Só aceita POST, com body JSON { nome, cpf, telefone, email, senha }.
//   3) Autoriza o chamador: client com a ANON key + o JWT recebido no header
//      Authorization, chamando a RPC `eh_master()`. Se não for master -> 403.
//   4) Valida os dados de entrada (nome/telefone/email/senha/CPF).
//   5) Cria o usuário em `auth.users` com o client `service_role`
//      (email confirmado automaticamente — sem fluxo de convite por e-mail).
//   6) Insere a linha em `public.gestoras` via RPC `criar_gestora` (cifra o
//      CPF dentro do banco). Se falhar, desfaz o Auth user criado no passo 5
//      para não deixar órfão.
//   7) Responde { ok: true, id } — nunca devolve CPF nem qualquer dado sensível.
//
// Segredos: SUPABASE_URL, SUPABASE_ANON_KEY e SUPABASE_SERVICE_ROLE_KEY são
// injetados automaticamente pelo runtime da Supabase. Nunca hardcodear chaves
// aqui nem versionar a service_role key.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ============================================================
// Constantes de validação (sem números mágicos soltos no meio do código).
// ============================================================
// Senha provisória definida pelo master — mínimo 6 (é provisória, a gestora troca depois).
const TAMANHO_MINIMO_SENHA = 6;
const TAMANHO_CPF = 11;
const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Cabeçalhos de CORS: liberamos o front chamar a função via
// `supabase.functions.invoke`, autenticado com o token da sessão.
const cabecalhosCors: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  // O SDK (`supabase.functions.invoke`) sempre envia apikey e x-client-info
  // além de authorization/content-type — todos precisam estar liberados no
  // preflight ou o navegador barra a chamada real por CORS.
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

/** Monta uma Response JSON já com os cabeçalhos de CORS. */
function respostaJson(corpo: unknown, status: number): Response {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { ...cabecalhosCors, 'Content-Type': 'application/json' },
  });
}

/**
 * Valida CPF: 11 dígitos numéricos, rejeita sequências de dígito repetido
 * (ex.: "111.111.111-11") e confere os dois dígitos verificadores pelo
 * algoritmo padrão (módulo 11).
 */
function cpfValido(cpfBruto: string): boolean {
  const digitos = cpfBruto.replace(/\D/g, '');

  if (digitos.length !== TAMANHO_CPF) {
    return false;
  }

  if (/^(\d)\1+$/.test(digitos)) {
    return false;
  }

  const calcularDigitoVerificador = (base: string, pesoInicial: number): number => {
    let soma = 0;
    for (let indice = 0; indice < base.length; indice += 1) {
      soma += Number.parseInt(base[indice], 10) * (pesoInicial - indice);
    }
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };

  const novePrimeirosDigitos = digitos.slice(0, 9);
  const primeiroDigitoVerificador = calcularDigitoVerificador(novePrimeirosDigitos, 10);
  const dezPrimeirosDigitos = novePrimeirosDigitos + primeiroDigitoVerificador.toString();
  const segundoDigitoVerificador = calcularDigitoVerificador(dezPrimeirosDigitos, 11);

  const cpfCalculado = dezPrimeirosDigitos + segundoDigitoVerificador.toString();
  return cpfCalculado === digitos;
}

interface CorpoRequisicao {
  nome?: unknown;
  cpf?: unknown;
  telefone?: unknown;
  email?: unknown;
  senha?: unknown;
}

/** Valida o payload recebido. Retorna a mensagem de erro (PT-BR, sem detalhe interno) ou null se válido. */
function validarEntrada(corpo: CorpoRequisicao): string | null {
  const { nome, cpf, telefone, email, senha } = corpo;

  if (typeof nome !== 'string' || nome.trim().length === 0) {
    return 'Nome é obrigatório.';
  }
  if (typeof telefone !== 'string' || telefone.trim().length === 0) {
    return 'Telefone é obrigatório.';
  }
  if (typeof email !== 'string' || email.trim().length === 0 || !REGEX_EMAIL.test(email.trim())) {
    return 'E-mail é obrigatório e deve ter um formato válido.';
  }
  if (typeof senha !== 'string' || senha.length < TAMANHO_MINIMO_SENHA) {
    return `Senha é obrigatória e deve ter no mínimo ${TAMANHO_MINIMO_SENHA} caracteres.`;
  }
  if (typeof cpf !== 'string' || !cpfValido(cpf)) {
    return 'CPF é obrigatório e deve ser válido.';
  }

  return null;
}

Deno.serve(async (req: Request) => {
 try {
  // 1) CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: cabecalhosCors });
  }

  // 2) Só aceita POST
  if (req.method !== 'POST') {
    return respostaJson({ ok: false, erro: 'Método não permitido.' }, 405);
  }

  let corpo: CorpoRequisicao;
  try {
    corpo = await req.json();
  } catch {
    return respostaJson({ ok: false, erro: 'Corpo da requisição deve ser um JSON válido.' }, 400);
  }

  const urlSupabase = Deno.env.get('SUPABASE_URL');
  const chaveAnonima = Deno.env.get('SUPABASE_ANON_KEY');
  const chaveServiceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!urlSupabase || !chaveAnonima || !chaveServiceRole) {
    // Nunca deveria acontecer em runtime da Supabase (variáveis injetadas
    // automaticamente); se acontecer, não vazamos detalhe nenhum ao cliente.
    return respostaJson({ ok: false, erro: 'Falha de configuração do servidor.' }, 500);
  }

  // 3) Autoriza o chamador: propaga o JWT recebido para o client com a anon
  // key, e deixa o RLS/RPC decidirem — nunca confiamos em nada do body para
  // saber quem está chamando.
  const cabecalhoAutorizacao = req.headers.get('Authorization') ?? '';
  const clientComoChamador = createClient(urlSupabase, chaveAnonima, {
    global: { headers: { Authorization: cabecalhoAutorizacao } },
  });

  const { data: chamadorEhMaster, error: erroAutorizacao } = await clientComoChamador.rpc('eh_master');

  if (erroAutorizacao || chamadorEhMaster !== true) {
    return respostaJson({ ok: false, erro: 'Acesso negado.' }, 403);
  }

  // 4) Valida entrada
  const mensagemErroValidacao = validarEntrada(corpo);
  if (mensagemErroValidacao) {
    return respostaJson({ ok: false, erro: mensagemErroValidacao }, 400);
  }

  const nome = (corpo.nome as string).trim();
  const telefone = (corpo.telefone as string).trim();
  const email = (corpo.email as string).trim();
  const senha = corpo.senha as string;
  const cpf = (corpo.cpf as string).replace(/\D/g, '');

  // Client com service_role: só usado a partir daqui, depois de autorizar e
  // validar. Nunca é exposto ao chamador nem logado.
  const clientAdministrativo = createClient(urlSupabase, chaveServiceRole);

  // 5) Cria o usuário de autenticação (e-mail já confirmado, sem fluxo de convite)
  const { data: dadosUsuarioCriado, error: erroCriarUsuario } =
    await clientAdministrativo.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true,
      user_metadata: { nome },
    });

  if (erroCriarUsuario || !dadosUsuarioCriado?.user) {
    const usuarioJaExiste = erroCriarUsuario?.status === 422 || erroCriarUsuario?.status === 409;
    return respostaJson(
      {
        ok: false,
        erro: usuarioJaExiste
          ? 'Já existe um usuário cadastrado com este e-mail.'
          : 'Não foi possível criar o usuário.',
      },
      usuarioJaExiste ? 409 : 400,
    );
  }

  const usuarioId = dadosUsuarioCriado.user.id;

  // 6) Insere o registro em `gestoras` (RPC cifra o CPF dentro do banco).
  const { data: idGestora, error: erroCriarGestora } = await clientAdministrativo.rpc(
    'criar_gestora',
    {
      p_usuario_id: usuarioId,
      p_nome: nome,
      p_telefone: telefone,
      p_cpf: cpf,
      p_email: email,
      p_papel: 'gestora',
    },
  );

  if (erroCriarGestora) {
    // Evita usuário órfão em auth.users sem registro correspondente em gestoras.
    // Se a própria exclusão compensatória falhar, registra o id órfão nos logs
    // da função para permitir limpeza/auditoria manual depois.
    const { error: erroExclusao } = await clientAdministrativo.auth.admin.deleteUser(usuarioId);
    if (erroExclusao) {
      console.error('Falha ao remover Auth user órfão após erro em criar_gestora. usuarioId=', usuarioId);
    }
    return respostaJson({ ok: false, erro: 'Não foi possível concluir o cadastro.' }, 500);
  }

  // 7) Sucesso — nunca devolve CPF nem qualquer outro dado sensível.
  return respostaJson({ ok: true, id: idGestora }, 201);
 } catch (erro) {
  // Blindagem: qualquer exceção inesperada (ex.: rejeição de Promise do SDK)
  // vira uma resposta JSON padronizada com CORS, sem vazar detalhe interno.
  console.error('Erro inesperado em criar-usuario:', erro);
  return respostaJson({ ok: false, erro: 'Erro interno.' }, 500);
 }
});

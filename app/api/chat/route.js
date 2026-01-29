import OpenAI from "openai";
import pdfParse from "pdf-parse";
import { createServerClient } from "@supabase/ssr";
import { getActivePlan, planLimits } from "@/lib/billing/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function fetchFileAsBuffer(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Falha ao baixar arquivo (signedUrl).");
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

function isPdf(name = "") {
  return name.toLowerCase().endsWith(".pdf");
}

function isImage(name = "") {
  const n = name.toLowerCase();
  return (
    n.endsWith(".png") ||
    n.endsWith(".jpg") ||
    n.endsWith(".jpeg") ||
    n.endsWith(".webp") ||
    n.endsWith(".heic")
  );
}

function safeJsonParse(text = "") {
  const s = text.trim();
  if (s.startsWith("{") && s.endsWith("}")) {
    try {
      return JSON.parse(s);
    } catch {
      return null;
    }
  }
  const m = s.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    return JSON.parse(m[0]);
  } catch {
    return null;
  }
}

// ✅ Supabase server client via cookies (para pegar user logado)
function getSupabaseServer() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {
          // route handler não precisa setar cookie
        },
      },
    }
  );
}

// ✅ tenta inferir topic curto pelo contexto
function inferTopicFromContext(context = "") {
  const c = (context || "").toLowerCase();
  if (c.includes("rg")) return "rg";
  if (c.includes("cpf")) return "cpf";
  if (c.includes("cnh")) return "cnh";
  if (c.includes("benef")) return "beneficios";
  if (c.includes("outros")) return "outros";
  return "geral";
}

// ✅ ajuda a deixar a resposta mais “inteligente” por tema
function topicStyleHint(topic = "geral") {
  const t = (topic || "geral").toLowerCase();
  if (t === "beneficios") {
    return "Foque em INSS/CadÚnico/Bolsa Família: caminhos por app/telefone/presencial, documentos e pendências comuns.";
  }
  if (t === "cnh") {
    return "Foque em DETRAN: renovação, exames, taxas, agendamento e prazos. Sempre pedir UF/cidade se necessário.";
  }
  if (t === "cpf") {
    return "Foque em Receita Federal e regularização: pendências, emissão/consulta e orientações seguras sem pedir dados completos.";
  }
  if (t === "rg") {
    return "Foque em SSP/Instituto de Identificação: 1ª/2ª via, documentos, taxas e agendamento por estado.";
  }
  if (t === "outros") {
    return "Foque em orientar de forma prática e pedir UF/cidade quando depender do órgão local.";
  }
  return "Foque em orientação objetiva e prática. Se depender de cidade/UF, pergunte.";
}

export async function POST(request) {
  try {
    const body = await request.json();

    const message = (body?.message || "").toString().trim();
    const context = (body?.context || "").toString().trim();

    const fileUrl = (body?.fileUrl || "").toString().trim();
    const fileName = (body?.fileName || "").toString().trim();

    // ✅ sessionId vindo do ChatBox
    const sessionId = (body?.sessionId || "").toString().trim();

    if (!message) {
      return Response.json({ error: "Mensagem vazia." }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return Response.json(
        { error: "OPENAI_API_KEY não configurada na Vercel." },
        { status: 500 }
      );
    }

    // ✅ exige login para usar /api/chat
    const supabase = getSupabaseServer();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;

    if (!user) {
      return Response.json(
        { error: "Você precisa estar logado para usar o chat." },
        { status: 401 }
      );
    }

    // ✅ Plano / limites (monetização)
    const { plan } = await getActivePlan(supabase, user.id);
    const limits = planLimits(plan);

    const wantsUpload = !!(fileUrl && fileName);
    if (wantsUpload && !limits.uploadAllowed) {
      return Response.json(
        {
          error: "📎 Upload de arquivos é exclusivo para assinantes. Escolha um plano para liberar.",
          code: "UPLOAD_REQUIRES_PLAN",
        },
        { status: 402 }
      );
    }

    // ✅ Contador diário (tabela usage_daily)
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const { data: usageRow, error: usageErr } = await supabase
      .from("usage_daily")
      .select("count_messages,count_uploads")
      .eq("user_id", user.id)
      .eq("date", today)
      .maybeSingle();

    if (usageErr) {
      // não bloqueia por erro de contagem
    } else {
      const countMessages = usageRow?.count_messages ?? 0;
      const countUploads = usageRow?.count_uploads ?? 0;

      if (countMessages >= limits.dailyMessages) {
        return Response.json(
          {
            error:
              "🚫 Você atingiu o limite diário de mensagens do seu plano. Para continuar, faça upgrade em Planos.",
            code: "DAILY_LIMIT_REACHED",
          },
          { status: 402 }
        );
      }

      if (wantsUpload && countUploads >= limits.dailyUploads) {
        return Response.json(
          {
            error:
              "🚫 Você atingiu o limite diário de uploads do seu plano. Para continuar, faça upgrade em Planos.",
            code: "UPLOAD_LIMIT_REACHED",
          },
          { status: 402 }
        );
      }
    }

    const topic = inferTopicFromContext(context);
    const hint = topicStyleHint(topic);

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const MODEL = process.env.OPENAI_VISION_MODEL || "gpt-4o-mini";

    // ✅ PDF -> extrai texto
    let fileText = "";
    let fileNote = "";

    if (fileUrl && fileName && isPdf(fileName)) {
      const buf = await fetchFileAsBuffer(fileUrl);
      const parsed = await pdfParse(buf);
      fileText = (parsed?.text || "").trim();

      if (!fileText) {
        fileNote =
          "Recebi um PDF, mas não consegui extrair texto. Ele pode ser um PDF escaneado (imagem).";
      }
    }

    // ✅ System prompt: estilo ChatGPT (humano, organizado, sem “resposta embaraçosa”)
    const system = `
Você é o "Cidadão Inteligente" 🇧🇷 — um assistente no estilo ChatGPT.

MISSÃO:
Ajudar pessoas com documentos e serviços: RG, CPF, CNH, benefícios (INSS/CadÚnico/Bolsa Família) e “outros”.

TOM E QUALIDADE (obrigatório):
- Natural, humano, confiante e educado. Nada robótico.
- Use emojis com moderação para guiar leitura (✅📌🧾⚠️📍).
- Seja objetivo e útil: sempre entregue próximos passos claros.
- Não seja “genérico”: personalize com base no que a pessoa disse.

ESTRUTURA DE RESPOSTA (use quando fizer sentido):
1) ✅ Resumo em 1 linha
2) 📌 O que fazer agora (passo a passo)
3) 🧾 Documentos necessários (checklist)
4) ⚠️ Atenção / erros comuns
5) ❓ Perguntas rápidas (máx. 3) — só se faltar info

REGRAS IMPORTANTES:
- Se depender de UF/cidade/órgão local, pergunte UF e cidade.
- Não invente leis, links, endereços, taxas, prazos específicos.
- Não peça dados sensíveis desnecessários (CPF completo, senhas, etc.).
- Se houver ANEXO:
  (1) resumo curto do anexo
  (2) pontos importantes
  (3) o que falta / o que está ilegível
  (4) próximos passos
- Se o usuário estiver ansioso, seja acolhedor e direto.

FORMATAÇÃO:
- Escreva em Markdown simples (títulos curtos, listas, checklists).
- Finalize com uma pergunta objetiva se precisar destravar o caso.
`.trim();

    const baseTextPrompt = `
Guia do tema (internal): ${hint}

Contexto do usuário (opcional): ${context || "(não informado)"}

Arquivo anexado: ${fileName || "(nenhum)"}
Observação do arquivo: ${fileNote || "(nenhuma)"}

Conteúdo extraído do arquivo (se houver):
${fileText ? fileText.slice(0, 12000) : "(sem texto extraído)"}

Pedido do usuário:
${message}
`.trim();

    const useVision = !!(fileUrl && fileName && isImage(fileName));

    const messagesMain = [
      { role: "system", content: system },
      useVision
        ? {
            role: "user",
            content: [
              {
                type: "text",
                text:
                  baseTextPrompt +
                  "\n\nAnalise também a imagem anexada. Se algo estiver ilegível, diga o que não dá para ler.",
              },
              { type: "image_url", image_url: { url: fileUrl } },
            ],
          }
        : { role: "user", content: baseTextPrompt },
    ];

    const completion = await client.chat.completions.create({
      model: MODEL,
      temperature: 0.4, // mais natural, sem virar bagunça
      messages: messagesMain,
      max_tokens: 1100, // mais espaço pra ficar “bem feito”
    });

    let answer =
      completion.choices?.[0]?.message?.content?.trim() ||
      "Desculpe, não consegui responder agora.";

    // ✅ pós-ajuste simples: evita respostas secas demais
    // (mantém seu texto, só acrescenta um fechamento útil quando faltar)
    const lower = answer.toLowerCase();
    if (
      !lower.includes("uf") &&
      !lower.includes("cidade") &&
      (topic === "rg" || topic === "cpf" || topic === "cnh" || topic === "beneficios")
    ) {
      // só adiciona se não tiver nenhuma pergunta final e não parecer “resolvido”
      const hasQuestionMark = answer.includes("?");
      if (!hasQuestionMark && answer.length < 600) {
        answer +=
          "\n\n📍 **Se você me disser sua UF e cidade**, eu ajusto o passo a passo certinho pro seu caso.";
      }
    }

    // ✅ extração (bônus) quando for imagem
    let extracted = null;

    if (useVision) {
      const extractorSystem = `
Você é um extrator de dados de documentos brasileiros.
Tarefa: olhando a imagem enviada, extraia campos quando for RG, CNH, CPF (comprovante) ou outro documento oficial.
REGRAS IMPORTANTES:
- Responda APENAS com um JSON válido (sem texto antes/depois).
- Se um campo não estiver visível/legível, use null.
- Se não for documento oficial, preencha "document_type": "unknown" e demais como null.
- "confidence" deve ser um número entre 0 e 1 baseado na legibilidade.
Campos esperados:
{
  "document_type": "RG" | "CNH" | "CPF" | "unknown",
  "full_name": string|null,
  "document_number": string|null,
  "cpf": string|null,
  "rg": string|null,
  "cnh": string|null,
  "birth_date": string|null,
  "issue_date": string|null,
  "expiry_date": string|null,
  "mother_name": string|null,
  "uf": string|null,
  "observations": string|null,
  "confidence": number
}
`.trim();

      const extractorUserText = `
Extraia os campos do documento da imagem.
Se houver mais de um número, escolha o que claramente é o número do documento.
Datas: use o formato DD/MM/AAAA quando possível.
`.trim();

      const completionExtract = await client.chat.completions.create({
        model: MODEL,
        temperature: 0,
        max_tokens: 500,
        messages: [
          { role: "system", content: extractorSystem },
          {
            role: "user",
            content: [
              { type: "text", text: extractorUserText },
              { type: "image_url", image_url: { url: fileUrl } },
            ],
          },
        ],
      });

      const raw =
        completionExtract.choices?.[0]?.message?.content?.trim() || "";

      extracted = safeJsonParse(raw);
    }

    // ✅ SALVA HISTÓRICO (com session_id)
    const { error: histErr } = await supabase.from("chat_history").insert({
      user_id: user.id,
      topic,
      session_id: sessionId || null,
      user_message: message,
      assistant_message: answer,
    });

    // ✅ incrementa uso diário (não quebra o chat em caso de erro)
    try {
      const today2 = new Date().toISOString().slice(0, 10);
      const incUploads = fileUrl && fileName ? 1 : 0;

      const { data: cur, error: curErr } = await supabase
        .from("usage_daily")
        .select("count_messages,count_uploads")
        .eq("user_id", user.id)
        .eq("date", today2)
        .maybeSingle();

      if (curErr || !cur) {
        await supabase.from("usage_daily").insert({
          user_id: user.id,
          date: today2,
          count_messages: 1,
          count_uploads: incUploads,
        });
      } else {
        await supabase
          .from("usage_daily")
          .update({
            count_messages: (cur.count_messages ?? 0) + 1,
            count_uploads: (cur.count_uploads ?? 0) + incUploads,
          })
          .eq("user_id", user.id)
          .eq("date", today2);
      }
    } catch {}
    if (histErr) {
      // não quebra o chat
      return Response.json({ answer, extracted, sessionId, warning: histErr.message });
    }

    return Response.json({ answer, extracted, sessionId });
  } catch (err) {
    return Response.json(
      { error: err?.message || "Erro desconhecido." },
      { status: 500 }
    );
  }
}

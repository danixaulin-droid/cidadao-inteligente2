import OpenAI from "openai";
import pdfParse from "pdf-parse";
import { createServerClient } from "@supabase/ssr";
import { getActivePlan, planLimits } from "@/lib/billing/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* =========================
   HELPERS
========================= */
async function fetchFileAsBuffer(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Falha ao baixar arquivo.");
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

/* =========================
   SUPABASE SERVER
========================= */
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
          // route handler não precisa setar cookie aqui
        },
      },
    }
  );
}

/* =========================
   TOPIC HELPERS
========================= */
function inferTopicFromContext(context = "") {
  const c = (context || "").toLowerCase();
  if (c.includes("rg")) return "rg";
  if (c.includes("cpf")) return "cpf";
  if (c.includes("cnh")) return "cnh";
  if (c.includes("benef")) return "beneficios";
  return "geral";
}

function topicStyleHint(topic = "geral") {
  if (topic === "beneficios") return "Foque em INSS e benefícios sociais.";
  if (topic === "cnh") return "Foque em DETRAN e CNH.";
  if (topic === "cpf") return "Foque em Receita Federal.";
  if (topic === "rg") return "Foque em RG e órgãos estaduais.";
  return "Foque em orientação prática e clara.";
}

/* =========================
   ROUTE
========================= */
export async function POST(request) {
  try {
    const body = await request.json();

    const message = (body?.message || "").toString().trim();
    const context = (body?.context || "").toString().trim();
    const fileUrl = (body?.fileUrl || "").toString().trim();
    const fileName = (body?.fileName || "").toString().trim();
    const sessionId = (body?.sessionId || "").toString().trim();

    if (!message) {
      return Response.json({ error: "Mensagem vazia." }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return Response.json({ error: "OPENAI_API_KEY não configurada." }, { status: 500 });
    }

    /* =========================
       AUTH
    ========================= */
    const supabase = getSupabaseServer();
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    const user = userData?.user;

    if (userErr || !user) {
      return Response.json({ error: "Você precisa estar logado para usar o chat." }, { status: 401 });
    }

    /* =========================
       PLANO / STATUS
       ✅ FREE: pode usar (com limite)
       ✅ BASIC/PRO: precisa estar active
    ========================= */
    const { plan, status } = await getActivePlan(supabase, user.id);
    const planNorm = (plan || "free").toLowerCase();
    const statusNorm = (status || "none").toLowerCase();

    const isPaidPlan = planNorm === "basic" || planNorm === "pro";

    // 🔒 Só bloqueia por status se for plano pago
    if (isPaidPlan && statusNorm !== "active") {
      let msg = "Seu plano não está ativo no momento. Verifique sua assinatura em **Planos**.";

      if (statusNorm === "pending") {
        msg =
          "⏳ Seu pagamento está em processamento. Assim que o Mercado Pago confirmar, o acesso premium será liberado automaticamente.";
      }

      if (statusNorm === "canceled") {
        msg =
          "⚠️ Sua assinatura foi cancelada. Para voltar a usar os recursos premium, assine novamente em **Planos**.";
      }

      return Response.json(
        { error: msg, code: "PLAN_NOT_ACTIVE", plan: planNorm, status: statusNorm },
        { status: 402 }
      );
    }

    /* =========================
       LIMITES DO PLANO
       (Free/Básico/Pro)
    ========================= */
    const limits = planLimits(planNorm);
    const wantsUpload = !!(fileUrl && fileName);

    // 🚫 Upload no Free
    if (wantsUpload && !limits.uploadAllowed) {
      return Response.json(
        {
          error:
            "📎 **Upload de arquivos é exclusivo para assinantes.**\n\nAbra **Planos** e escolha um plano para liberar uploads.",
          code: "UPLOAD_REQUIRES_PLAN",
        },
        { status: 402 }
      );
    }

    /* =========================
       CONTADOR DIÁRIO
    ========================= */
    const today = new Date().toISOString().slice(0, 10);

    const { data: usage, error: usageErr } = await supabase
      .from("usage_daily")
      .select("count_messages,count_uploads")
      .eq("user_id", user.id)
      .eq("date", today)
      .maybeSingle();

    const countMessages = usage?.count_messages ?? 0;
    const countUploads = usage?.count_uploads ?? 0;

    // limite mensagens
    if (countMessages >= limits.dailyMessages) {
      const limitLabel =
        limits.dailyMessages === Infinity ? "ilimitado" : `${limits.dailyMessages}/dia`;

      return Response.json(
        {
          error:
            `🚫 **Você atingiu seu limite diário de mensagens (${limitLabel}).**\n\n` +
            `Para continuar agora, faça upgrade em **Planos**.`,
          code: "DAILY_LIMIT_REACHED",
          plan: planNorm,
          status: statusNorm,
        },
        { status: 402 }
      );
    }

    // limite uploads
    if (wantsUpload && countUploads >= limits.dailyUploads) {
      return Response.json(
        {
          error:
            "🚫 **Você atingiu o limite diário de uploads do seu plano.**\n\nPara continuar agora, faça upgrade em **Planos**.",
          code: "UPLOAD_LIMIT_REACHED",
          plan: planNorm,
          status: statusNorm,
        },
        { status: 402 }
      );
    }

    /* =========================
       PREPARAÇÃO IA
    ========================= */
    const topic = inferTopicFromContext(context);
    const hint = topicStyleHint(topic);

    // PDF -> extrai texto (se houver)
    let fileText = "";
    let fileNote = "";

    if (fileUrl && fileName && isPdf(fileName)) {
      try {
        const buf = await fetchFileAsBuffer(fileUrl);
        const parsed = await pdfParse(buf);
        fileText = (parsed?.text || "").toString();
        if (!fileText.trim()) {
          fileNote = "Recebi um PDF, mas não consegui extrair texto. Pode ser um PDF escaneado (imagem).";
        }
      } catch {
        fileNote = "Recebi um PDF, mas ocorreu um erro ao ler o conteúdo.";
      }
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const MODEL = process.env.OPENAI_VISION_MODEL || "gpt-4o-mini";

    const systemPrompt = `
Você é o Cidadão Inteligente 🇧🇷.
Seja claro, humano, organizado e útil.
Sempre entregue próximos passos práticos.
Use emojis com moderação (✅📌🧾⚠️📍).
${hint}
`.trim();

    const userPrompt = `
Contexto: ${context || "não informado"}

Arquivo: ${fileName || "nenhum"}
Observação do arquivo: ${fileNote || "nenhuma"}

Conteúdo do arquivo:
${(fileText || "").slice(0, 12000)}

Pergunta:
${message}
`.trim();

    const useVision = !!(fileUrl && fileName && isImage(fileName));

    const messages = [
      { role: "system", content: systemPrompt },
      useVision
        ? {
            role: "user",
            content: [
              { type: "text", text: userPrompt + "\n\nAnalise também a imagem anexada. Se algo estiver ilegível, diga." },
              { type: "image_url", image_url: { url: fileUrl } },
            ],
          }
        : { role: "user", content: userPrompt },
    ];

    const completion = await client.chat.completions.create({
      model: MODEL,
      temperature: 0.4,
      max_tokens: 1100,
      messages,
    });

    const answer =
      completion.choices?.[0]?.message?.content?.toString().trim() ||
      "Não consegui responder agora.";

    /* =========================
       SALVA HISTÓRICO
    ========================= */
    try {
      await supabase.from("chat_history").insert({
        user_id: user.id,
        topic,
        session_id: sessionId || null,
        user_message: message,
        assistant_message: answer,
      });
    } catch {
      // não quebra o chat se falhar o insert
    }

    /* =========================
       ATUALIZA USO
    ========================= */
    try {
      const incUploads = wantsUpload ? 1 : 0;

      if (usageErr || !usage) {
        await supabase.from("usage_daily").insert({
          user_id: user.id,
          date: today,
          count_messages: 1,
          count_uploads: incUploads,
        });
      } else {
        await supabase
          .from("usage_daily")
          .update({
            count_messages: countMessages + 1,
            count_uploads: countUploads + incUploads,
          })
          .eq("user_id", user.id)
          .eq("date", today);
      }
    } catch {
      // não quebra o chat se falhar a contagem
    }

    return Response.json({ answer, sessionId, plan: planNorm, status: statusNorm });
  } catch (err) {
    return Response.json({ error: err?.message || "Erro inesperado." }, { status: 500 });
  }
}

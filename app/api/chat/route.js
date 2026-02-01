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

function safeJsonParse(text = "") {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
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
        setAll() {},
      },
    }
  );
}

/* =========================
   TOPIC HELPERS
========================= */
function inferTopicFromContext(context = "") {
  const c = context.toLowerCase();
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

    const message = (body?.message || "").trim();
    const context = (body?.context || "").trim();
    const fileUrl = (body?.fileUrl || "").trim();
    const fileName = (body?.fileName || "").trim();
    const sessionId = (body?.sessionId || "").trim();

    if (!message) {
      return Response.json({ error: "Mensagem vazia." }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return Response.json(
        { error: "OPENAI_API_KEY não configurada." },
        { status: 500 }
      );
    }

    /* =========================
       AUTH
    ========================= */
    const supabase = getSupabaseServer();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;

    if (!user) {
      return Response.json(
        { error: "Você precisa estar logado para usar o chat." },
        { status: 401 }
      );
    }

    /* =========================
       🔒 TRAVA PREMIUM (OPÇÃO 1)
    ========================= */
    const { plan, status } = await getActivePlan(supabase, user.id);

    if (status !== "active") {
      let msg =
        "Seu plano não está ativo no momento. Assine um plano para continuar.";

      if (status === "pending") {
        msg =
          "⏳ Seu pagamento está em processamento. Assim que for confirmado, o acesso será liberado automaticamente.";
      }

      if (status === "canceled") {
        msg =
          "⚠️ Sua assinatura foi cancelada. Assine novamente para continuar usando o chat.";
      }

      return Response.json(
        {
          error: msg,
          code: "PLAN_NOT_ACTIVE",
          plan,
          status,
        },
        { status: 402 }
      );
    }

    /* =========================
       LIMITES DO PLANO
    ========================= */
    const limits = planLimits(plan);
    const wantsUpload = !!(fileUrl && fileName);

    if (wantsUpload && !limits.uploadAllowed) {
      return Response.json(
        {
          error:
            "📎 Upload de arquivos é exclusivo para assinantes. Faça upgrade do seu plano.",
          code: "UPLOAD_REQUIRES_PLAN",
        },
        { status: 402 }
      );
    }

    /* =========================
       CONTADOR DIÁRIO
    ========================= */
    const today = new Date().toISOString().slice(0, 10);

    const { data: usage } = await supabase
      .from("usage_daily")
      .select("count_messages,count_uploads")
      .eq("user_id", user.id)
      .eq("date", today)
      .maybeSingle();

    const countMessages = usage?.count_messages ?? 0;
    const countUploads = usage?.count_uploads ?? 0;

    if (countMessages >= limits.dailyMessages) {
      return Response.json(
        {
          error:
            "🚫 Você atingiu o limite diário de mensagens do seu plano.",
          code: "DAILY_LIMIT_REACHED",
        },
        { status: 402 }
      );
    }

    if (wantsUpload && countUploads >= limits.dailyUploads) {
      return Response.json(
        {
          error:
            "🚫 Você atingiu o limite diário de uploads do seu plano.",
          code: "UPLOAD_LIMIT_REACHED",
        },
        { status: 402 }
      );
    }

    /* =========================
       PREPARAÇÃO IA
    ========================= */
    const topic = inferTopicFromContext(context);
    const hint = topicStyleHint(topic);

    let fileText = "";
    if (fileUrl && fileName && isPdf(fileName)) {
      const buf = await fetchFileAsBuffer(fileUrl);
      const parsed = await pdfParse(buf);
      fileText = parsed?.text || "";
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const MODEL = process.env.OPENAI_VISION_MODEL || "gpt-4o-mini";

    const systemPrompt = `
Você é o Cidadão Inteligente 🇧🇷.
Seja claro, humano, organizado e útil.
Sempre entregue próximos passos práticos.
${hint}
`.trim();

    const userPrompt = `
Contexto: ${context || "não informado"}

Arquivo: ${fileName || "nenhum"}
Conteúdo do arquivo:
${fileText.slice(0, 12000)}

Pergunta:
${message}
`.trim();

    const completion = await client.chat.completions.create({
      model: MODEL,
      temperature: 0.4,
      max_tokens: 1100,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const answer =
      completion.choices?.[0]?.message?.content ||
      "Não consegui responder agora.";

    /* =========================
       SALVA HISTÓRICO
    ========================= */
    await supabase.from("chat_history").insert({
      user_id: user.id,
      topic,
      session_id: sessionId || null,
      user_message: message,
      assistant_message: answer,
    });

    /* =========================
       ATUALIZA USO
    ========================= */
    if (!usage) {
      await supabase.from("usage_daily").insert({
        user_id: user.id,
        date: today,
        count_messages: 1,
        count_uploads: wantsUpload ? 1 : 0,
      });
    } else {
      await supabase
        .from("usage_daily")
        .update({
          count_messages: countMessages + 1,
          count_uploads: countUploads + (wantsUpload ? 1 : 0),
        })
        .eq("user_id", user.id)
        .eq("date", today);
    }

    return Response.json({ answer, sessionId });
  } catch (err) {
    return Response.json(
      { error: err?.message || "Erro inesperado." },
      { status: 500 }
    );
  }
}

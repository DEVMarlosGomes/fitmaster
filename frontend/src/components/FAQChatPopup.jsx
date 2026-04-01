import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import {
  MessageCircleQuestion, 
  X, 
  Send, 
  ChevronRight, 
  ArrowLeft,
  Dumbbell,
  Heart,
  Utensils,
  CreditCard,
  Settings,
  HelpCircle,
  Search,
  Sparkles,
  LayoutGrid
} from "lucide-react";
import { cn } from "../lib/utils";
import { BRAND } from "../lib/brand";

const FAQ_DATABASE = {
  treino: {
    icon: Dumbbell,
    title: "Treino e Exercicios",
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    questions: [
      { q: "Posso trocar a ordem dos exercicios?", a: "Evite trocar a ordem.\nEla foi pensada para otimizar seu desempenho.\nSe precisar adaptar, mantenha no inicio os exercicios com maior grau de esforco, como agachamentos, remadas, desenvolvimentos e supinos." },
      { q: "Se eu perder um dia, devo compensar?", a: "Nao precisa compensar tudo.\nApenas siga o planejamento normalmente." },
      { q: "Posso trocar algum exercicio caso nao tenha na academia?", a: "Sempre me consulte antes.\nAssim garanto a melhor substituicao para o seu objetivo." },
      { q: "Devo seguir o intervalo de descanso, mesmo se eu estiver recuperado?", a: "Se estiver recuperado, pode iniciar a proxima serie.\nPorem, analise sua performance: se houver queda significativa no numero de repeticoes, respeite melhor o intervalo.\n\nQueda significativa e quando ha uma reducao clara no numero de repeticoes em relacao a serie anterior.\nExemplo: se voce fez 10 repeticoes e na proxima faz 6 ou menos, ja indica que o descanso foi insuficiente." },
      { q: "Faco o treino aerobio antes ou depois da musculacao?", a: "De preferencia, apos o treino de musculacao.\nFazer o aerobio antes pode reduzir sua forca e desempenho nos exercicios.\nIsso pode impactar diretamente sua evolucao em carga e intensidade." },
      { q: "Caso eu nao consiga aumentar a carga?", a: "Sem problema.\nTente aumentar o numero de repeticoes com a mesma carga.\nE mantenha o foco na execucao e intensidade do exercicio." },
      { q: "Quando eu faltar, eu pulo o treino do dia ou continuo a sequencia?", a: "Continue a sequencia normalmente.\nNao pule treinos do planejamento." },
      { q: "O que sao WARM UP, WORKING SET e HARD SET?", a: "WARM UP (aquecimento):\nSeries leves para preparar o corpo, sem chegar proximo da falha.\n\nWORKING SET (series de trabalho):\nSeries com carga desafiadora, proximas da falha, mantendo execucao controlada.\n\nHARD SET (series intensas):\nSeries levadas ate a falha muscular, com maxima intensidade e foco total na execucao." },
      { q: "O que e falha muscular?", a: "E quando voce nao consegue realizar outra repeticao completa mantendo a tecnica correta.\nOu seja, o musculo chegou ao seu limite naquele momento." },
      { q: "Qual carga devo utilizar?", a: "Posso calcular uma estimativa para voce.\nMe informe:\n1. Qual carga voce utilizou\n2. Quantas repeticoes conseguiu fazer\nDepois, me diga seu objetivo: hipertrofia, definicao ou emagrecimento.\nCom base nisso, vou calcular sua carga ideal para o treino.", mode: "load_estimate" }
    ]
  },
  saude: {
    icon: Heart,
    title: "Saude e Bem-estar",
    color: "text-rose-400",
    bgColor: "bg-rose-500/10",
    questions: [
      { q: "Quanto tempo devo descansar entre series?", a: "O tempo de descanso varia conforme o objetivo: Hipertrofia (30-90 seg), Forca (2-5 min), Resistencia (15-30 seg). Seu treino pode ter indicacoes especificas de descanso em cada exercicio." },
      { q: "Devo treinar mesmo com dor muscular?", a: "Dor muscular tardia (DOMS) e normal 24-72h apos treino. Voce pode treinar outros grupos musculares. Porem, dor aguda, nas articulacoes ou que piora com movimento requer atencao - comunique seu personal imediatamente." },
      { q: "Qual a importancia do sono para resultados?", a: "O sono e quando seu corpo realmente constroi musculo e se recupera. 7-9 horas de sono de qualidade podem aumentar em ate 30% seus ganhos de forca. Registre sua qualidade de sono nas notas do treino." },
      { q: "Como saber se estou em overtraining?", a: "Sinais de overtraining: cansaco constante, queda de desempenho, irritabilidade, dificuldade para dormir, lesoes frequentes. Se perceber esses sinais, registre PSR baixo e converse com seu personal para ajustar o volume." },
      { q: "Posso treinar gripado ou com febre?", a: "Com febre ou infeccao, o treino pode piorar seu estado e prolongar a doenca. Descanse ate se recuperar completamente. Sintomas leves acima do pescoco (nariz entupido) permitem treinos leves, mas consulte seu medico." },
      { q: "Como otimizar minha recuperacao?", a: "Pilares da recuperacao: 1) Sono de qualidade (7-9h), 2) Nutricao adequada (proteinas, carboidratos, hidratacao), 3) Gerenciamento de estresse, 4) Descanso ativo (caminhadas leves nos dias off). Registre sua recuperacao no PSR." }
    ]
  },
  nutricao: {
    icon: Utensils,
    title: "Nutricao e Alimentacao",
    color: "text-green-400",
    bgColor: "bg-green-500/10",
    questions: [
      { q: "O que devo comer antes do treino?", a: "1-2 horas antes: refeicao com carboidratos complexos e proteina (ex: frango com arroz). 30-60 min antes: carboidrato rapido e leve (banana, torrada). Evite gorduras e fibras em excesso perto do treino." },
      { q: "O que comer apos o treino?", a: "Ate 2h apos: proteina de rapida absorcao (whey, frango, ovos) + carboidrato para repor glicogenio (arroz, batata, frutas). Essa janela e ideal para maximizar a recuperacao muscular." },
      { q: "Quanta proteina devo consumir por dia?", a: "Para hipertrofia: 1.6-2.2g de proteina por kg de peso corporal. Exemplo: pessoa de 70kg precisa de 112-154g de proteina/dia. Divida em 4-6 refeicoes para melhor absorcao." },
      { q: "Preciso de suplementos?", a: "Suplementos sao 'suplementares' - nao substituem alimentacao. Os mais evidenciados cientificamente: whey protein (praticidade), creatina (forca), vitamina D (deficiencia comum). Consulte um nutricionista para recomendacoes personalizadas." },
      { q: "Quanto de agua devo beber?", a: "Minimo: 35ml por kg de peso corporal. No treino: 500-1000ml dependendo da intensidade e temperatura. Urina clara/amarelo claro indica boa hidratacao. Desidratacao pode reduzir performance em ate 25%." },
      { q: "Posso treinar em jejum?", a: "Treino em jejum pode funcionar para alguns, mas pode reduzir performance em treinos intensos. Se optar por jejum, considere BCAAs antes do treino. Para hipertrofia maxima, treinar alimentado geralmente e superior." }
    ]
  },
  financeiro: {
    icon: CreditCard,
    title: "Financeiro e Pagamentos",
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    questions: [
      { q: "Como vejo minhas faturas pendentes?", a: "Acesse 'Meu Financeiro' no menu lateral. La voce encontra todas as faturas, status de pagamento, historico e opcoes de pagamento. Faturas vencidas aparecem destacadas em vermelho." },
      { q: "Quais formas de pagamento sao aceitas?", a: "As formas de pagamento sao definidas pelo seu personal trainer. Geralmente incluem: PIX, transferencia bancaria, cartao de credito/debito e dinheiro. Consulte as opcoes disponiveis na tela de pagamento." },
      { q: "Como solicito segunda via de recibo?", a: "Na secao 'Meu Financeiro', cada pagamento registrado tem opcao de gerar recibo em PDF. Clique no icone de documento ao lado do pagamento para baixar a segunda via." },
      { q: "Posso parcelar mensalidades atrasadas?", a: "Condicoes de parcelamento devem ser negociadas diretamente com seu personal trainer. Use o chat do app para iniciar essa conversa e formalizar um acordo." },
      { q: "Como funciona o plano de aulas?", a: "Cada personal define seus planos (mensal, trimestral, pacote de aulas avulsas). Os detalhes do seu plano atual, valor e vencimento aparecem em 'Meu Financeiro'." }
    ]
  },
  app: {
    icon: Settings,
    title: "Uso do Aplicativo",
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    questions: [
      { q: "Como altero minha senha?", a: "Acesse seu perfil clicando no icone de usuario no canto superior. La voce encontra opcoes para alterar senha, email e outras configuracoes da conta." },
      { q: "Como envio fotos de evolucao?", a: "Acesse 'Fotos de Evolucao' no menu lateral. Clique em 'Nova Foto' e tire ou selecione fotos de frente, costas e lateral. Adicione data e observacoes. Seu personal recebera notificacao." },
      { q: "Como falo com meu personal?", a: "Use a funcao 'Chat' no menu lateral para mensagens diretas. Voce pode enviar texto, e seu personal recebe notificacao. O historico de conversas fica salvo para consulta." },
      { q: "O que sao as conquistas e ranking?", a: "O sistema de gamificacao premia consistencia e dedicacao. Conquistas sao desbloqueadas por metas (ex: 10 treinos no mes). O ranking compara seu desempenho com outros alunos do seu personal." },
      { q: "Como funciona o check-in de presenca?", a: "Alguns personais usam check-in para controle de presenca em academias. Quando disponivel, voce pode fazer check-in ao chegar na academia, registrando sua presenca automaticamente." },
      { q: "Como vejo minhas avaliacoes fisicas?", a: "Em 'Minhas Avaliacoes' voce acessa todas as avaliacoes feitas pelo seu personal: medidas corporais, percentual de gordura, testes de forca e flexibilidade. Compare evolucao entre datas." },
      { q: "O app funciona offline?", a: "Algumas funcoes como visualizar seu treino atual funcionam offline. Porem, registrar progresso, chat e outras funcoes precisam de conexao com internet para sincronizar dados." },
      { q: "Como altero o tema claro/escuro?", a: "Clique no icone de sol/lua no canto superior direito da tela para alternar entre tema claro e escuro. Sua preferencia e salva automaticamente." }
    ]
  },
  outros: {
    icon: HelpCircle,
    title: "Outras Duvidas",
    color: "text-indigo-400",
    bgColor: "bg-indigo-500/10",
    questions: [
      { q: "Como cancelo ou altero um horario?", a: "Alteracoes de horario devem ser solicitadas diretamente ao seu personal com antecedencia minima de 24h (ou conforme politica do seu personal). Use o chat para fazer a solicitacao." },
      { q: "Posso treinar em outra academia?", a: "Isso depende do acordo com seu personal. Alguns oferecem treinos online ou prescritos para fazer em qualquer lugar. Converse sobre suas necessidades pelo chat." },
      { q: "Meu treino nao esta aparecendo, o que faco?", a: "Verifique sua conexao com internet e tente recarregar a pagina. Se o problema persistir, seu personal pode ainda nao ter enviado o treino atualizado. Entre em contato pelo chat." },
      { q: "Como indico um amigo para o personal?", a: "Alguns personais oferecem beneficios por indicacao. Converse com seu personal sobre programas de indicacao e como funciona o processo." },
      { q: "Encontrei um bug no app, como reporto?", a: "Use o chat para informar seu personal sobre qualquer problema tecnico. Descreva o que aconteceu, em qual tela e se possivel, envie print da tela. Sua ajuda melhora o app!" }
    ]
  }
};

const GREETING_MESSAGES = [
  `Ola! Sou o ${BRAND.assistantName}. Como posso ajudar voce hoje?`,
  `Oi! Estou aqui para tirar suas duvidas sobre treino, nutricao e o acompanhamento do ${BRAND.name}.`,
  "Bem-vindo! Selecione uma categoria ou digite sua duvida."
];

const LOAD_ESTIMATE_MODE = "load_estimate";

const normalizeText = (value = "") =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const roundToNearestHalf = (value) => Math.round(value * 2) / 2;

const formatLoad = (value) =>
  roundToNearestHalf(value).toLocaleString("pt-BR", {
    minimumFractionDigits: Number.isInteger(roundToNearestHalf(value)) ? 0 : 1,
    maximumFractionDigits: 1,
  });

const LOAD_OBJECTIVES = {
  hipertrofia: {
    label: "hipertrofia",
    minPercent: 0.67,
    maxPercent: 0.8,
    repRange: "6 a 12 repeticoes",
  },
  definicao: {
    label: "definicao",
    minPercent: 0.55,
    maxPercent: 0.7,
    repRange: "10 a 15 repeticoes",
  },
  emagrecimento: {
    label: "emagrecimento",
    minPercent: 0.5,
    maxPercent: 0.65,
    repRange: "12 a 20 repeticoes",
  },
};

function parseLoadEstimateInput(text) {
  const normalized = normalizeText(String(text || "")).replace(/,/g, ".");
  const numbers = [...normalized.matchAll(/(\d+(?:\.\d+)?)/g)].map((match) => Number(match[1]));

  let objective = null;
  if (normalized.includes("hipertrof")) {
    objective = "hipertrofia";
  } else if (normalized.includes("defin")) {
    objective = "definicao";
  } else if (
    normalized.includes("emagrec") ||
    normalized.includes("perder peso") ||
    normalized.includes("secar")
  ) {
    objective = "emagrecimento";
  }

  const loadKg = numbers[0] ?? null;
  const reps = numbers[1] ?? null;

  return {
    loadKg,
    reps,
    objective,
  };
}

function buildLoadEstimateResponse(text) {
  const { loadKg, reps, objective } = parseLoadEstimateInput(text);

  if (!loadKg || !reps || !objective) {
    return {
      success: false,
      text: "Me envie no formato: 20 kg, 10 repeticoes, hipertrofia.\nSe preferir, pode escrever algo como: fiz 20 kg para 10 repeticoes e meu objetivo e definicao.",
    };
  }

  const safeReps = Math.max(1, Math.round(reps));
  const estimatedOneRepMax = loadKg * (1 + safeReps / 30);
  const objectiveConfig = LOAD_OBJECTIVES[objective];
  const suggestedMin = estimatedOneRepMax * objectiveConfig.minPercent;
  const suggestedMax = estimatedOneRepMax * objectiveConfig.maxPercent;

  return {
    success: true,
    text:
      `Com ${formatLoad(loadKg)} kg para ${safeReps} repeticoes, sua carga maxima estimada fica em torno de ${formatLoad(estimatedOneRepMax)} kg.\n\n` +
      `Para ${objectiveConfig.label}, trabalhe na faixa de ${formatLoad(suggestedMin)} kg a ${formatLoad(suggestedMax)} kg, buscando ${objectiveConfig.repRange}.\n` +
      "Use a faixa mais baixa se a tecnica estiver caindo e a mais alta se ainda houver boa margem com execucao limpa.",
  };
}

export function FAQChatPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [lastViewedCategory, setLastViewedCategory] = useState(null);
  const [lastViewedQuestion, setLastViewedQuestion] = useState(null);
  const [pendingLoadEstimate, setPendingLoadEstimate] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const randomGreeting = GREETING_MESSAGES[Math.floor(Math.random() * GREETING_MESSAGES.length)];
      setMessages([{ type: "bot", text: randomGreeting, timestamp: new Date() }]);
    }
  }, [isOpen, messages.length]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const findAnswer = (query) => {
    const normalizedQuery = query.toLowerCase().trim();
    let bestMatch = null;
    let highestScore = 0;

    Object.entries(FAQ_DATABASE).forEach(([key, category]) => {
      category.questions.forEach((faq) => {
        const questionWords = faq.q.toLowerCase().split(" ");
        const queryWords = normalizedQuery.split(" ");
        let score = 0;
        queryWords.forEach((qWord) => {
          if (questionWords.some((w) => w.includes(qWord) || qWord.includes(w))) {
            score++;
          }
        });
        if (faq.q.toLowerCase().includes(normalizedQuery)) {
          score += 3;
        }
        if (score > highestScore) {
          highestScore = score;
          bestMatch = { ...faq, category: category.title, categoryKey: key };
        }
      });
    });

    return highestScore >= 1 ? bestMatch : null;
  };

  const handleSendMessage = () => {
    if (!searchQuery.trim()) return;
    const userMessage = { type: "user", text: searchQuery, timestamp: new Date() };
    setMessages((prev) => [...prev, userMessage]);
    const query = searchQuery;
    const awaitingLoadEstimate = pendingLoadEstimate;
    setSearchQuery("");
    setIsTyping(true);

    setTimeout(() => {
      let botResponse;
      if (awaitingLoadEstimate) {
        const estimate = buildLoadEstimateResponse(query);
        botResponse = {
          type: "bot",
          text: estimate.text,
          category: FAQ_DATABASE.treino.title,
          categoryKey: "treino",
          relatedQuestion: "Qual carga devo utilizar?",
          timestamp: new Date()
        };
        if (estimate.success) {
          setPendingLoadEstimate(false);
        }
        setLastViewedCategory("treino");
        setLastViewedQuestion({
          q: "Qual carga devo utilizar?",
          categoryKey: "treino",
          categoryTitle: FAQ_DATABASE.treino.title,
        });
      } else {
        const answer = findAnswer(query);
        if (answer) {
          botResponse = {
            type: "bot",
            text: answer.a,
            category: answer.category,
            categoryKey: answer.categoryKey,
            relatedQuestion: answer.q,
            timestamp: new Date()
          };
          if (answer.mode === LOAD_ESTIMATE_MODE) {
            setPendingLoadEstimate(true);
          }
          setLastViewedCategory(answer.categoryKey);
          setLastViewedQuestion({ q: answer.q, categoryKey: answer.categoryKey, categoryTitle: answer.category });
        } else {
          botResponse = {
            type: "bot",
            text: "Nao encontrei uma resposta especifica para sua pergunta. Que tal explorar as categorias abaixo ou reformular sua duvida? Voce tambem pode falar diretamente com seu personal pelo chat.",
            showCategories: true,
            timestamp: new Date()
          };
        }
      }
      setMessages((prev) => [...prev, botResponse]);
      setIsTyping(false);
    }, 800);
  };

  const handleSelectQuestion = (faq, categoryTitle, categoryKey) => {
    const userMessage = { type: "user", text: faq.q, timestamp: new Date() };
    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);
    setLastViewedCategory(categoryKey);
    setLastViewedQuestion({ q: faq.q, categoryKey, categoryTitle });

    setTimeout(() => {
      const botResponse = {
        type: "bot",
        text: faq.a,
        category: categoryTitle,
        categoryKey: categoryKey,
        timestamp: new Date()
      };
      setPendingLoadEstimate(faq.mode === LOAD_ESTIMATE_MODE);
      setMessages((prev) => [...prev, botResponse]);
      setIsTyping(false);
      setSelectedCategory(null);
    }, 500);
  };

  const handleBackToCategories = useCallback(() => {
    setSelectedCategory(null);
    setLastViewedQuestion(null);
  }, []);

  const handleReturnToLastCategory = useCallback(() => {
    if (lastViewedCategory) {
      setSelectedCategory(lastViewedCategory);
    }
  }, [lastViewedCategory]);

  const handleReturnToLastQuestion = useCallback(() => {
    if (lastViewedQuestion) {
      setSelectedCategory(lastViewedQuestion.categoryKey);
    }
  }, [lastViewedQuestion]);

  const getFilteredQuestions = () => {
    if (!searchQuery.trim()) return [];
    const results = [];
    Object.entries(FAQ_DATABASE).forEach(([key, category]) => {
      category.questions.forEach((faq) => {
        if (faq.q.toLowerCase().includes(searchQuery.toLowerCase())) {
          results.push({ ...faq, categoryKey: key, categoryTitle: category.title });
        }
      });
    });
    return results.slice(0, 5);
  };

  const filteredQuestions = getFilteredQuestions();

  return (
    <>
      {/* Botao flutuante */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-24 right-4 z-50 flex items-center justify-center md:bottom-6 md:right-6",
          "h-14 w-14 rounded-full border border-primary/25 bg-gradient-to-br from-primary to-blue-700 shadow-[0_26px_50px_-24px_rgba(0,129,253,0.72)] transition-all duration-300 hover:scale-110",
          "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
          isOpen && "rotate-90"
        )}
        data-testid="faq-chat-toggle"
        aria-label="Abrir chat de duvidas"
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <MessageCircleQuestion className="w-6 h-6 text-white" />
        )}
      </button>

      {/* Popup do chat */}
      <div
        className={cn(
          "fixed bottom-40 right-4 z-50 w-[410px] max-w-[calc(100vw-1.25rem)] md:bottom-24 md:right-6 md:max-w-[calc(100vw-3rem)]",
          "premium-panel-strong overflow-hidden rounded-[1.9rem] border-border/70 shadow-[0_34px_80px_-34px_rgba(15,23,42,0.9)]",
          "origin-bottom-right transform transition-all duration-300",
          isOpen ? "scale-100 opacity-100" : "scale-95 opacity-0 pointer-events-none"
        )}
        data-testid="faq-chat-popup"
      >
        {/* Header */}
        <div className="border-b border-border/60 bg-gradient-to-r from-primary/16 via-background/88 to-blue-700/10 p-4">
          <div className="flex items-center gap-3">
            {selectedCategory ? (
              <button
                onClick={handleBackToCategories}
                className="rounded-[0.95rem] border border-border/60 bg-background/55 p-2 transition-colors hover:bg-secondary/55"
                data-testid="faq-back-btn"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            ) : (
              <div className="rounded-full border border-primary/20 bg-primary/12 p-2.5">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
            )}
            <div className="flex-1">
              <p className="label-uppercase text-primary">{BRAND.assistantName}</p>
              <h3 className="text-lg font-black tracking-[-0.03em]">
                {selectedCategory ? FAQ_DATABASE[selectedCategory].title : "Central de Ajuda"}
              </h3>
              <p className="text-xs text-muted-foreground">
                {selectedCategory ? "Selecione uma pergunta" : "Tire suas duvidas rapidamente"}
              </p>
            </div>
          </div>
        </div>

        {/* Corpo do chat */}
        <div className="flex h-[min(72vh,620px)] flex-col">
          {!selectedCategory ? (
            <>
              {/* Area de mensagens */}
              <ScrollArea className="flex-1 bg-background/12 p-4" ref={scrollRef}>
                <div className="space-y-4">
                  {messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        "flex",
                        msg.type === "user" ? "justify-end" : "justify-start"
                      )}
                    >
                        <div
                          className={cn(
                            "max-w-[85%] rounded-[1.25rem] border px-4 py-3 text-sm shadow-[0_18px_38px_-30px_rgba(15,23,42,0.55)]",
                            msg.type === "user"
                              ? "rounded-br-sm border-primary/35 bg-gradient-to-r from-primary to-blue-700 text-white"
                              : "rounded-bl-sm border-border/50 bg-secondary/50 text-foreground backdrop-blur-sm"
                          )}
                        >
                          {msg.relatedQuestion && (
                           <p className="mb-1 text-xs italic text-muted-foreground">
                             Sobre: {msg.relatedQuestion}
                           </p>
                         )}
                        <p className="leading-relaxed whitespace-pre-line">{msg.text}</p>
                        {msg.category && (
                          <span className="text-xs text-muted-foreground mt-1 block">
                            Categoria: {msg.category}
                          </span>
                        )}
                        {/* Botoes de navegacao inline apos resposta do bot */}
                        {msg.type === "bot" && msg.categoryKey && (
                           <div className="mt-2 flex flex-wrap gap-1.5 border-t border-border/30 pt-2">
                             <button
                               onClick={() => setSelectedCategory(msg.categoryKey)}
                               className="rounded-full border border-primary/20 bg-primary/12 px-2.5 py-1 text-xs text-primary transition-colors hover:bg-primary/20"
                               data-testid={`faq-more-from-${msg.categoryKey}`}
                             >
                               Mais sobre {msg.category}
                             </button>
                             <button
                               onClick={handleBackToCategories}
                               className="flex items-center gap-1 rounded-full border border-border/50 bg-secondary/50 px-2.5 py-1 text-xs transition-colors hover:bg-secondary/70"
                               data-testid="faq-inline-categories-btn"
                             >
                              <LayoutGrid className="w-3 h-3" />
                              Categorias
                            </button>
                          </div>
                        )}
                        {msg.showCategories && (
                           <div className="mt-2 border-t border-border/30 pt-2">
                             <button
                               onClick={handleBackToCategories}
                               className="flex items-center gap-1 rounded-full border border-primary/20 bg-primary/12 px-2.5 py-1 text-xs text-primary transition-colors hover:bg-primary/20"
                               data-testid="faq-show-categories-btn"
                             >
                              <LayoutGrid className="w-3 h-3" />
                              Ver categorias
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  
                   {isTyping && (
                     <div className="flex justify-start">
                       <div className="rounded-[1.25rem] rounded-bl-sm border border-border/50 bg-secondary/50 px-4 py-3">
                         <div className="flex gap-1">
                          <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                          <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                          <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Categorias - mostrar sempre que nao tem categoria selecionada */}
                {messages.length <= 1 && (
                  <div className="mt-4 space-y-2">
                    <p className="mb-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      Categorias populares
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(FAQ_DATABASE).map(([key, cat]) => {
                        const Icon = cat.icon;
                        return (
                          <button
                            key={key}
                            onClick={() => setSelectedCategory(key)}
                            className={cn(
                              "flex items-center gap-2 rounded-[1rem] border p-3 text-left",
                              "border-border/45 bg-secondary/38 transition-all hover:-translate-y-[1px] hover:border-primary/20 hover:bg-secondary/58"
                            )}
                            data-testid={`faq-category-${key}`}
                          >
                            <div className={cn("rounded-[0.85rem] p-1.5", cat.bgColor)}>
                              <Icon className={cn("w-4 h-4", cat.color)} />
                            </div>
                            <span className="truncate text-sm font-semibold">{cat.title}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </ScrollArea>

              {/* Botoes de navegacao rapida (quando ha mensagens e nao e a tela inicial) */}
              {messages.length > 1 && (
                <div className="flex flex-wrap gap-2 border-t border-border/50 px-3 pb-2 pt-2">
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className="flex items-center gap-1.5 rounded-full border border-border/50 bg-secondary/45 px-3 py-1.5 text-xs transition-colors hover:bg-secondary/65"
                    data-testid="faq-nav-categories"
                  >
                    <LayoutGrid className="w-3 h-3" />
                    Categorias
                  </button>
                  {lastViewedCategory && (
                    <button
                      onClick={handleReturnToLastCategory}
                      className="flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/12 px-3 py-1.5 text-xs text-primary transition-colors hover:bg-primary/20"
                      data-testid="faq-nav-last-category"
                    >
                      <ArrowLeft className="w-3 h-3" />
                      {FAQ_DATABASE[lastViewedCategory]?.title}
                    </button>
                  )}
                </div>
              )}

              {/* Sugestoes de busca */}
              {filteredQuestions.length > 0 && (
                <div className="max-h-[150px] overflow-y-auto border-t border-border/60 bg-background/40 p-2">
                  {filteredQuestions.map((faq, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        handleSelectQuestion(faq, faq.categoryTitle, faq.categoryKey);
                        setSearchQuery("");
                      }}
                      className="w-full rounded-[0.95rem] border border-transparent p-2 text-left text-sm transition-colors hover:border-border/50 hover:bg-secondary/45"
                    >
                      <span className="text-xs text-muted-foreground">{faq.categoryTitle}:</span>
                      <p className="truncate">{faq.q}</p>
                    </button>
                  ))}
                </div>
              )}

              {/* Input de busca/mensagem */}
              <div className="border-t border-border/60 bg-background/55 p-3">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      ref={inputRef}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                      placeholder="Digite sua duvida..."
                      className="border-border/60 bg-background/80 pl-9"
                      data-testid="faq-search-input"
                    />
                  </div>
                  <Button
                    size="icon"
                    onClick={handleSendMessage}
                    disabled={!searchQuery.trim()}
                    className="h-11 w-11 shrink-0 rounded-[1rem]"
                    data-testid="faq-send-btn"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            /* Lista de perguntas da categoria */
            <ScrollArea className="flex-1 bg-background/12 p-4">
              <div className="space-y-2">
                {FAQ_DATABASE[selectedCategory].questions.map((faq, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectQuestion(faq, FAQ_DATABASE[selectedCategory].title, selectedCategory)}
                    className={cn(
                      "group w-full rounded-[1.1rem] border p-4 text-left",
                      "border-border/45 bg-secondary/38 transition-all hover:-translate-y-[1px] hover:border-primary/20 hover:bg-secondary/58",
                      "group"
                    )}
                    data-testid={`faq-question-${idx}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium leading-relaxed">{faq.q}</p>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform shrink-0" />
                    </div>
                  </button>
                ))}

                {/* Botao voltar as categorias na lista de perguntas */}
                <button
                  onClick={handleBackToCategories}
                  className={cn(
                    "mt-3 flex w-full items-center gap-2 rounded-[1rem] border border-primary/20 bg-primary/10 p-3 text-left transition-all hover:bg-primary/18 hover:border-primary/35"
                  )}
                  data-testid="faq-back-to-categories-bottom"
                >
                  <LayoutGrid className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-primary">Voltar as categorias</span>
                </button>
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border/60 bg-secondary/22 p-3 text-center">
          <p className="text-xs text-muted-foreground">
            Nao encontrou?{" "}
            <a href="/chat" className="font-semibold text-primary hover:underline">
              Fale com seu personal
            </a>
          </p>
        </div>
      </div>
    </>
  );
}

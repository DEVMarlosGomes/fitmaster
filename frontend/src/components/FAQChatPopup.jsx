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

const FAQ_DATABASE = {
  treino: {
    icon: Dumbbell,
    title: "Treino e Exercicios",
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    questions: [
      { q: "Como registro meu progresso no treino?", a: "Para registrar seu progresso, clique em qualquer exercicio do seu treino. Uma janela vai abrir onde voce pode inserir peso, repeticoes e series de cada set. Os dados sao salvos automaticamente e voce pode acompanhar sua evolucao na secao 'Meu Progresso'." },
      { q: "O que significa PSE e PSR?", a: "PSE (Percepcao Subjetiva de Esforco) mede o quanto o treino foi intenso de 1-10. PSR (Percepcao Subjetiva de Recuperacao) indica como voce estava recuperado antes do treino. Esses indicadores ajudam seu personal a ajustar a periodizacao do seu treino." },
      { q: "Como concluir meu treino do dia?", a: "Apos terminar todos os exercicios, clique no botao 'Concluir Treino' no topo da pagina. Preencha como se sentiu (PSE, PSR, sensacao geral) e adicione observacoes se necessario. Isso gera um resumo completo da sessao." },
      { q: "Posso alterar a ordem dos exercicios?", a: "A ordem dos exercicios e definida pelo seu personal trainer de forma estrategica. Se precisar alterar por algum motivo (equipamento ocupado, por exemplo), converse com seu personal pelo chat para obter orientacao." },
      { q: "O que e sequencia de treinos?", a: "A sequencia mostra quantos treinos consecutivos voce completou. Manter uma sequencia alta aumenta sua pontuacao de gamificacao e demonstra consistencia no treino. Treinar pelo menos 3x por semana ajuda a manter a sequencia ativa." },
      { q: "Como vejo meu historico de treinos?", a: "Na parte inferior da pagina de treino, voce encontra o 'Historico de Sessoes' com os ultimos 8 treinos concluidos. Para um historico completo com graficos, acesse 'Meu Progresso' no menu lateral." },
      { q: "O que significa volume total?", a: "Volume total e a soma de: peso x repeticoes x series de todos os exercicios. Por exemplo: 3 series x 10 reps x 20kg = 600kg de volume. Aumentar o volume progressivamente e um dos principais indicadores de evolucao." },
      { q: "Como funciona a meta semanal?", a: "A meta semanal padrao e de 3 treinos. A barra de progresso mostra quantos voce ja completou nesta semana. Bater a meta regularmente desbloqueia conquistas e melhora seu ranking na gamificacao." }
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
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/10",
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
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
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
  "Ola! Sou o assistente virtual do FitMaster. Como posso ajudar voce hoje?",
  "Oi! Estou aqui para tirar suas duvidas sobre treino, nutricao, app e muito mais!",
  "Bem-vindo! Selecione uma categoria ou digite sua duvida."
];

export function FAQChatPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [lastViewedCategory, setLastViewedCategory] = useState(null);
  const [lastViewedQuestion, setLastViewedQuestion] = useState(null);
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
    setSearchQuery("");
    setIsTyping(true);

    setTimeout(() => {
      const answer = findAnswer(query);
      let botResponse;
      if (answer) {
        botResponse = {
          type: "bot",
          text: answer.a,
          category: answer.category,
          categoryKey: answer.categoryKey,
          relatedQuestion: answer.q,
          timestamp: new Date()
        };
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
          "fixed bottom-6 right-6 z-50 flex items-center justify-center",
          "w-14 h-14 rounded-full shadow-lg transition-all duration-300",
          "bg-gradient-to-br from-primary to-cyan-500 hover:scale-110",
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
          "fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-48px)]",
          "bg-card border border-border rounded-2xl shadow-2xl overflow-hidden",
          "transition-all duration-300 transform origin-bottom-right",
          isOpen ? "scale-100 opacity-100" : "scale-95 opacity-0 pointer-events-none"
        )}
        data-testid="faq-chat-popup"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/20 to-cyan-500/20 p-4 border-b border-border">
          <div className="flex items-center gap-3">
            {selectedCategory ? (
              <button
                onClick={handleBackToCategories}
                className="p-1 rounded-lg hover:bg-white/10 transition-colors"
                data-testid="faq-back-btn"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            ) : (
              <div className="p-2 rounded-full bg-primary/20">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
            )}
            <div className="flex-1">
              <h3 className="font-bold text-lg">
                {selectedCategory ? FAQ_DATABASE[selectedCategory].title : "Central de Ajuda"}
              </h3>
              <p className="text-xs text-muted-foreground">
                {selectedCategory ? "Selecione uma pergunta" : "Tire suas duvidas rapidamente"}
              </p>
            </div>
          </div>
        </div>

        {/* Corpo do chat */}
        <div className="h-[400px] flex flex-col">
          {!selectedCategory ? (
            <>
              {/* Area de mensagens */}
              <ScrollArea className="flex-1 p-4" ref={scrollRef}>
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
                          "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm",
                          msg.type === "user"
                            ? "bg-primary text-white rounded-br-sm"
                            : "bg-secondary/60 rounded-bl-sm"
                        )}
                      >
                        {msg.relatedQuestion && (
                          <p className="text-xs text-muted-foreground mb-1 italic">
                            Sobre: {msg.relatedQuestion}
                          </p>
                        )}
                        <p className="leading-relaxed">{msg.text}</p>
                        {msg.category && (
                          <span className="text-xs text-muted-foreground mt-1 block">
                            Categoria: {msg.category}
                          </span>
                        )}
                        {/* Botoes de navegacao inline apos resposta do bot */}
                        {msg.type === "bot" && msg.categoryKey && (
                          <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-border/30">
                            <button
                              onClick={() => setSelectedCategory(msg.categoryKey)}
                              className="text-xs px-2.5 py-1 rounded-full bg-primary/15 text-primary hover:bg-primary/25 transition-colors"
                              data-testid={`faq-more-from-${msg.categoryKey}`}
                            >
                              Mais sobre {msg.category}
                            </button>
                            <button
                              onClick={handleBackToCategories}
                              className="text-xs px-2.5 py-1 rounded-full bg-secondary/60 hover:bg-secondary/80 transition-colors flex items-center gap-1"
                              data-testid="faq-inline-categories-btn"
                            >
                              <LayoutGrid className="w-3 h-3" />
                              Categorias
                            </button>
                          </div>
                        )}
                        {msg.showCategories && (
                          <div className="mt-2 pt-2 border-t border-border/30">
                            <button
                              onClick={handleBackToCategories}
                              className="text-xs px-2.5 py-1 rounded-full bg-primary/15 text-primary hover:bg-primary/25 transition-colors flex items-center gap-1"
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
                      <div className="bg-secondary/60 rounded-2xl rounded-bl-sm px-4 py-3">
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
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">
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
                              "flex items-center gap-2 p-3 rounded-xl text-left",
                              "bg-secondary/40 hover:bg-secondary/70 transition-all",
                              "border border-transparent hover:border-border/50"
                            )}
                            data-testid={`faq-category-${key}`}
                          >
                            <div className={cn("p-1.5 rounded-lg", cat.bgColor)}>
                              <Icon className={cn("w-4 h-4", cat.color)} />
                            </div>
                            <span className="text-sm font-medium truncate">{cat.title}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </ScrollArea>

              {/* Botoes de navegacao rapida (quando ha mensagens e nao e a tela inicial) */}
              {messages.length > 1 && (
                <div className="px-3 pt-2 pb-1 border-t border-border/50 flex gap-2 flex-wrap">
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className="text-xs px-3 py-1.5 rounded-full bg-secondary/50 hover:bg-secondary/70 transition-colors flex items-center gap-1.5"
                    data-testid="faq-nav-categories"
                  >
                    <LayoutGrid className="w-3 h-3" />
                    Categorias
                  </button>
                  {lastViewedCategory && (
                    <button
                      onClick={handleReturnToLastCategory}
                      className="text-xs px-3 py-1.5 rounded-full bg-primary/15 text-primary hover:bg-primary/25 transition-colors flex items-center gap-1.5"
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
                <div className="border-t border-border p-2 bg-secondary/20 max-h-[150px] overflow-y-auto">
                  {filteredQuestions.map((faq, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        handleSelectQuestion(faq, faq.categoryTitle, faq.categoryKey);
                        setSearchQuery("");
                      }}
                      className="w-full text-left p-2 rounded-lg hover:bg-secondary/50 transition-colors text-sm"
                    >
                      <span className="text-muted-foreground text-xs">{faq.categoryTitle}:</span>
                      <p className="truncate">{faq.q}</p>
                    </button>
                  ))}
                </div>
              )}

              {/* Input de busca/mensagem */}
              <div className="p-3 border-t border-border bg-card">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      ref={inputRef}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                      placeholder="Digite sua duvida..."
                      className="pl-9 bg-secondary/50 border-border/50"
                      data-testid="faq-search-input"
                    />
                  </div>
                  <Button
                    size="icon"
                    onClick={handleSendMessage}
                    disabled={!searchQuery.trim()}
                    className="shrink-0"
                    data-testid="faq-send-btn"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            /* Lista de perguntas da categoria */
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-2">
                {FAQ_DATABASE[selectedCategory].questions.map((faq, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectQuestion(faq, FAQ_DATABASE[selectedCategory].title, selectedCategory)}
                    className={cn(
                      "w-full text-left p-4 rounded-xl",
                      "bg-secondary/40 hover:bg-secondary/70 transition-all",
                      "border border-transparent hover:border-border/50",
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
                    "w-full text-left p-3 rounded-xl mt-3",
                    "bg-primary/10 hover:bg-primary/20 transition-all",
                    "border border-primary/20 hover:border-primary/40",
                    "flex items-center gap-2"
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
        <div className="p-3 border-t border-border bg-secondary/20 text-center">
          <p className="text-xs text-muted-foreground">
            Nao encontrou? <button onClick={() => {}} className="text-primary hover:underline">Fale com seu personal</button>
          </p>
        </div>
      </div>
    </>
  );
}

---
profile: user
language: pt-BR
version: 1.2.0
last_updated: 2026-01-20
---

# Perguntas Frequentes (FAQ)

## Visao Geral

Este documento responde as perguntas mais comuns dos usuarios do TrustLayer. Se sua duvida nao estiver aqui, use o AI Assistant ou contate o suporte.

---

## Acesso e Login

### Como faco para criar uma conta?

Contas no TrustLayer sao criadas pelo administrador da sua organizacao. Voce recebera um email com suas credenciais. Se nao recebeu, contate seu gestor ou departamento de TI.

### Esqueci minha senha. O que fazer?

1. Na tela de login, clique em **Esqueci minha senha**
2. Digite seu email cadastrado
3. Voce recebera um link para redefinir a senha
4. O link expira em 24 horas

### O que e MFA e por que preciso usar?

MFA (Multi-Factor Authentication) e uma camada extra de seguranca. Alem da senha, voce usa um codigo temporario gerado por um app como Google Authenticator. Isso protege sua conta mesmo se a senha for comprometida.

### Posso usar minha conta em multiplos dispositivos?

Sim, voce pode acessar o TrustLayer de qualquer dispositivo com navegador web. Suas sessoes sao sincronizadas automaticamente.

### O que fazer se minha conta foi bloqueada?

Contas sao bloqueadas apos multiplas tentativas de login incorretas. Aguarde 15 minutos ou contate o administrador para desbloquear manualmente.

---

## Assessments

### Quantas perguntas existem em cada avaliacao?

O numero varia por dominio e frameworks selecionados:
- **AI Security**: ~140 perguntas
- **Cloud Security**: ~90 perguntas
- **DevSecOps**: ~70 perguntas

Se voce selecionar multiplos frameworks, perguntas podem se sobrepor.

### Posso pular perguntas e voltar depois?

Sim! Voce pode navegar livremente pelo questionario. Use o filtro "Nao respondidas" para encontrar perguntas pendentes.

### Minhas respostas sao salvas automaticamente?

Sim, cada resposta e salva automaticamente assim que voce seleciona uma opcao. Voce vera um indicador "Salvo" apos cada resposta.

### Posso mudar uma resposta depois?

Sim, basta voltar a pergunta e selecionar a nova resposta. A alteracao sera salva automaticamente e registrada no audit log.

### O que acontece se eu marcar N/A em muitas perguntas?

Perguntas marcadas como N/A sao excluidas do calculo de maturidade. Se muitas perguntas forem N/A, o score pode nao representar bem sua realidade. Use N/A apenas quando a pergunta realmente nao se aplica.

### Como sei quais perguntas sao mais importantes?

O TrustLayer nao atribui pesos diferentes as perguntas, mas os dashboards destacam "Gaps Criticos" baseados em categorias de alto impacto como Governanca e Protecao de Dados.

### Posso fazer a avaliacao em equipe?

Sim! Multiplos usuarios podem responder o mesmo assessment. Recomendamos:
- Dividir por categoria ou dominio
- Usar comentarios para comunicacao
- Designar um revisor final

---

## Dashboards

### Por que meu dashboard esta vazio?

O dashboard precisa de respostas no assessment para mostrar dados. Complete pelo menos algumas perguntas e os graficos aparecerao.

### Qual dashboard devo usar?

- **Executive**: Se voce precisa de visao de alto nivel para reunioes
- **GRC**: Se voce trabalha com compliance e auditorias
- **Specialist**: Se voce precisa de detalhes tecnicos

### Como exporto o dashboard para uma apresentacao?

1. Configure os filtros desejados
2. Clique em **Exportar**
3. Selecione PDF ou PNG
4. Use nas suas apresentacoes

### Os dados do dashboard sao em tempo real?

As respostas aparecem imediatamente. Metricas calculadas (como scores) atualizam a cada 5 minutos.

### Posso criar dashboards personalizados?

Atualmente, voce pode usar filtros para personalizar a visualizacao. Dashboards customizaveis com drag-and-drop estao no roadmap.

---

## Relatorios

### Quais formatos de relatorio estao disponiveis?

- **PDF**: Documento formatado para compartilhamento
- **Excel**: Planilha com dados detalhados
- **CSV**: Dados brutos para integracao

### Como configuro relatorios automaticos?

1. Acesse **Reports** > **Schedules**
2. Clique em **New Schedule**
3. Configure template, frequencia e destinatarios
4. Salve o agendamento

### Por quanto tempo os relatorios ficam disponiveis?

Relatorios gerados ficam disponiveis por 90 dias no historico. Apos isso, sao removidos automaticamente. Recomendamos baixar e arquivar relatorios importantes.

### Posso enviar relatorios para pessoas de fora da minha organizacao?

Sim, basta adicionar o email externo como destinatario no agendamento. Certifique-se de que e permitido pela politica da sua organizacao.

### O relatorio inclui informacoes sensiveis?

Sim, relatorios podem conter detalhes sobre vulnerabilidades e gaps. Trate-os como confidenciais e compartilhe apenas com pessoas autorizadas.

---

## AI Assistant

### O que o AI Assistant pode fazer?

O assistente pode:
- Explicar perguntas do assessment
- Sugerir respostas baseadas no contexto
- Recomendar remediacoes para gaps
- Esclarecer requisitos de frameworks
- Ajudar na navegacao do sistema

### O AI Assistant tem acesso aos meus dados?

O assistente usa apenas o contexto da sua sessao atual (perguntas, respostas, gaps). Ele nao armazena conversas entre sessoes e nao acessa dados de outras organizacoes.

### Posso confiar nas recomendacoes do AI?

O AI fornece orientacoes baseadas em melhores praticas, mas as recomendacoes devem ser validadas por especialistas humanos. Use como ponto de partida, nao como decisao final.

### Como ativo/desativo o AI Assistant?

1. Acesse **Settings**
2. Encontre a secao **AI Assistant**
3. Use o toggle para habilitar/desabilitar
4. Configure preferencias de posicao

### Posso usar comandos de voz?

Sim, se habilitado pelo administrador. Clique no icone de microfone no assistente e fale sua pergunta.

---

## Evidencias

### Que tipos de arquivo posso anexar como evidencia?

- Documentos: PDF, DOC, DOCX, TXT
- Planilhas: XLS, XLSX, CSV
- Imagens: PNG, JPG, GIF
- Tamanho maximo: 10MB por arquivo

### As evidencias sao armazenadas com seguranca?

Sim, evidencias sao criptografadas em transito e em repouso. Apenas usuarios autorizados podem visualiza-las.

### Posso usar a mesma evidencia para multiplas perguntas?

Sim, e recomendado! Uma politica de seguranca pode servir como evidencia para varias perguntas relacionadas.

### Como removo uma evidencia anexada?

1. Va ate a pergunta com a evidencia
2. Clique na evidencia anexada
3. Clique em **Remover**
4. Confirme a remocao

---

## Permissoes e Papeis

### Quais papeis existem no TrustLayer?

| Papel | Permissoes |
|-------|------------|
| **Admin** | Acesso total, gerencia usuarios e configuracoes |
| **Manager** | Edita assessments, gera relatorios, ve dashboards |
| **Analyst** | Edita assessments, ve dashboards |
| **Viewer** | Apenas visualizacao, sem edicao |

### Por que nao consigo editar o assessment?

Voce pode ter papel de **Viewer**, que so permite visualizacao. Contate o administrador para solicitar permissoes de edicao.

### Como solicito mais permissoes?

Contate o administrador da sua organizacao ou seu gestor direto. Eles podem ajustar seu papel no TrustLayer.

---

## Problemas Tecnicos

### A pagina nao carrega ou esta lenta

1. Verifique sua conexao com a internet
2. Tente atualizar a pagina (F5)
3. Limpe o cache do navegador
4. Tente outro navegador

### Perdi respostas que eu tinha dado

Isso e raro devido ao salvamento automatico. Verifique:
- Se voce esta logado na conta correta
- Se os filtros nao estao escondendo as respostas
- Contate o suporte se o problema persistir

### O grafico/dashboard nao aparece

1. Verifique se ha dados (respostas no assessment)
2. Tente outro navegador
3. Desabilite extensoes de bloqueio (ad blockers)
4. Limpe cache e cookies

### Recebi erro ao gerar relatorio

1. Verifique se ha dados no periodo selecionado
2. Tente com filtros menos restritivos
3. Aguarde alguns minutos e tente novamente
4. Contate o suporte se persistir

---

## Integracao e Exportacao

### Posso integrar o TrustLayer com outras ferramentas?

Sim, o TrustLayer suporta:
- Exportacao para Excel/CSV (importavel em BI tools)
- SIEM integration (para logs de auditoria)
- SSO (Azure AD, Okta, etc.)
- API para automacao

### Como exporto meus dados?

1. Para respostas: **Assessments** > **Exportar**
2. Para relatorios: **Reports** > **Generate** ou **History**
3. Para dashboards: **Exportar** no canto superior direito

### Os dados exportados sao completos?

Sim, exportacoes incluem todas as respostas, evidencias (links/descricoes), timestamps e metadados.

---

## Privacidade e Seguranca

### Quem pode ver minhas respostas?

Apenas usuarios da sua organizacao com as permissoes apropriadas. Administradores de outras organizacoes nao tem acesso.

### Os dados sao criptografados?

Sim:
- Em transito: TLS 1.3
- Em repouso: AES-256
- Evidencias: Criptografia adicional

### Onde os dados sao armazenados?

Os dados sao armazenados em servidores seguros com certificacoes SOC 2 e ISO 27001. Consulte o administrador para detalhes sobre a instalacao especifica.

### Existe log de quem acessou meus dados?

Sim, o TrustLayer mantem audit logs completos de todos os acessos e modificacoes. Apenas auditores e administradores podem visualizar esses logs.

---

## Outros

### O TrustLayer funciona em dispositivos moveis?

Sim, a interface e responsiva e funciona em tablets e smartphones. Para melhor experiencia, recomendamos telas maiores para responder assessments.

### Em quais idiomas o TrustLayer esta disponivel?

- Portugues (Brasil)
- Ingles (EUA)
- Espanhol (Espanha)

Mude o idioma no seletor do cabecalho.

### Como reporto um bug ou sugiro uma melhoria?

1. Use o AI Assistant para descrever o problema
2. Contate o administrador da sua organizacao
3. O administrador pode abrir um ticket de suporte

### Existe limite de usuarios por organizacao?

O limite depende do plano contratado. Contate o administrador para informacoes sobre licenciamento.

---

## Precisa de Mais Ajuda?

Se sua pergunta nao foi respondida:

1. **AI Assistant**: Pergunte diretamente no chat
2. **Administrador**: Contate o admin da sua organizacao
3. **Documentacao**: Explore os outros guias disponiveis

---

## Referencias

- [Primeiros Passos](getting-started.md)
- [Guia de Assessments](assessments.md)
- [Guia de Dashboards](dashboards.md)
- [Guia de Reports](reports.md)

---

*Ultima atualizacao: 20 de Janeiro de 2026*

---
profile: user
language: pt-BR
version: 1.2.0
last_updated: 2026-01-20
---

# Guia de Assessments (Avaliacoes)

## Visao Geral

Os Assessments sao o coracao do TrustLayer. Atraves de questionarios estruturados baseados em frameworks internacionais, voce avalia a maturidade de seguranca da sua organizacao e identifica gaps a serem tratados.

## Publico-Alvo

- Analistas de seguranca
- Profissionais de GRC
- Gestores de compliance

---

## 1. Entendendo a Estrutura

### 1.1 Dominios de Seguranca

O TrustLayer organiza avaliacoes em tres dominios principais:

#### AI Security (Seguranca em IA)
Foca em riscos especificos de sistemas de inteligencia artificial:
- Governanca de IA
- Transparencia e explicabilidade
- Privacidade de dados de treinamento
- Seguranca de modelos
- Vieses algoritmicos

#### Cloud Security (Seguranca em Nuvem)
Avalia controles para ambientes de nuvem:
- Gestao de identidades (IAM)
- Protecao de dados
- Seguranca de rede
- Conformidade regulatoria
- Resiliencia e continuidade

#### DevSecOps
Integra seguranca no ciclo de desenvolvimento:
- Seguranca no codigo fonte
- Pipeline de CI/CD seguro
- Gestao de vulnerabilidades
- Supply chain security
- Configuracao segura

### 1.2 Frameworks Suportados

| Dominio | Framework | Descricao |
|---------|-----------|-----------|
| AI Security | NIST AI RMF | Framework de gestao de riscos de IA do NIST |
| AI Security | ISO 42001 | Padrao internacional para gestao de IA |
| AI Security | EU AI Act | Regulamentacao europeia de IA |
| Cloud | CSA CCM v4 | Cloud Controls Matrix da Cloud Security Alliance |
| Cloud | CIS Controls | Controles criticos de seguranca do CIS |
| Cloud | SOC 2 | Criterios de servicos de confianca |
| DevSecOps | NIST SSDF | Secure Software Development Framework |
| DevSecOps | OWASP SAMM | Software Assurance Maturity Model |
| DevSecOps | SLSA | Supply-chain Levels for Software Artifacts |

### 1.3 Categorias e Subcategorias

Dentro de cada dominio, as perguntas sao organizadas em:
- **Categorias**: Agrupamentos de alto nivel (ex: Governanca, Operacoes)
- **Subcategorias**: Topicos especificos (ex: Politicas, Treinamento)

---

## 2. Iniciando uma Avaliacao

### 2.1 Passo 1: Selecionar Dominio

1. Acesse **Assessments** na barra lateral
2. Visualize os tres dominios disponiveis
3. Clique no dominio que deseja avaliar
4. Leia a descricao e escopo do dominio

### 2.2 Passo 2: Selecionar Frameworks

1. Apos escolher o dominio, veja os frameworks disponiveis
2. Marque os frameworks que deseja incluir na avaliacao
3. Voce pode selecionar multiplos frameworks
4. Clique em **Continuar** ou **Iniciar Avaliacao**

**Dica**: Se for sua primeira avaliacao, comece com um framework apenas.

### 2.3 Passo 3: Responder Perguntas

A interface de perguntas mostra:

```
+----------------------------------+
| Categoria: Governanca            |
| Subcategoria: Politicas          |
+----------------------------------+
| Pergunta 1 de 143                |
|                                  |
| A organizacao possui uma         |
| politica de seguranca de IA      |
| documentada e aprovada?          |
|                                  |
| [Sim] [Parcial] [Nao] [N/A]      |
|                                  |
| Evidencia: [Adicionar]           |
| Comentario: [________________]   |
+----------------------------------+
| [< Anterior]        [Proximo >]  |
+----------------------------------+
```

---

## 3. Opcoes de Resposta

### 3.1 Significado de Cada Opcao

| Resposta | Significado | Score |
|----------|-------------|-------|
| **Sim** | Controle totalmente implementado e operacional | 100% |
| **Parcial** | Controle parcialmente implementado ou em progresso | 50% |
| **Nao** | Controle nao implementado | 0% |
| **N/A** | Nao aplicavel ao contexto da organizacao | Excluido do calculo |

### 3.2 Quando Usar Cada Opcao

**Use "Sim" quando:**
- O controle esta documentado
- Esta implementado na pratica
- Existem evidencias verificaveis
- E mantido e revisado regularmente

**Use "Parcial" quando:**
- O controle existe mas nao cobre todos os cenarios
- Esta em processo de implementacao
- Funciona mas nao esta documentado
- Cobre apenas parte do escopo

**Use "Nao" quando:**
- O controle nao existe
- Nao ha planos de implementacao
- Existia mas foi descontinuado

**Use "N/A" quando:**
- A pergunta nao se aplica ao seu negocio
- Voce nao utiliza a tecnologia em questao
- O cenario e impossivel na sua arquitetura

---

## 4. Adicionando Evidencias

### 4.1 Tipos de Evidencia

| Tipo | Descricao | Exemplo |
|------|-----------|---------|
| **Documento** | Arquivo anexado | Politica de seguranca PDF |
| **Link** | URL para recurso | Link para wiki interna |
| **Texto** | Descricao livre | Explicacao do controle |
| **Screenshot** | Captura de tela | Configuracao do sistema |

### 4.2 Como Adicionar Evidencia

1. Clique em **Adicionar Evidencia** na pergunta
2. Selecione o tipo de evidencia
3. Para documentos: arraste ou selecione o arquivo
4. Para links: cole a URL
5. Para texto: escreva a descricao
6. Clique em **Salvar**

### 4.3 Boas Praticas para Evidencias

- **Seja especifico**: Aponte exatamente onde o controle esta documentado
- **Use datas**: Inclua quando o documento foi criado/atualizado
- **Evite duplicatas**: Use a mesma evidencia para multiplas perguntas relacionadas
- **Atualize regularmente**: Evidencias desatualizadas perdem valor

---

## 5. Navegacao e Progresso

### 5.1 Barra de Progresso

No topo da pagina de avaliacao:
- **Total de perguntas**: Quantidade total no assessment
- **Respondidas**: Quantidade ja respondida
- **Percentual**: Progresso em porcentagem

### 5.2 Navegacao por Categoria

Voce pode navegar de duas formas:

**Navegacao Linear:**
- Use os botoes **Anterior** e **Proximo**
- Responda todas as perguntas em sequencia

**Navegacao por Menu:**
- Clique na categoria desejada na barra lateral
- Pule para qualquer secao
- Util para retomar onde parou

### 5.3 Filtros

Filtre perguntas por:
- **Nao respondidas**: Foque no que falta
- **Gaps (Nao/Parcial)**: Revise areas problematicas
- **Com evidencia**: Veja onde ja documentou
- **Por framework**: Foque em um framework especifico

---

## 6. Salvamento e Continuidade

### 6.1 Salvamento Automatico

- Respostas sao salvas automaticamente ao selecionar
- Nao e necessario clicar em "Salvar"
- Um indicador mostra "Salvo" apos cada resposta

### 6.2 Continuando uma Avaliacao

Para retomar uma avaliacao:
1. Acesse **Assessments**
2. Voce retornara automaticamente de onde parou
3. O filtro "Nao respondidas" ajuda a encontrar lacunas

### 6.3 Exportando Respostas

Para backup ou uso offline:
1. Clique em **Exportar** no menu da avaliacao
2. Selecione o formato (Excel, CSV)
3. O arquivo contera todas as respostas e evidencias

### 6.4 Importando Respostas

Para importar de um arquivo:
1. Clique em **Importar** no menu da avaliacao
2. Selecione o arquivo Excel/CSV
3. Visualize a previa das importacoes
4. Confirme a importacao

---

## 7. Finalizando uma Avaliacao

### 7.1 Verificando Completude

Antes de finalizar, verifique:
- Todas as perguntas foram respondidas (ou marcadas N/A)
- Evidencias criticas foram anexadas
- Comentarios explicam decisoes nao obvias

### 7.2 Gerando Relatorios

Apos completar:
1. Acesse **Reports**
2. Selecione o tipo de relatorio
3. Configure filtros (dominio, framework, periodo)
4. Gere o relatorio em PDF ou Excel

### 7.3 Proxima Avaliacao

Recomenda-se reavaliar:
- **Trimestralmente**: Para organizacoes em rapida mudanca
- **Semestralmente**: Para maioria das organizacoes
- **Anualmente**: Minimo recomendado

---

## 8. Dicas Avancadas

### 8.1 Avaliacao Colaborativa

Se multiplos usuarios avaliam:
- Dividam por categoria ou dominio
- Usem comentarios para comunicar
- Um revisor consolida as respostas

### 8.2 Comparando Periodos

Para ver evolucao:
1. Acesse o Dashboard
2. Selecione **Timeline**
3. Compare scores entre avaliacoes

### 8.3 Usando o AI Assistant

O assistente pode ajudar com:
- Explicar perguntas confusas
- Sugerir respostas baseadas no contexto
- Recomendar evidencias apropriadas
- Explicar requisitos dos frameworks

**Exemplo de pergunta ao AI:**
> "O que significa 'governanca de IA' no contexto do NIST AI RMF?"

---

## 9. Troubleshooting

### 9.1 Resposta Nao Salvou

- Verifique sua conexao com a internet
- Atualize a pagina e tente novamente
- Contate o suporte se persistir

### 9.2 Nao Consigo Editar

- Verifique se tem permissao de edicao
- Usuarios "viewer" so podem visualizar
- Contate o administrador para ajustar permissoes

### 9.3 Pergunta Parece Duplicada

- Frameworks diferentes podem ter controles similares
- Use o mesmo raciocinio para consistencia
- Evidencias podem ser compartilhadas

---

## Referencias

- [Primeiros Passos](getting-started.md)
- [Guia de Dashboards](dashboards.md)
- [Guia de Reports](reports.md)
- [FAQ](faq.md)

---

*Ultima atualizacao: 20 de Janeiro de 2026*

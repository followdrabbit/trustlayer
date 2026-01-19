# Screenshots do TrustLayer

Esta pasta contem os screenshots da plataforma TrustLayer para documentacao.

## Screenshots Disponiveis

| Arquivo | Descricao | Status |
|---------|-----------|--------|
| `login.png` | Tela de login com acesso restrito | OK |

### Em `src/assets/screenshots/`:

| Arquivo | Descricao | Status |
|---------|-----------|--------|
| `assessment.png` | Questionario de avaliacao | OK |
| `dashboard-executive.png` | Dashboard Executivo | OK |
| `dashboard-grc.png` | Dashboard GRC | OK |
| `dashboard-specialist.png` | Dashboard Especialista | OK |
| `ai-assistant.png` | Painel do Assistente de IA | OK |
| `frameworks.png` | Gestao de Frameworks | OK |

## Screenshots Sugeridos

| Arquivo | Descricao | Rota |
|---------|-----------|------|
| `voice-profile.png` | Cadastro de perfil de voz | `/profile` |
| `voice-recording.png` | Gravacao com ondas sonoras em tempo real | `/profile` |
| `period-comparison.png` | Card de comparacao de periodos | `/dashboard/executive` |
| `settings-siem.png` | Integracoes SIEM | `/admin` (aba SIEM) |
| `settings-questions.png` | Gestao de Questoes | `/admin` (aba Conteudo) |
| `dark-theme.png` | Qualquer tela em tema escuro | Qualquer pagina |
| `mobile-view.png` | Visualizacao mobile responsiva | Qualquer pagina |

## Especificacoes

- Resolucao recomendada: 1920x1080 ou 1440x900
- Formato: PNG
- Tema: Capture em tema claro (exceto `dark-theme.png`)
- Dados: Use dados reais ou um catalogo importado pelo admin

## Como Capturar

1. Faca login com uma conta provisionada pelo administrador
2. Importe o catalogo inicial e preencha dados suficientes para o screenshot
3. Navegue ate cada pagina e capture o screenshot
4. Salve com os nomes exatos listados acima

## Voice Profile Screenshots

Para capturar screenshots do sistema de voz:

1. Navegue ate `/profile`
2. Localize o card "Perfil de Voz"
3. Para `voice-profile.png`: capture o card com opcoes de enrollment
4. Para `voice-recording.png`:
   - Inicie o cadastro de voz
   - Clique em "Gravar Frase"
   - Capture enquanto as barras de audio estao animadas

## Notas

- Redimensione o navegador para mostrar a area mais relevante
- Para o AI Assistant, abra o painel antes de capturar
- Para Period Comparison, selecione dois periodos com dados
- Para SIEM, adicione pelo menos uma integracao de exemplo
- Para Voice Recording, capture durante a gravacao para ver as ondas sonoras

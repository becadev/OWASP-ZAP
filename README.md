# Tutorial OWASP ZAP — Guia Completo para Aplicações Web com Login Externo (SSO/OAuth)

> **OWASP ZAP (Zed Attack Proxy)** é uma ferramenta open source de segurança mantida pela OWASP, utilizada para encontrar vulnerabilidades em aplicações web por meio de testes automatizados e manuais.
>
> Este tutorial foi elaborado com foco em aplicações **SPA (Single Page Application)** com Next.js que utilizam autenticação externa via **SUAP (OAuth/SSO)**, onde o usuário é redirecionado para um sistema externo para autenticar e retorna com um token JWT.

---

## Sumário

1. [Instalar o OWASP ZAP](#1-instalar-o-owasp-zap)
2. [Executar a Aplicação Web](#2-executar-a-aplicação-web)
3. [Abrir o OWASP ZAP](#3-abrir-o-owasp-zap)
4. [Configurar o Proxy no Firefox](#4-configurar-o-proxy-no-firefox)
5. [Instalar o Certificado do ZAP no Firefox](#5-instalar-o-certificado-do-zap-no-firefox)
6. [Configurar a Autenticação via HTTP Sender Script](#6-configurar-a-autenticação-via-http-sender-script)
7. [Adicionar a Aplicação ao Contexto](#7-adicionar-a-aplicação-ao-contexto)
8. [Navegar Manualmente pela Aplicação](#8-navegar-manualmente-pela-aplicação)
9. [Executar o Active Scan](#9-executar-o-active-scan)
10. [Analisar os Alertas Encontrados](#10-analisar-os-alertas-encontrados)
11. [Corrigir as Vulnerabilidades Identificadas](#11-corrigir-as-vulnerabilidades-identificadas)
12. [Executar um Novo Scan para Validação](#12-executar-um-novo-scan-para-validação)

---

## Por que este tutorial é diferente do fluxo padrão?

O fluxo padrão do ZAP (Automated Scan) **não é suficiente** para aplicações como a nossa. Existem dois motivos principais:

**1. Autenticação OAuth/SSO externa**
O login é feito via SUAP, um provedor externo. O ZAP não consegue automatizar esse fluxo, pois o redirecionamento sai do escopo da aplicação. A estratégia é capturar o token JWT manualmente e injetá-lo em todas as requisições do scan via script.

**2. Aplicação SPA com Next.js**
O Spider tradicional do ZAP não consegue rastrear rotas geradas dinamicamente por JavaScript. A solução é navegar manualmente por todas as páginas com o proxy ativo, deixando o ZAP registrar as rotas.

```
Fluxo de autenticação da nossa aplicação:

Usuário clica em "Entrar"
        ↓
Redirecionado para o SUAP
        ↓
Informa matrícula e senha
        ↓
SUAP redireciona de volta para a aplicação
        ↓
Token JWT armazenado no localStorage
        ↓
Usuário autenticado
```

---

## 1. Instalar o OWASP ZAP

### Windows

1. Acesse o site oficial: [https://www.zaproxy.org/download/](https://www.zaproxy.org/download/)
2. Clique em **Download ZAP** e baixe o instalador `.exe` para Windows.
3. Execute o instalador baixado (`ZAP_<versão>_windows.exe`).
4. Siga as etapas do assistente de instalação (Next → Next → Install → Finish).
5. Ao finalizar, o ZAP estará disponível no menu Iniciar.

> **Pré-requisito:** Java 11 ou superior instalado. Verifique com `java -version` no Prompt de Comando. Caso não tenha, baixe em [https://adoptium.net](https://adoptium.net).

### Linux (Debian/Ubuntu/Pop!_OS)

**Opção recomendada — via Snap:**

```bash
sudo snap install zaproxy --classic
```

Após instalar, execute com:
```bash
zaproxy
```

**Opção alternativa — via instalador `.sh`:**

```bash
# Baixar o instalador
wget https://github.com/zaproxy/zaproxy/releases/download/v2.17.0/ZAP_2_17_0_unix.sh

# Dar permissão de execução
chmod +x ZAP_2_17_0_unix.sh

# Executar o instalador gráfico
./ZAP_2_17_0_unix.sh
```

> **Pré-requisito no Linux:** Java 11+ instalado. Instale com `sudo apt install default-jdk`.

> ⚠️ **Atenção:** No Linux, o arquivo correto para download é o `.sh` (instalador) ou use o Snap. Não existe `.tar.gz` para a versão 2.17.0.

---

## 2. Executar a Aplicação Web

Antes de realizar qualquer scan, a aplicação alvo precisa estar em execução e acessível.

- Inicie o **frontend**: `http://localhost:3000`
- Inicie o **backend**: `http://localhost:8000`
- Confirme o acesso via navegador antes de prosseguir.

> ⚠️ **Atenção:** execute scans apenas em sistemas que você tem permissão explícita para testar. Realizar testes não autorizados é ilegal.
>
> Para praticar sem riscos, utilize aplicações vulneráveis intencionalmente, como [DVWA](https://github.com/digininja/DVWA) ou [WebGoat](https://github.com/WebGoat/WebGoat).

---

## 3. Abrir o OWASP ZAP

### Windows
- Abra o menu Iniciar, pesquise por **OWASP ZAP** e clique no ícone.

### Linux
```bash
# Via Snap
zaproxy
```

Ao abrir, o ZAP perguntará se deseja persistir a sessão. Selecione **"No, I do not want to persist this session"** e clique em **Start**.

---

## 4. Configurar o Proxy no Firefox

O ZAP funciona como um proxy intermediário que intercepta todas as requisições entre o navegador e a aplicação.

1. Abra o Firefox e acesse `about:preferences`
2. Pesquise por **"proxy"** na barra de busca
3. Clique em **"Configurações de Rede"**
4. Selecione **"Configuração manual de proxy"** e preencha:

```
HTTP Proxy:  127.0.0.1
Porta:       8080
```

5. Marque **"Usar este proxy também em HTTPS"**

6. **Não clique em OK ainda.** Abra uma nova aba e acesse `about:config`
7. Pesquise por `network.proxy.allow_hijacking_localhost` e mude para **`true`**
   > Isso é necessário porque o Firefox bloqueia o proxy para `localhost` por padrão.

8. Volte para a aba de configurações do proxy e clique em **OK**

### Validar se o proxy está funcionando

Acesse `http://zap/` no Firefox. Se abrir uma página do ZAP, está funcionando.

> ⚠️ Se as requisições não aparecerem no "Histórico" do ZAP durante o uso, verifique se `http://zap/` ainda abre normalmente — pode ser que a configuração do proxy tenha sido resetada.

> ⚠️ Lembre-se de **desfazer essa configuração** ao terminar os testes para não afetar o uso normal do navegador.

---

## 5. Instalar o Certificado do ZAP no Firefox

O ZAP precisa de um certificado instalado para interceptar conexões HTTPS. Sem ele, o navegador bloqueará os sites com HTTPS.

### 5.1 — Exportar o certificado pelo ZAP

```
Tools → Options → Network → Server Certificates → Save
```

Salve o arquivo `owasp_zap_root_ca.cer` em uma pasta de fácil acesso.

### 5.2 — Importar no Firefox

1. No Firefox, acesse `about:preferences#privacy`
2. Role até o final da página e clique em **"Ver Certificados..."**
3. Vá na aba **"Autoridades"**
4. Clique em **"Importar..."**
5. Selecione o arquivo `owasp_zap_root_ca.cer`
6. Na janela que aparecer, marque:
   - ✅ Confiar neste CA para identificar sites
   - ✅ Confiar neste CA para identificar usuários de e-mail
7. Clique em **OK**

### 5.3 — Validar a instalação

Acesse qualquer site HTTPS com o proxy ativo. Se não aparecer aviso de segurança, o certificado está funcionando corretamente.

---

## 6. Configurar a Autenticação via HTTP Sender Script

Nossa aplicação usa **JWT Bearer Token armazenado no localStorage** — não em cookies. Por isso, o ZAP não consegue capturar a sessão automaticamente. A solução é um script que injeta o token em todas as requisições do scan.

### 6.1 — Faça login e copie o token

1. Com o proxy ativo, acesse a aplicação no Firefox
2. Clique em **"Entrar"** → faça login via SUAP com matrícula e senha
3. Após o redirect de volta, pressione `F12`
4. Vá em **Armazenamento → Armazenamento local → http://localhost:3000**
5. Copie o valor completo da chave **`access`** (token JWT)

> ⚠️ O token começa com `eyJ...` e é bem longo. Copie-o inteiramente.

### 6.2 — Abrir a aba Scripts no ZAP

A aba Scripts pode não estar visível por padrão. Para abri-la:
```
Visualizar → Mostrar painéis de abas → Scripts
```
ou
```
Ferramentas → Scripts...
```

### 6.3 — Criar o script

1. Na aba **Scripts** (painel esquerdo), clique com botão direito em **"HTTP Sender"**
2. Selecione **"New Script"**
3. Preencha:
   - **Nome:** `inject-token-suap`
   - **Linguagem:** ECMAScript
   - **Tipo:** HTTP Sender
4. Cole o seguinte código:

```javascript
function sendingRequest(msg, initiator, helper) {
    msg.getRequestHeader().setHeader(
        "Authorization",
        "Bearer SEU_TOKEN_JWT_AQUI"  // ← substitua pelo token copiado
    );
}

function responseReceived(msg, initiator, helper) {
    // Deixar vazio
}
```

5. Substitua `SEU_TOKEN_JWT_AQUI` pelo token copiado no passo 6.1
6. Salve com `Ctrl+S`
7. **Marque o checkbox** ao lado do nome do script para habilitá-lo

### 6.4 — Quando atualizar o token

Tokens JWT expiram (geralmente entre 15 e 60 minutos). Sempre que fizer um novo login ou o scan retornar respostas `401 Unauthorized`, atualize o token:

1. Copie o novo valor de `access` no `F12 → Armazenamento local`
2. Abra o script no ZAP e substitua o token antigo pelo novo
3. Salve com `Ctrl+S`

---

## 7. Adicionar a Aplicação ao Contexto

O contexto define quais URLs fazem parte do escopo do scan.

1. Na aba **"Sites"** (painel esquerdo do ZAP), clique com **botão direito** em `http://localhost:3000`
2. Selecione **"Include in Context" → "Default Context"**
3. Repita para `http://localhost:8000` (backend/API)

### 7.1 — Configurar Autenticação no Contexto (opcional)

Na janela **Session Properties** que abrir, clique em **"Autenticação"**:

- Método: **Autenticação Manual**
  - Não requer configuração adicional para o nosso caso.

Para que o ZAP identifique se a sessão está ativa durante o scan, preencha os campos de regex:

**Padrão Regex — mensagens conectadas** (texto visível quando logado):
```
Sair|Logout|dashboard
```

**Padrão Regex — mensagens desconectadas** (texto visível quando não logado):
```
Entrar com SUAP|matrícula|Faça login
```

> 💡 Para descobrir o texto correto: acesse a aplicação logado, pressione `F12`, inspecione o HTML e procure um elemento exclusivo da área autenticada.

> ℹ️ Como nossa aplicação usa JWT via localStorage, a configuração de **Usuários** e **Forced User Mode** não é necessária — o HTTP Sender Script já cuida da injeção do token.

---

## 8. Navegar Manualmente pela Aplicação

Como a aplicação é uma **SPA com Next.js**, o Spider tradicional do ZAP não consegue descobrir as rotas dinamicamente. A solução é navegar manualmente com o proxy ativo.

### Por que isso é necessário?

O ZAP detecta aplicações modernas e exibe o alerta **"Modern Web Application"** no relatório. Isso significa que as rotas são geradas por JavaScript e o scan automático cobrirá apenas as páginas iniciais.

### Como navegar

1. Com o Firefox usando o proxy `127.0.0.1:8080`, acesse `http://localhost:3000`
2. Faça login via SUAP
3. Navegue por **todas as páginas e funcionalidades** da aplicação:
   - Clique em cada item do menu
   - Abra listagens e detalhes
   - Preencha e submeta formulários
   - Acesse todas as rotas disponíveis
4. Confirme no ZAP que as rotas aparecem na aba **"Sites"** em tempo real
5. Confirme no **"Histórico"** que as requisições estão sendo capturadas

> 💡 Quanto mais páginas você visitar, maior será a cobertura do scan. Anote as páginas acessadas para garantir cobertura completa.

> ⚠️ **Atenção ao AJAX Spider:** o ZAP instalado via Snap não consegue abrir navegadores automaticamente (ambiente containerizado). Por isso, o **Manual Explore** e o **AJAX Spider automático** não funcionarão para lançar o navegador — use sempre o seu Firefox já configurado com o proxy.

---

## 9. Executar o Active Scan

Após navegar por todas as páginas, execute o Active Scan sobre o que foi capturado.

### 9.1 — Active Scan no Frontend

Na aba **Sites**, clique com botão direito em `http://localhost:3000`:
```
Attack → Active Scan
```

Na janela que abrir:
- **Recurse:** ✅ marcado (para varrer todas as subpáginas)
- **Policy:** `Default Policy` (mais completa que a "Dev Standard")
- Clique em **Start Scan**

### 9.2 — Active Scan no Backend

Repita o mesmo processo para a API:
```
Sites → botão direito em http://localhost:8000 → Attack → Active Scan → Start Scan
```

### 9.3 — Acompanhar o progresso

Na aba **"Varredura Ativa"** no painel inferior:
- Acompanhe o percentual de progresso
- Observe os alertas aparecendo em tempo real na aba **"Alertas"**
- Fique de olho no **"Histórico"** — respostas `401` ou `403` indicam token expirado

### 9.4 — Gerar o Relatório

Ao término do scan:
```
Relatório → Gerar Relatório → formato HTML → Gerar
```

---

## 10. Analisar os Alertas Encontrados

Os resultados ficam disponíveis na aba **"Alertas"** no painel inferior.

### Níveis de risco

| Nível | Cor | Descrição | Prioridade |
|-------|-----|-----------|------------|
| **Alto** | 🔴 Vermelho | Vulnerabilidade crítica, exploração com alto impacto (ex.: SQLi, XSS Stored) | Corrigir imediatamente |
| **Médio** | 🟠 Laranja | Vulnerabilidade significativa com impacto moderado | Corrigir em breve |
| **Baixo** | 🟡 Amarelo | Risco menor, mas deve ser corrigido | Planejar correção |
| **Informativo** | 🔵 Azul | Apenas observações, sem risco direto | Avaliar caso a caso |

### Como analisar cada alerta

1. Clique em um alerta na lista para expandi-lo
2. Leia os campos:
   - **Alert:** nome da vulnerabilidade
   - **Risk:** nível de criticidade
   - **URL:** endpoint afetado
   - **Parameter:** parâmetro vulnerável
   - **Evidence:** trecho da resposta que confirmou o problema
   - **Solution:** sugestão de correção
   - **Reference:** links para mais informações (OWASP, CWE)
3. Use os filtros por nível de risco para priorizar

### Alertas encontrados na nossa aplicação (primeiro scan)

| Alerta | Nível | Descrição |
|--------|-------|-----------|
| Missing Anti-clickjacking Header | 🟠 Médio | Falta o header `X-Frame-Options` |
| Content Security Policy (CSP) ausente | 🟠 Médio | Sem regras de segurança para carregamento de recursos |
| X-Content-Type-Options Header Missing | 🟡 Baixo | Falta o header `X-Content-Type-Options: nosniff` |
| Divulgação de Data/Hora Unix | 🟡 Baixo | Timestamps expostos nas respostas |
| X-Powered-By exposto | 🟡 Baixo | Servidor revela tecnologia utilizada |
| Comentários suspeitos no código | 🔵 Informativo | Comentários no HTML/JS com possível info sensível |
| Modern Web Application | 🔵 Informativo | ZAP detectou que é uma SPA (cobertura limitada pelo Spider) |

---

## 11. Corrigir as Vulnerabilidades Identificadas

### Cabeçalhos HTTP ausentes ou inseguros

A maioria dos alertas encontrados está relacionada a **cabeçalhos HTTP de segurança**. No Next.js, configure em `next.config.js`:

```javascript
const securityHeaders = [
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'  // Corrige: Anti-clickjacking
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'  // Corrige: X-Content-Type-Options Missing
  },
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';"
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  }
];

module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};
```

No **Django (backend)**, instale o `django-csp` e configure no `settings.py`:

```python
MIDDLEWARE = [
    'csp.middleware.CSPMiddleware',
    ...
]

# Remove o header X-Powered-By
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'SAMEORIGIN'
```

### Outras vulnerabilidades comuns

**SQL Injection**
- Utilize **prepared statements** e **parameterized queries**
- Nunca concatene entradas do usuário diretamente em queries SQL

**Cross-Site Scripting (XSS)**
- Faça **encoding/escaping** de saídas HTML
- Implemente uma **Content Security Policy (CSP)**

**CSRF (Cross-Site Request Forgery)**
- Implemente **tokens CSRF** em formulários e requisições de estado
- No Django, o `CsrfViewMiddleware` já cuida disso por padrão

**Exposição de informações sensíveis**
- Remova mensagens de erro detalhadas em produção
- Remova o header `X-Powered-By` do servidor

**Comentários suspeitos**
- Revise o código e remova comentários com informações sensíveis (TODOs com dados, credenciais, etc.)

> Consulte a documentação oficial em [https://owasp.org/www-project-top-ten/](https://owasp.org/www-project-top-ten/) para guias detalhados por tipo de vulnerabilidade.

---

## 12. Executar um Novo Scan para Validação

Após implementar as correções, realize um novo scan para confirmar que as vulnerabilidades foram eliminadas.

1. Atualize o token JWT no script (faça login novamente e copie o novo token)
2. Navegue por todas as páginas da aplicação novamente com o proxy ativo
3. Execute o Active Scan:
   ```
   Sites → botão direito em http://localhost:3000 → Attack → Active Scan → Start Scan
   ```
4. Gere o novo relatório e compare com o anterior:
   - Vulnerabilidades corrigidas não devem mais aparecer
   - Novos alertas indicam regressões ou problemas introduzidos durante as correções
5. Repita o ciclo **corrigir → escanear → validar** até que todos os alertas de alto e médio risco sejam resolvidos

---

## Solução de Problemas

### Requisições não aparecem no Histórico do ZAP

| Causa | Solução |
|-------|---------|
| Proxy não está ativo | Verifique em `about:preferences` se `127.0.0.1:8080` está configurado |
| Firefox ignorando localhost | Verifique se `network.proxy.allow_hijacking_localhost` está `true` em `about:config` |
| Proxy caiu | Acesse `http://zap/` — se não abrir, reconfigure o proxy |

### Campo "Sessão HTTP Existente" está vazio ao adicionar usuário

Não é um problema para nossa aplicação — usamos JWT via script, não sessão HTTP. Ignore essa configuração.

### AJAX Spider não funciona

O ZAP instalado via Snap não consegue abrir navegadores. Use o Firefox manualmente com o proxy ativo — o resultado é equivalente.

### Token expirado durante o scan (respostas 401/403)

1. Pare o scan
2. Abra o Firefox, acesse a aplicação e copie o novo token do `F12 → Armazenamento local → access`
3. Atualize o script `inject-token-suap` no ZAP com o novo token
4. Reinicie o scan

### Scan cobre poucas páginas

Navegue manualmente por mais páginas antes de rodar o scan. O ZAP só testa o que passou pelo proxy.

---

## Resumo do Fluxo Completo

```
1. Instalar ZAP (Snap no Linux)
        ↓
2. Iniciar a aplicação (frontend :3000 + backend :8000)
        ↓
3. Configurar proxy Firefox → 127.0.0.1:8080
   + network.proxy.allow_hijacking_localhost = true
        ↓
4. Instalar certificado ZAP no Firefox
        ↓
5. Fazer login via SUAP com proxy ativo
        ↓
6. Copiar token JWT do localStorage (F12 → Armazenamento local → access)
        ↓
7. Criar HTTP Sender Script no ZAP com o token
        ↓
8. Incluir localhost:3000 e localhost:8000 no Contexto
        ↓
9. Navegar manualmente por TODAS as páginas da aplicação
        ↓
10. Active Scan → localhost:3000 e localhost:8000
        ↓
11. Gerar Relatório → Analisar Alertas
        ↓
12. Corrigir vulnerabilidades → Repetir scan para validar
```

---

## Referências

- Documentação oficial do ZAP: [https://www.zaproxy.org/docs/](https://www.zaproxy.org/docs/)
- OWASP Top 10: [https://owasp.org/www-project-top-ten/](https://owasp.org/www-project-top-ten/)
- ZAP no GitHub: [https://github.com/zaproxy/zaproxy](https://github.com/zaproxy/zaproxy)
- ZAP FAQ — No Browser: [https://www.zaproxy.org/faq/no-browser/](https://www.zaproxy.org/faq/no-browser/)
- Next.js Security Headers: [https://nextjs.org/docs/advanced-features/security-headers](https://nextjs.org/docs/advanced-features/security-headers)
- Django Security: [https://docs.djangoproject.com/en/stable/topics/security/](https://docs.djangoproject.com/en/stable/topics/security/)

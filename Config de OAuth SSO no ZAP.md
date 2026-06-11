# Configurando o OWASP ZAP para Aplicações com Login Externo (SSO/OAuth via SUAP)

> Este tutorial cobre a configuração completa do ZAP para aplicações que utilizam autenticação externa via SUAP (ou qualquer provedor OAuth/SSO), onde o usuário é redirecionado para um sistema externo para autenticar e retorna com uma sessão ativa.

---

## Visão Geral do Fluxo

```
Usuário clica em "Entrar"
        ↓
Redirecionado para o SUAP (provedor externo)
        ↓
Informa matrícula e senha no SUAP
        ↓
SUAP redireciona de volta para a aplicação
        ↓
Aplicação recebe token/cookie de sessão
        ↓
Usuário está autenticado
```

O ZAP **não consegue automatizar** esse fluxo de login externo, pois o SUAP está fora do escopo da aplicação. A estratégia é **capturar a sessão manualmente** e injetá-la no scan.

---

## Etapa 1 — Configurar o Proxy no Firefox

O ZAP funciona como um proxy intermediário que intercepta todas as requisições entre o navegador e a aplicação.

1. Abra o Firefox
2. Acesse `about:preferences`
3. Pesquise por **"proxy"** na barra de busca
4. Clique em **"Configurações de Rede"**
5. Selecione **"Configuração manual de proxy"** e preencha:

```
HTTP Proxy:  127.0.0.1
Porta:       8080
```

6. Marque também **"Usar este proxy para HTTPS"** (Não apertar em OK até realizar o passo 7)
7. Acessar `about:config` no firefox:
   - Buscar `network.proxy.allow_hijacking_localhost` , mudar para True
9. Clique em **OK**

> ⚠️ Lembre-se de **desfazer essa configuração** ao terminar os testes, para não afetar o uso normal do navegador.
> Conferir se a configuração do proxy deu certo acessando `http://zap/` se não aparecer nada é porque deu errado.
> ⚠️ se as requiisçoes não estiver aparacendo no "historico" é porque a configuração do proxy caiu, verificar se `http://zap/` está acessando normalmente.
---

## Etapa 2 — Instalar o Certificado do ZAP no Firefox

O ZAP precisa de um certificado instalado para interceptar conexões HTTPS. Sem ele, o navegador bloqueará os sites com HTTPS.

### 2.1 — Exportar o certificado pelo ZAP

```
Tools → Options → Network → Server Certificates → Save
```

Salve o arquivo `owasp_zap_root_ca.cer` em uma pasta de fácil acesso.

### 2.2 — Importar no Firefox

1. No Firefox, acesse `about:preferences#privacy`
2. Role até o final da página e clique em **"Ver Certificados..."**
3. Vá na aba **"Autoridades"**
4. Clique em **"Importar..."**
5. Selecione o arquivo `owasp_zap_root_ca.cer`
6. Na janela que aparecer, marque:
   - ✅ Confiar neste CA para identificar sites
   - ✅ Confiar neste CA para identificar usuários de e-mail
7. Clique em **OK**

### 2.3 — Validar a instalação

Acesse qualquer site HTTPS com o proxy ativo. Se não aparecer aviso de segurança, o certificado está funcionando.

---

## Etapa 3 — Fazer Login com o Proxy Ativo

Com o proxy configurado e o certificado instalado:

1. Abra o ZAP (deixe-o aberto em segundo plano)
2. No Firefox, acesse sua aplicação normalmente
3. Clique em **"Entrar"** → será redirecionado ao SUAP
4. Informe sua **matrícula e senha** no SUAP
5. Aguarde o redirect de volta para sua aplicação
6. Confirme que você está autenticado na aplicação

Neste momento, o ZAP terá capturado todas as requisições do fluxo de login, incluindo os cookies e tokens de sessão.

---

## Etapa 4 — Verificar as Requisições Capturadas no ZAP

1. No ZAP, observe o painel **"Sites"** (esquerdo)
2. Sua aplicação deve aparecer na árvore de sites
3. Clique em uma requisição capturada
4. No painel direito, vá na aba **"Response"**
5. Localize o cookie de sessão — geralmente chamado de `sessionid`, `access_token`, `token` ou similar

---

## Etapa 5 — Adicionar a Aplicação ao Contexto

O contexto define quais URLs fazem parte do escopo do scan.

1. Na aba **"Sites"**, clique com o **botão direito** na URL da sua aplicação
2. Selecione **"Include in Context" → "Default Context"**
3. Abrirá a janela **"Session Properties"**

---

## Etapa 6 — Configurar a Autenticação no Contexto

Na janela **Session Properties**, clique em **"Autenticação"** no menu lateral:

- **Método:** `Autenticação Manual`
  - Este método informa ao ZAP que o login é feito externamente (via SUAP) e que a sessão será fornecida manualmente.
  - A própria tela informa: *"Esse método está totalmente configurado e não necessita qualquer configuração."*

### Configurar Verificação de Autenticação (opcional, mas recomendado)

Preencha os campos de regex para que o ZAP saiba identificar se a sessão ainda está ativa:

**Padrão Regex — mensagens conectadas** (texto que aparece quando logado):
```
Sair|Logout|dashboard|meu perfil|bem-vindo
```

**Padrão Regex — mensagens desconectadas** (texto que aparece quando não logado):
```
Entrar com SUAP|matrícula|Faça login|não autorizado
```

> 💡 Para descobrir o texto correto: acesse a aplicação logado, pressione `F12`, inspecione o HTML e procure um elemento exclusivo da área autenticada (ex.: nome do usuário, botão de sair).

Clique em **OK** para salvar.

---

## Etapa 7 — Adicionar o Usuário com a Sessão Capturada

Ainda na janela **Session Properties**, clique em **"Usuários"**:

1. Clique em **"Adicionar..."**
2. Preencha o **Nome de Usuário** (ex.: `aluno-suap`)
3. Marque **"Habilitado"**
4. No campo **"Sessão HTTP Existente"**, selecione a sessão capturada na lista

> ⚠️ **Se o campo "Sessão HTTP Existente" estiver vazio**, significa que o ZAP ainda não reconheceu a sessão. Veja a seção de solução de problemas ao final deste tutorial.

5. Clique em **"Adicionar"** → depois **OK**

---

## Etapa 8 — Ativar o Modo Forced User

O Forced User faz o ZAP injetar automaticamente a sessão do usuário em todas as requisições do scan.

No menu superior do ZAP, clique no ícone de **boneco com cadeado 🔒**, ou acesse:

```
Users → Enable Forced User Mode for Context
```

---

## Etapa 9 — Alternativa Robusta: HTTP Sender Script

Se a sessão expirar durante o scan (comum em tokens OAuth com curta duração), use um script para injetar o token em todas as requisições:

### 9.1 — Copiar o token/cookie

1. Com a aplicação aberta no navegador, pressione `F12`
2. Vá em **Application** (Chrome) ou **Storage** (Firefox)
3. Clique em **Cookies** → selecione o domínio da sua aplicação
4. Copie o valor do cookie de sessão

### 9.2 — Criar o script no ZAP

1. No ZAP, abra a aba **"Scripts"** (painel esquerdo)
2. Clique com botão direito em **"HTTP Sender"** → **"New Script"**
3. Dê um nome (ex.: `inject-session-suap`)
4. Selecione linguagem **ECMAScript**
5. Cole o seguinte código:

```javascript
function sendingRequest(msg, initiator, helper) {
    // Para injetar via cookie de sessão:
    msg.getRequestHeader().setHeader(
        "Cookie", "sessionid=SEU_VALOR_DE_COOKIE_AQUI"
    );

    // Para injetar via token Bearer (se a aplicação usar JWT):
    // msg.getRequestHeader().setHeader(
    //     "Authorization", "Bearer SEU_TOKEN_JWT_AQUI"
    // );
}

function responseReceived(msg, initiator, helper) {
    // Deixar vazio
}
```

6. Substitua `SEU_VALOR_DE_COOKIE_AQUI` pelo valor copiado no passo anterior
7. Salve o script e **marque o checkbox** ao lado do nome para habilitá-lo

---

## Etapa 10 — Executar o Scan

Com tudo configurado:

1. Acesse **Quick Start → Automated Scan**
2. Informe a URL da aplicação
3. Clique em **"Attack"**

O ZAP irá rastrear e escanear a aplicação autenticado com a sessão do SUAP.

---

## Solução de Problemas

### Campo "Sessão HTTP Existente" está vazio

| Causa | Solução |
|---|---|
| Proxy não estava ativo durante o login | Refaça o login com o proxy configurado e o ZAP aberto |
| Site não está no contexto | Botão direito na URL → Include in Context |
| Cookie tem nome não padrão | `Tools → Options → HTTP Sessions → Default Tokens` → adicione o nome do cookie |
| Gerenciamento de sessões desabilitado | `Tools → Options → HTTP Sessions` → verifique se está ativo |

### ZAP não captura requisições do SUAP

O domínio do SUAP (externo) não precisa estar no contexto — apenas a sua aplicação. O redirect do SUAP será capturado automaticamente pois passa pelo proxy.

### Scan retorna resultados como não autenticado

Verifique se:
- O Forced User Mode está ativo (ícone de boneco 🔒 destacado)
- O token/cookie ainda está válido (tokens OAuth expiram)
- O HTTP Sender Script está habilitado (checkbox marcado)

---

## Resumo do Fluxo de Configuração

```
1. Configurar proxy Firefox → 127.0.0.1:8080
        ↓
2. Instalar certificado ZAP no Firefox
        ↓
3. Fazer login na aplicação via SUAP (com proxy ativo)
        ↓
4. Incluir URL no Contexto do ZAP
        ↓
5. Context → Autenticação → Autenticação Manual
        ↓
6. Context → Usuários → Adicionar → Selecionar sessão capturada
        ↓
7. Ativar Forced User Mode
        ↓
8. (Opcional) HTTP Sender Script para injetar token manualmente
        ↓
9. Quick Start → Automated Scan → Attack
```

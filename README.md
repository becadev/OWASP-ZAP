# Tutorial OWASP ZAP — Guia Passo a Passo

> **OWASP ZAP (Zed Attack Proxy)** é uma ferramenta open source de segurança mantida pela OWASP, utilizada para encontrar vulnerabilidades em aplicações web por meio de testes automatizados e manuais.

---

## 1. Instalar o OWASP ZAP

### Windows

1. Acesse o site oficial: [https://www.zaproxy.org/download/](https://www.zaproxy.org/download/)
2. Clique em **Download ZAP** e baixe o instalador `.exe` para Windows.
3. Execute o instalador baixado (`ZAP_<versão>_windows.exe`).
4. Siga as etapas do assistente de instalação (Next → Next → Install → Finish).
5. Ao finalizar, o ZAP estará disponível no menu Iniciar.

> **Pré-requisito:** Java 11 ou superior instalado. Verifique com `java -version` no Prompt de Comando. Caso não tenha, baixe em [https://adoptium.net](https://adoptium.net).

### Linux (Debian/Ubuntu)

**Opção 1 — via pacote `.tar.gz` (recomendado):**

```bash
# Baixar o pacote
wget https://github.com/zaproxy/zaproxy/releases/latest/download/ZAP_<versão>_Linux.tar.gz

# Extrair
tar -xvzf ZAP_<versão>_Linux.tar.gz

# Acessar o diretório
cd ZAP_<versão>/

# Executar
./zap.sh
```

**Opção 2 — via Snap:**

```bash
sudo snap install zaproxy --classic
```

**Opção 3 — via Docker:**

```bash
docker pull zaproxy/zap-stable
docker run -u zap -p 8080:8080 zaproxy/zap-stable zap.sh -daemon -host 0.0.0.0 -port 8080
```

> **Pré-requisito no Linux:** Java 11+ instalado. Instale com `sudo apt install default-jdk`.

---

## 2. Executar a Aplicação Web

Antes de realizar qualquer scan, a aplicação alvo precisa estar em execução e acessível.

- **Aplicação local:** inicie o servidor normalmente (ex.: `npm start`, `python manage.py runserver`, `java -jar app.jar`, etc.) e confirme o acesso via navegador em `http://localhost:<porta>`.
- **Aplicação em servidor remoto:** certifique-se de que a URL está acessível a partir da máquina onde o ZAP está sendo executado.
- **Ambiente de testes recomendado para estudos:** utilize ambientes isolados ou aplicações vulneráveis intencionalmente, como [DVWA](https://github.com/digininja/DVWA) ou [WebGoat](https://github.com/WebGoat/WebGoat), para praticar sem riscos.

---

## 3. Abrir o OWASP ZAP

### Windows

- Abra o menu Iniciar, pesquise por **OWASP ZAP** e clique no ícone para iniciar.

### Linux

```bash
# Via instalação manual
./zap.sh

# Via Snap
zaproxy
```

Ao abrir, o ZAP pode perguntar se deseja persistir a sessão atual. Para fins de teste, selecione **"No, I do not want to persist this session"** e clique em **Start**.

---

## 4. Selecionar "Quick Start"

Após a abertura da interface principal do ZAP:

1. Localize a aba **"Quick Start"** no painel central (geralmente já aberta por padrão na primeira execução).
2. Caso não esteja visível, acesse pelo menu: **Help → Quick Start**.

A aba Quick Start oferece duas opções principais de uso: **Automated Scan** e **Manual Explore**.

---

## 5. Escolher "Automated Scan"

Na aba Quick Start:

1. Clique no botão **"Automated Scan"**.

O Automated Scan combina dois tipos de análise:
- **Spider (Rastreamento):** mapeia automaticamente todos os links e páginas da aplicação.
- **Active Scan:** testa ativamente os endpoints encontrados em busca de vulnerabilidades.

---

## 6. Informar a URL da Aplicação

Na tela do Automated Scan:

1. Localize o campo **"URL to attack"**.
2. Digite a URL completa da aplicação alvo, por exemplo:

```
http://localhost:8080
```

ou

```
https://minha-aplicacao-de-teste.com
```

3. Certifique-se de que a URL está correta e acessível antes de continuar.

> **Dica:** se a aplicação requer autenticação, configure as credenciais em **Tools → Options → Authentication** antes de iniciar o scan para obter uma cobertura mais completa.

---

## 7. Executar o Scan

1. Com a URL preenchida, clique no botão **"Attack"**.
2. O ZAP iniciará o processo em duas etapas:
   - **Spider:** rastreia a aplicação e descobre endpoints, formulários e parâmetros.
   - **Active Scan:** dispara requisições com payloads maliciosos para identificar vulnerabilidades.
3. Acompanhe o progresso na barra de status na parte inferior da tela e na aba **"Active Scan"**.

O tempo de execução varia conforme o tamanho e complexidade da aplicação. Aplicações simples podem ser escaneadas em poucos minutos; aplicações maiores podem levar horas.

---

## 8. Analisar os Alertas Encontrados

Ao término do scan, os resultados ficam disponíveis na aba **"Alerts"** (painel inferior esquerdo):

### Entendendo os níveis de risco

| Nível | Cor | Descrição |
|-------|-----|-----------|
| **High** | 🔴 Vermelho | Vulnerabilidade crítica, exploração com alto impacto (ex.: SQLi, XSS Stored) |
| **Medium** | 🟠 Laranja | Vulnerabilidade significativa, requer atenção prioritária |
| **Low** | 🟡 Amarelo | Risco menor, mas deve ser corrigido |
| **Informational** | 🔵 Azul | Apenas informativo, sem risco direto |

### Como analisar cada alerta

1. Clique em um alerta na lista para expandi-lo.
2. Leia a descrição, que inclui:
   - **Alert:** nome da vulnerabilidade.
   - **Risk:** nível de criticidade.
   - **URL:** endpoint afetado.
   - **Parameter:** parâmetro vulnerável.
   - **Evidence:** trecho da resposta que confirmou o problema.
   - **Solution:** sugestão de correção.
   - **Reference:** links para mais informações (OWASP, CWE, etc.).
3. Use os filtros por nível de risco para priorizar as correções.

> **Dica:** exporte os resultados via **Report → Generate Report** para formatos HTML, XML ou JSON, facilitando o compartilhamento com a equipe.

---

## 9. Corrigir as Vulnerabilidades Identificadas

Com base nos alertas, aplique as correções no código-fonte ou configuração da aplicação. Abaixo estão as abordagens mais comuns para as vulnerabilidades frequentemente encontradas:

### SQL Injection
- Utilize **prepared statements** e **parameterized queries**.
- Nunca concatene entradas do usuário diretamente em queries SQL.

### Cross-Site Scripting (XSS)
- Faça **encoding/escaping** de saídas HTML.
- Implemente uma **Content Security Policy (CSP)** no cabeçalho HTTP.

### Cabeçalhos HTTP ausentes ou inseguros
- Adicione cabeçalhos como `X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security` e `Content-Security-Policy` nas respostas do servidor.

### Exposição de informações sensíveis
- Remova mensagens de erro detalhadas em ambientes de produção.
- Desative listagem de diretórios no servidor web.

### CSRF (Cross-Site Request Forgery)
- Implemente **tokens CSRF** em formulários e requisições de estado.

### Cookies inseguros
- Adicione os atributos `HttpOnly`, `Secure` e `SameSite` aos cookies de sessão.

> Consulte a documentação oficial da OWASP em [https://owasp.org/www-project-top-ten/](https://owasp.org/www-project-top-ten/) para guias detalhados de correção por tipo de vulnerabilidade.

---

## 10. Executar um Novo Scan para Validação

Após implementar as correções, realize um novo scan para confirmar que as vulnerabilidades foram eliminadas:

1. No ZAP, acesse **Quick Start → Automated Scan**.
2. Informe novamente a URL da aplicação.
3. Clique em **"Attack"** para iniciar o novo ciclo de varredura.
4. Compare os alertas do novo relatório com o anterior:
   - Vulnerabilidades corrigidas não devem mais aparecer.
   - Novos alertas indicam regressões ou problemas introduzidos durante as correções.
5. Repita o ciclo de **corrigir → escanear → validar** até que todos os alertas de alto e médio risco sejam resolvidos.

> **Boas práticas:** integre o ZAP ao pipeline de CI/CD utilizando o modo headless (`zap.sh -daemon`) ou a [API REST do ZAP](https://www.zaproxy.org/docs/api/) para automatizar testes de segurança a cada deploy.

---

## Referências

- Documentação oficial do ZAP: [https://www.zaproxy.org/docs/](https://www.zaproxy.org/docs/)
- OWASP Top 10: [https://owasp.org/www-project-top-ten/](https://owasp.org/www-project-top-ten/)
- ZAP no GitHub: [https://github.com/zaproxy/zaproxy](https://github.com/zaproxy/zaproxy)

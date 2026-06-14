## 1. No nosso PDS
No contexto do nosso PDS, o Autometed Scan cobriu apenas 3 telas, isso ocorreu porque o ZAP detectou **"Modern Web Application"** no relatório — isso significa que ele identificou que nossa aplicação é uma **SPA (Single Page Application)** com Next.js, onde as rotas são geradas dinamicamente por JavaScript. O Spider tradicional não consegue rastrear esse tipo de aplicação.

### Solução — Usar o Manual Explore + AJAX Spider

A abordagem correta para SPAs é **navegar manualmente** pela aplicação com o proxy ativo, deixando o ZAP registrar tudo, e depois rodar o scan sobre o que foi capturado.

**Passo 1 — Manual Explore**
```
Quick Start → Manual Explore → informar http://localhost:3000 → Launch Browser
```
O ZAP abrirá um navegador já configurado com o proxy.

**Passo 2 — Navegue por todas as páginas**

Acesse manualmente cada rota da sua aplicação:
- Faça login
- Clique em cada menu, página, botão
- Abra listagens, formulários, detalhes
- Quanto mais páginas visitar, mais o ZAP aprende

**Passo 3 — Ative o AJAX Spider**

Após navegar, no ZAP:
```
Analisar → AJAX Spider → URL: http://localhost:3000 → Start Scan
```
O AJAX Spider usa um navegador real para rastrear SPAs, seguindo links gerados por JavaScript.

**Passo 4 — Rode o Active Scan sobre o que foi descoberto**
```
Analisar → Active Scan → http://localhost:3000 → Start Scan
```

---

> **Resumo:** o Automated Scan sozinho não é suficiente para SPAs. A combinação **Manual Explore + AJAX Spider + Active Scan** garante uma cobertura muito maior de aplicações com Next.js.

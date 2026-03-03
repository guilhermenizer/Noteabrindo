# Noteabrindo

Landing page com animação de introdução 3D de um MacBook minimalista abrindo, servindo como tela de carregamento antes de exibir o site principal.

---

## Descrição

Ao abrir o site, o visitante vê uma animação de ~3 segundos:

1. Um MacBook cinza metálico aparece em perspectiva 3/4 sobre fundo escuro.
2. A tampa abre suavemente, revelando a tela iluminada.
3. A câmera dá zoom para dentro da tela enquanto partículas de poeira e o feixe de luz desvanecem.
4. O site real (iframe) é exibido em tela cheia.

O modelo 3D é criado 100% programaticamente com **Three.js** (sem arquivos `.glb` externos).

---

## Como trocar a URL do site real

Abra o arquivo **`index.html`** e localize o atributo `src` do `<iframe>`:

```html
<!-- Troque a URL abaixo pelo endereço do seu site -->
<iframe
  id="site-iframe"
  src="https://example.com"   <!-- ← TROQUE AQUI -->
  ...
```

Substitua `https://example.com` pela URL do seu site e salve o arquivo.

---

## Estrutura dos arquivos

```
├── index.html          ← Página principal
├── css/
│   └── style.css       ← Estilos, animações CSS e responsividade
├── js/
│   ├── main.js         ← Orquestrador: Three.js, cena, câmera, loop
│   ├── notebook.js     ← Modelo 3D do MacBook (geometria Three.js)
│   ├── particles.js    ← Partículas de poeira + feixe de luz
│   └── animation.js    ← Timeline da animação + transição para o iframe
└── README.md
```

---

## Deploy na Hostinger

### Via File Manager (painel de controle)

1. Acesse o **hPanel** da Hostinger e vá em **Arquivos → Gerenciador de Arquivos**.
2. Navegue até a pasta raiz do seu domínio (geralmente `public_html`).
3. Faça upload de todos os arquivos mantendo a estrutura de pastas:
   - `index.html`
   - `css/style.css`
   - `js/main.js`, `js/notebook.js`, `js/particles.js`, `js/animation.js`
4. Acesse seu domínio no navegador — a animação deve iniciar automaticamente.

### Via FTP (FileZilla ou similar)

1. No hPanel, vá em **Hospedagem → FTP** para obter as credenciais.
2. Conecte com FileZilla (host, usuário, senha, porta 21).
3. Transfira os arquivos para `public_html`, mantendo a estrutura de pastas.

---

## Requisitos

- Navegador moderno com suporte a **WebGL** (Chrome, Firefox, Edge, Safari ≥ 15).
- Conexão à internet para carregar o Three.js via CDN.
- Não requer servidor local, build ou npm — basta abrir `index.html`.

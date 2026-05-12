## Objetivo

Na tela de cada dia (`/day/$dayNumber`), trocar o player de vídeo principal por uma experiência de áudio-guiado:
- Vídeo ambiente em **loop, mudo, autoplay**, ocupando o card como background.
- Sobreposto: um **botão único de play/pause** central, **waveform animada reagindo ao áudio real**, e **controle de velocidade** (1x / 1.5x / 2x).
- O mesmo vídeo de loop é usado em **todos os dias** (asset único).
- Áudio explicativo é **upload manual por dia** (novo campo `audio_url`).

## Mudanças no banco

Migration única adicionando:
- `days.audio_url TEXT NULL` — URL do áudio do módulo (upload via admin, igual ao `video_url` hoje).
- Trigger `sync_day_audio_asset` análogo a `sync_day_video_asset`, para registrar/desvincular o áudio em `media_assets` quando o campo mudar.

Não é necessário criar tabela nova nem mexer em RLS — herda das políticas existentes de `days`.

## Asset do vídeo de fundo

- O usuário enviará 1 arquivo de vídeo curto (loop ambiente).
- Salvo em `src/assets/ambient-loop.mp4` e importado como módulo (mesmo loop em todos os dias, sem campo no banco).

## Mudanças no frontend

### `src/routes/_authenticated.day.$dayNumber.tsx`
Substituir o bloco do player de vídeo atual por um novo componente `AudioModulePlayer` que recebe `audioUrl` e renderiza:
- `<video>` ambiente em loop/muted/autoplay/playsInline cobrindo todo o card (`absolute inset-0 object-cover`), com leve overlay escuro para contraste.
- Camada de conteúdo sobreposta (`relative z-10`) contendo:
  - **Botão central play/pause** (círculo grande, ícone Play/Pause de `lucide-react`).
  - **Waveform reativa** abaixo do botão.
  - **Pílula de velocidade** (1x / 1.5x / 2x) que cicla ao clicar e ajusta `audio.playbackRate`.
- Estado vazio: se `audio_url` for nulo, mostrar texto "Áudio em breve" sobre o loop.

### Novo componente `src/components/AudioModulePlayer.tsx`
- `<audio>` controlado por ref.
- Web Audio API: `AudioContext` + `MediaElementAudioSourceNode` + `AnalyserNode` (fftSize 64) para extrair `getByteFrequencyData` em tempo real.
- 24 barras renderizadas em SVG/divs, altura proporcional ao bin de frequência, animadas via `requestAnimationFrame`.
- Quando pausado: barras voltam suavemente a uma altura mínima animada (respiração).
- Cleanup de RAF e disconnect de nodes no unmount.

### Admin
- Adicionar campo "URL do áudio" no formulário de edição de dia (mesma UI do `video_url`, com upload pro bucket `videos` reutilizado — ou criar bucket `audios` se preferir; **proposta: reusar `videos`** para não multiplicar buckets/políticas).

## O que NÃO muda

- Tabelas existentes (exceto a nova coluna).
- Fluxo de "completar dia", streak, navegação, exercícios, reflexão, respiração.
- Vídeo do dia (`video_url`) **continua existindo** para os exercícios/movimentos — só o player principal do topo deixa de ser de vídeo.

## Pendências do usuário

1. Enviar o arquivo do vídeo de loop ambiente.
2. Após implementação, subir o `audio_url` de cada dia no admin.

## Fora do escopo

- Geração TTS automática (descartada — upload manual).
- Scrub bar / tempo visível (descartado — só botão + waveform + velocidade).
- Player flutuante persistente entre rotas.

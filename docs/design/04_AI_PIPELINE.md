# AI 파이프라인 상세 설계

> 작성일: 2026-06-17

---

## 1. 전체 흐름

```
[브라우저]
마이크 ON
    ↓ Web Audio API AnalyserNode
    → Waveform 시각화 (실시간)
    ↓ @ricky0123/vad-web
    → 발화 구간 감지 (1.5초 무음 threshold, 최소 200ms)
    ↓ 답변완료 버튼 클릭
    → MediaRecorder blob (webm)

[백엔드] POST /api/v1/stt
    → Whisper-1 API
    → transcript 반환

[브라우저]
transcript == '' → 무시, 재시도 안내
transcript 유효 → 메시지 버블 표시

[백엔드] POST /api/v1/chat  (SSE)
    → 최근 20턴 슬라이딩 윈도우 컨텍스트
    → gpt-4o 스트리밍
    → delta 이벤트마다 프론트 텍스트 버블 업데이트
    → sentence 이벤트마다 TTS 요청 큐에 추가

[백엔드] POST /api/v1/tts (문장 단위)
    → tts-1, nova, speed=0.95
    → audio/mpeg binary 반환

[브라우저]
    → TTS 큐에 audio 추가
    → 순차 재생 (중복 방지)
    → AI/유저 버블마다 재생 버튼 표시
```

---

## 2. VAD 설정 상세

```typescript
import { MicVAD } from '@ricky0123/vad-web'

const vad = await MicVAD.new({
  positiveSpeechThreshold: 0.8,
  negativeSpeechThreshold: 0.8,
  minSpeechFrames: 3,         // 최소 발화 프레임 (약 200ms)
  redemptionFrames: 8,         // 무음 판정까지 프레임 수 (약 1.5초)
  onSpeechStart: () => {
    setIsRecording(true)
  },
  onSpeechEnd: (audio: Float32Array) => {
    // 답변완료 버튼 클릭 시에만 업로드
    // vad.onSpeechEnd는 blob을 내부에 보관하고 버튼 클릭 이벤트에서 전송
    pendingAudioRef.current = audio
  },
  onVADMisfire: () => {
    // 너무 짧은 소리 (noise) — 무시
  }
})
```

**답변완료 버튼 클릭 핸들러:**
```typescript
async function handleSubmit() {
  if (!pendingAudioRef.current) return
  const blob = float32ToWebmBlob(pendingAudioRef.current)
  pendingAudioRef.current = null
  await uploadSpeechBlob(blob)
}
```

**마이크 자동 OFF (3분):**
```typescript
const inactivityTimer = useRef<ReturnType<typeof setTimeout>>(null)

function resetInactivityTimer() {
  clearTimeout(inactivityTimer.current!)
  inactivityTimer.current = setTimeout(() => {
    vad.pause()
    setIsRecording(false)
    showToast('마이크가 자동으로 꺼졌습니다.')
  }, 3 * 60 * 1000)
}
```

---

## 3. Waveform 시각화

```typescript
// AnalyserNode 설정
const audioContext = new AudioContext()
const analyser = audioContext.createAnalyser()
analyser.fftSize = 256

const source = audioContext.createMediaStreamSource(stream)
source.connect(analyser)

// 애니메이션 루프
function draw() {
  requestAnimationFrame(draw)
  const dataArray = new Uint8Array(analyser.frequencyBinCount)
  analyser.getByteTimeDomainData(dataArray)
  // canvas에 파형 그리기
  drawWaveform(canvas, dataArray)
}
draw()
```

---

## 4. STT 서비스

```ruby
# app/services/ai/transcription_service.rb
module Ai
  class TranscriptionService
    def initialize(audio_file:)
      @audio_file = audio_file
    end

    def call
      client = OpenAI::Client.new(api_key: AppConfig.openai_api_key)
      response = client.audio.transcriptions.create(
        model: 'whisper-1',
        file: @audio_file,
        response_format: 'verbose_json'
      )
      {
        transcript: response['text'].to_s.strip,
        duration_ms: ((response['duration'] || 0) * 1000).to_i
      }
    end
  end
end
```

---

## 5. Chat 스트리밍 서비스 (SSE)

```ruby
# app/controllers/api/v1/chat_streams_controller.rb
module Api
  module V1
    class ChatStreamsController < ApplicationController
      include ActionController::Live

      def create
        response.headers['Content-Type']  = 'text/event-stream'
        response.headers['Cache-Control'] = 'no-cache'
        response.headers['X-Accel-Buffering'] = 'no'

        conversation = Conversation.find(params[:conversation_id])
        messages     = build_context(conversation)

        Ai::ChatStreamService.new(
          messages: messages,
          stream:   response.stream
        ).call

      rescue => e
        response.stream.write("data: #{JSON.generate({ type: 'error', message: e.message })}\n\n")
      ensure
        response.stream.close
      end

      private

      def build_context(conversation)
        # 최근 20턴 슬라이딩 윈도우
        recent = conversation.messages.order(created_at: :desc).limit(20).reverse
        recent.map { |m| { role: m.role, content: m.content } }
      end
    end
  end
end
```

```ruby
# app/services/ai/chat_stream_service.rb
module Ai
  class ChatStreamService
    SYSTEM_PROMPT = <<~PROMPT.freeze
      You are a friendly and encouraging English conversation tutor.
      Help the user practice their English naturally.
      If the user writes in a language other than English, respond with:
      "Please speak in English. Let's practice together!"
      Keep responses concise and conversational.
    PROMPT

    MAX_TOKENS = 1000

    def initialize(messages:, stream:)
      @messages = messages
      @stream   = stream
    end

    def call
      client = OpenAI::Client.new(api_key: AppConfig.openai_api_key)
      sentence_buffer = ''

      client.chat(
        parameters: {
          model: 'gpt-4o',
          messages: [{ role: 'system', content: SYSTEM_PROMPT }] + @messages,
          max_tokens: MAX_TOKENS,
          stream: proc do |chunk, _bytesize|
            delta = chunk.dig('choices', 0, 'delta', 'content').to_s
            next if delta.empty?

            @stream.write("data: #{JSON.generate({ type: 'delta', content: delta })}\n\n")
            sentence_buffer += delta

            # 문장 완성 감지 (마침표/물음표/느낌표)
            if sentence_buffer.match?(/[.?!]\s*$/)
              sentence = sentence_buffer.strip
              @stream.write("data: #{JSON.generate({ type: 'sentence', content: sentence })}\n\n")
              sentence_buffer = ''
            end
          end
        }
      )

      # 남은 버퍼 처리
      if sentence_buffer.strip.present?
        @stream.write("data: #{JSON.generate({ type: 'sentence', content: sentence_buffer.strip })}\n\n")
      end

      @stream.write("data: #{JSON.generate({ type: 'done' })}\n\n")
    end
  end
end
```

---

## 6. TTS 서비스

```ruby
# app/services/ai/tts_service.rb
module Ai
  class TtsService
    VOICE = 'nova'
    SPEED = 0.95

    def initialize(text:)
      @text = text
    end

    def call
      client = OpenAI::Client.new(api_key: AppConfig.openai_api_key)
      response = client.audio.speech(
        parameters: {
          model: 'tts-1',
          input: @text,
          voice: VOICE,
          speed: SPEED,
          response_format: 'mp3'
        }
      )
      response.body  # binary audio data
    end
  end
end
```

---

## 7. TTS 큐 (프론트엔드)

```typescript
// features/tutor/hooks/useTtsQueue.ts
const ttsQueue = useRef<string[]>([])
const isPlaying = useRef(false)

async function enqueueTts(text: string) {
  ttsQueue.current.push(text)
  if (!isPlaying.current) {
    await playNext()
  }
}

async function playNext() {
  if (ttsQueue.current.length === 0) {
    isPlaying.current = false
    return
  }

  isPlaying.current = true
  const text = ttsQueue.current.shift()!

  let attempts = 0
  while (attempts < 3) {
    try {
      const blob = await fetchTts(text)
      await playAudioBlob(blob)
      break
    } catch {
      attempts++
      if (attempts === 3) {
        showToast('음성 재생에 실패했습니다.')
      }
    }
  }

  await playNext()
}
```

---

## 8. Rate Limit 설정

```ruby
# config/initializers/rack_attack.rb
Rack::Attack.throttle('ai/stt/user', limit: 10, period: 60) do |request|
  request.env['current_user_id'] if request.path.start_with?('/api/v1/stt')
end

Rack::Attack.throttle('ai/chat/user', limit: 10, period: 60) do |request|
  request.env['current_user_id'] if request.path.start_with?('/api/v1/chat')
end

Rack::Attack.throttle('ai/tts/user', limit: 20, period: 60) do |request|
  request.env['current_user_id'] if request.path.start_with?('/api/v1/tts')
end

Rack::Attack.throttled_responder = lambda do |_request|
  [429, { 'Content-Type' => 'application/json' }, [JSON.generate({ error: 'Rate limit exceeded', code: 'rate_limit_exceeded' })]]
end
```

---

## 9. 재시도 정책

| 대상 | 재시도 횟수 | Backoff |
|---|---|---|
| OpenAI API (STT/Chat/TTS) | 3회 | exponential (1s, 2s, 4s) |
| SSE 재연결 | 3회 | 1초 간격 |
| TTS 큐 단일 항목 | 3회 | 즉시 |

```ruby
# Ruby 재시도 헬퍼 (retryable gem 사용)
Retryable.retryable(tries: 3, on: StandardError, sleep: ->(attempt) { 2**attempt }) do
  ai_client.call
end
```

---

## 10. 오디오 포맷 처리

| 단계 | 포맷 | 비고 |
|---|---|---|
| VAD → STT | webm | MediaRecorder 기본 출력 |
| TTS → 재생 | mp3 (audio/mpeg) | OpenAI tts-1 출력 |
| 유저 발화 재생 버튼 | webm | 버블에 blob URL 저장 |

import os
import io
import re
from google.cloud import speech_v1p1beta1 as speech
from pydub import AudioSegment

# Caminho da sua key
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = r"C:\Users\DEV3A-01\Desktop\ConectaLibras\testetts-477513-4540fa7e9b62.json"

PASTA = "audios"
cliente = speech.SpeechClient()

def converter_para_wav(caminho):
    audio = AudioSegment.from_file(caminho)
    audio = audio.set_frame_rate(16000)
    audio = audio.set_channels(1)
    audio = audio.set_sample_width(2)
    novo = caminho.rsplit(".", 1)[0] + ".wav"
    audio.export(novo, format="wav")
    return novo

def normalize_text_for_matching(s: str):
    # remove pontuação, múltiplos espaços e deixa lower para matching robusto
    s = re.sub(r"[^\w\s]", "", s, flags=re.UNICODE)  # remove pontuação
    s = re.sub(r"\s+", " ", s, flags=re.UNICODE).strip()
    return s.lower()

def build_normalized_map(original: str):
    """
    Cria mapeamento de índices do texto normalizado (sem pontuação) para índices no texto original.
    Retorna: normalized_str, list_original_index_where_each_normalized_char_came_from
    """
    orig = original
    normalized_chars = []
    orig_indices = []
    for i, ch in enumerate(orig):
        if re.match(r"[A-Za-zÀ-ú0-9\s]", ch):
            normalized_chars.append(ch.lower())
            orig_indices.append(i)
        # ignore all other chars (punctuation) for normalized mapping
    normalized = "".join(normalized_chars)
    # compact multiple spaces
    normalized = re.sub(r"\s+", " ", normalized)
    # NOTE: orig_indices no longer 1:1 after compressing spaces; we'll use token-level matching below
    return normalized

def transcrever_e_alinhar(audio_wav, min_speakers=2, max_speakers=2, timeout_seconds=300):
    with io.open(audio_wav, "rb") as f:
        conteudo = f.read()

    audio = speech.RecognitionAudio(content=conteudo)
    diarization_config = speech.SpeakerDiarizationConfig(
        enable_speaker_diarization=True,
        min_speaker_count=min_speakers,
        max_speaker_count=max_speakers,
    )
    config = speech.RecognitionConfig(
        encoding=speech.RecognitionConfig.AudioEncoding.LINEAR16,
        language_code="pt-BR",
        sample_rate_hertz=16000,
        enable_word_time_offsets=True,
        enable_automatic_punctuation=True,
        diarization_config=diarization_config,
    )

    operation = cliente.long_running_recognize(config=config, audio=audio)
    print("⏳ Aguardando processamento (pode demorar)...")
    response = operation.result(timeout=timeout_seconds)

    # monta transcript completo (concatenando results) — ele geralmente contém pontuação
    transcripts = []
    for result in response.results:
        if result.alternatives:
            transcripts.append(result.alternatives[0].transcript)
    full_transcript = " ".join(transcripts).strip()
    if not full_transcript:
        full_transcript = ""

    # coleta todas as words com seus speaker_tags (mantém ordem temporal)
    word_infos = []
    for result in response.results:
        if not result.alternatives:
            continue
        alt = result.alternatives[0]
        for w in getattr(alt, "words", []):
            start = w.start_time.total_seconds() if w.start_time else None
            end = w.end_time.total_seconds() if w.end_time else None
            word_infos.append({
                "word": w.word,
                "start": start,
                "end": end,
                "speaker": w.speaker_tag
            })

    if not word_infos:
        return "(nenhuma palavra detectada)"

    # Agrupa por turnos (troca de speaker_tag mantém ordem cronológica)
    turnos = []
    current_speaker = word_infos[0]["speaker"]
    buffer_words = []
    for w in word_infos:
        if w["speaker"] != current_speaker:
            turnos.append({"speaker": current_speaker, "words": buffer_words[:]})
            buffer_words = []
            current_speaker = w["speaker"]
        buffer_words.append(w["word"])
    if buffer_words:
        turnos.append({"speaker": current_speaker, "words": buffer_words[:]})

    # Tenta alinhar cada turno no full_transcript para recuperar pontuação
    normalized_full = normalize_text_for_matching(full_transcript)
    # tokens do full_transcript normalizado
    full_tokens = normalized_full.split() if normalized_full else []

    resultado_final = ""
    pos_token = 0  # cursor nos tokens do transcript para busca incremental

    for turno in turnos:
        segmento_raw = " ".join(turno["words"])
        normalized_segment = normalize_text_for_matching(segmento_raw)
        segment_tokens = normalized_segment.split() if normalized_segment else []

        matched_substring = None

        # busca por correspondência sequencial de tokens no normalized_full começando em pos_token
        if segment_tokens:
            # tenta expandir j desde pos_token até encontrar correspondência token a token
            n = len(full_tokens)
            found = False
            for start in range(pos_token, n):
                # se o primeiro token não bate, continue
                if full_tokens[start] != segment_tokens[0]:
                    continue
                # tenta comparar sequência
                end = start + len(segment_tokens)
                if end <= n and full_tokens[start:end] == segment_tokens:
                    # reconstruir substring com pontuação a partir do full_transcript original:
                    # aproximamos pegando os índices de caractere de start..end token na normalized_full.
                    # Simples: usamos busca por substring não-normalizada:
                    # procuramos a primeira ocorrência do segmento_raw (ou versão reduzida) no full_transcript, partindo de um índice aproximado.
                    # Construir uma regex segura para localizar (palavras com possíveis espaços/pontuação entre elas)
                    pattern = r"\b" + r"\W+".join(re.escape(t) for t in turno["words"]) + r"\b"
                    match = re.search(pattern, full_transcript, flags=re.IGNORECASE)
                    if match:
                        matched_substring = match.group(0)
                    else:
                        # fallback: juntar tokens próximos no full_transcript original por índices de token
                        # para simplicidade, pegamos uma fatia de caracteres aproximada: procurar ocorrência da primeira palavra próxima ao start token
                        first_token = segment_tokens[0]
                        # localizar first_token na versão pleine do full_transcript (case-insensitive)
                        m2 = re.search(re.escape(turno["words"][0]), full_transcript, flags=re.IGNORECASE)
                        if m2:
                            # pegar uma janela de caracteres a partir de m2.start() com comprimento aproximado
                            approx_len = max(20, len(segmento_raw) + 30)
                            slice_start = max(0, m2.start()-10)
                            matched_substring = full_transcript[slice_start: slice_start + approx_len].strip()
                    pos_token = end  # avança cursor para evitar rematches atrás
                    found = True
                    break
            if not found:
                # não conseguiu mapear no transcript — usamos o texto montado pelas words (sem pontuação)
                matched_substring = segmento_raw

        else:
            matched_substring = segmento_raw

        # limpeza simples: tirar espaços duplicados e consertar espaço antes de pontuação
        def clean_text(t):
            t = re.sub(r"\s+", " ", t)
            t = re.sub(r"\s+([.,;:!?])", r"\1", t)
            return t.strip()

        resultado_final += f"\n\n👤 Pessoa {turno['speaker']}:\n{clean_text(matched_substring)}\n"

    return resultado_final

if __name__ == "__main__":
    for arquivo in os.listdir(PASTA):
        if arquivo.lower().endswith((".wav", ".mp3", ".m4a", ".flac")):
            caminho = os.path.join(PASTA, arquivo)
            print(f"\n🎙 Preparando: {arquivo} ...")
            wav = converter_para_wav(caminho)
            print(f"🎧 Transcrevendo: {os.path.basename(wav)} ...")
            texto = transcrever_e_alinhar(wav)
            print("\n======= RESULTADO =======")
            print(texto)
            print("=========================\n")

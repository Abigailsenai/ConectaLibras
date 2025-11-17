import speech_recognition as sr
import os

# Caminho da pasta com os áudios
PASTA_AUDIO = "audios"

# Nome do arquivo de áudio (exemplo: "teste.wav")
ARQUIVO = "teste.wav"  # troque conforme seu arquivo

# Caminho completo
caminho_audio = os.path.join(PASTA_AUDIO, ARQUIVO)

# Verifica se o arquivo existe
if not os.path.exists(caminho_audio):
    print(f"❌ Arquivo não encontrado: {caminho_audio}")
    exit()

# Cria o reconhecedor
r = sr.Recognizer()

# Abre o áudio e converte para texto
with sr.AudioFile(caminho_audio) as source:
    print("🎧 Carregando o áudio...")
    audio = r.record(source)

print("🗣️ Transcrevendo com Google Speech Recognition...")
try:
    texto = r.recognize_google(audio, language="pt-BR")
    print("\n✅ Transcrição completa:\n")
    print(texto)

    # (Opcional) salvar em arquivo .txt
    saida = os.path.splitext(ARQUIVO)[0] + ".txt"
    caminho_saida = os.path.join(PASTA_AUDIO, saida)
    with open(caminho_saida, "w", encoding="utf-8") as f:
        f.write(texto)
    print(f"\n💾 Transcrição salva em: {caminho_saida}")

except sr.UnknownValueError:
    print("⚠️ O Google não conseguiu entender o áudio.")
except sr.RequestError as e:
    print(f"❌ Erro ao conectar com o serviço do Google: {e}")

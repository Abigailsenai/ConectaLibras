import os
from google.cloud.speech_v2 import SpeechClient
from google.cloud.speech_v2.types import cloud_speech
from google.api_core.client_options import ClientOptions

# Configurar as credenciais antes de qualquer outra coisa
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = r"C:\Users\DEV3A-01\Desktop\ConectaLibras\testetts-477513-4540fa7e9b62.json"

def transcribe_with_diarization(audio_file_path, project_id):
    """
    Transcreve áudio usando Speech-to-Text v2 com Chirp 3 e diarização
    
    Args:
        audio_file_path: Caminho para o arquivo de áudio
        project_id: ID do seu projeto Google Cloud
    """
    
    # Região mais próxima de São Paulo (use "us" para melhor suporte)
    # Opções: "us", "europe-west4", "asia-southeast1"
    REGION = "us"
    
    # Configura o cliente para a região específica
    client_options = ClientOptions(
        api_endpoint=f"{REGION}-speech.googleapis.com"
    )
    client = SpeechClient(client_options=client_options)
    
    # Lê o arquivo de áudio
    with open(audio_file_path, "rb") as audio_file:
        audio_content = audio_file.read()
    
    print(f"Usando região: {REGION}")
    print(f"Tamanho do áudio: {len(audio_content) / 1024 / 1024:.2f} MB\n")
    
    # Configuração da diarização
    diarization_config = cloud_speech.SpeakerDiarizationConfig(
        min_speaker_count=2,
        max_speaker_count=5,
    )
    
    # Configuração do reconhecimento com Chirp 3
    config = cloud_speech.RecognitionConfig(
        auto_decoding_config=cloud_speech.AutoDetectDecodingConfig(),
        language_codes=["pt-BR"],
        model="chirp_3",  # Modelo mais recente
        features=cloud_speech.RecognitionFeatures(
            enable_automatic_punctuation=True,
            enable_word_time_offsets=True,
            diarization_config=diarization_config,
        ),
    )
    
    # Cria a requisição usando o recognizer padrão (_)
    # Não precisa criar recognizer customizado para Chirp 3
    request = cloud_speech.RecognizeRequest(
        recognizer=f"projects/{project_id}/locations/{REGION}/recognizers/_",
        config=config,
        content=audio_content,
    )
    
    # Faz a transcrição
    print("Processando transcrição com Chirp 3 e diarização...")
    response = client.recognize(request=request)
    
    # Processa os resultados
    print("\n" + "="*80)
    print("RESULTADOS DA TRANSCRIÇÃO COM CHIRP 3 E DIARIZAÇÃO")
    print("="*80 + "\n")
    
    if not response.results:
        print("⚠️  Nenhum resultado retornado. Verifique o formato do áudio.")
        return response
    
    for result in response.results:
        alternative = result.alternatives[0]
        
        print(f"Transcrição completa: {alternative.transcript}")
        print(f"Confiança: {alternative.confidence:.2%}\n")
        
        # Verifica se há palavras com diarização
        if not alternative.words:
            print("⚠️  Nenhuma informação de palavra disponível")
            continue
        
        # Mostra informações de diarização palavra por palavra
        print("Diarização detalhada:")
        print("-" * 80)
        
        for word_info in alternative.words:
            word = word_info.word
            speaker_tag = getattr(word_info, 'speaker_label', 'N/A')
            start_time = word_info.start_offset.total_seconds()
            end_time = word_info.end_offset.total_seconds()
            
            print(f"Locutor {speaker_tag}: {word:20s} [{start_time:.2f}s - {end_time:.2f}s]")
        
        print("\n")
        
        # Agrupa por locutor para facilitar leitura
        print("Transcrição agrupada por locutor:")
        print("-" * 80)
        
        current_speaker = None
        current_text = []
        
        for word_info in alternative.words:
            speaker = getattr(word_info, 'speaker_label', None)
            
            if current_speaker != speaker:
                if current_speaker is not None:
                    print(f"\nLocutor {current_speaker}: {' '.join(current_text)}")
                
                current_speaker = speaker
                current_text = [word_info.word]
            else:
                current_text.append(word_info.word)
        
        if current_speaker is not None:
            print(f"\nLocutor {current_speaker}: {' '.join(current_text)}")
    
    print("\n" + "="*80)
    
    return response


def limpar_recognizers_antigos(project_id):
    """
    Remove recognizers antigos que podem estar causando conflito
    """
    REGION = "global"
    
    client = SpeechClient()
    
    print("Limpando recognizers antigos...")
    for old_recognizer in ["my-recognizer", "my-recognizer-v2", "my-recognizer-diarization"]:
        try:
            recognizer_path = f"projects/{project_id}/locations/{REGION}/recognizers/{old_recognizer}"
            operation = client.delete_recognizer(name=recognizer_path)
            operation.result(timeout=120)
            print(f"✓ Recognizer '{old_recognizer}' deletado")
        except Exception as e:
            print(f"  '{old_recognizer}' não encontrado ou já deletado")
    
    print()


# Exemplo de uso com arquivo local
if __name__ == "__main__":
    PROJECT_ID = "testetts-477513"
    AUDIO_FILE = "audios/audio1.wav"
    
    print("="*80)
    print("TRANSCRIÇÃO COM CHIRP 3 E DIARIZAÇÃO")
    print("Speech-to-Text v2 - Modelo mais recente")
    print("="*80 + "\n")
    
    # OPCIONAL: Limpar recognizers antigos (execute uma vez se necessário)
    # limpar_recognizers_antigos(PROJECT_ID)
    
    # Faz a transcrição
    try:
        response = transcribe_with_diarization(
            audio_file_path=AUDIO_FILE,
            project_id=PROJECT_ID
        )
        print("\n✅ Transcrição concluída com sucesso!")
        
    except Exception as e:
        print(f"\n❌ Erro durante a transcrição: {e}")
        print("\nDicas de troubleshooting:")
        print("1. Verifique se o arquivo de áudio existe no caminho especificado")
        print("2. Certifique-se de que o áudio está em formato suportado (WAV, MP3, FLAC)")
        print("3. Para áudios muito longos (>60s), considere usar batch recognition")
        print("4. Verifique se a API Speech-to-Text v2 está habilitada no seu projeto")
        
        import traceback
        print("\nDetalhes do erro:")
        traceback.print_exc()
import os
import wave
import subprocess
import firebase_admin
from firebase_admin import credentials, firestore
from google.cloud.speech_v2 import SpeechClient
from google.cloud.speech_v2.types import cloud_speech
from google.api_core.client_options import ClientOptions

# ============================================
# CONFIGURAÇÕES
# ============================================
# Credenciais Google Cloud Speech API
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = r"C:\Users\DEV3A-01\Desktop\ConectaLibras\testetts-477513-068a4b222175.json"

PROJECT_ID = "testetts-477513"
REGION = "us"
AUDIO_FOLDER = r"C:\Users\DEV3A-01\Desktop\ConectaLibras\audios"
AUDIO_FILENAME = "audio1.wav"

# USAR CREDENCIAIS DIFERENTES PARA FIREBASE
FIREBASE_CREDENTIALS = r"C:\Users\DEV3A-01\Desktop\ConectaLibras\conectabd-b58eb-firebase-adminsdk-fbsvc-4d168fce36.json"  # ← NOVO ARQUIVO
FIREBASE_PROJECT_ID = "conectabd-b58eb"  # ← PROJETO FIREBASE
COLLECTION_NAME = "textoTranscricao"
DOCUMENT_ID = "653cgeO9NsObnNftR5vk"
FIELD_NAME = "texto"


# ============================================
# INICIALIZAÇÃO FIREBASE
# ============================================
def initialize_firebase():
    """Inicializa o Firebase Admin SDK"""
    try:
        if not firebase_admin._apps:
            cred = credentials.Certificate(FIREBASE_CREDENTIALS)
            
            firebase_admin.initialize_app(cred, {
                'projectId': FIREBASE_PROJECT_ID,  # ← Usar projeto Firebase
            })
            print("✅ Firebase inicializado com sucesso!")
        return firestore.client()
    except Exception as e:
        print(f"❌ Erro ao inicializar Firebase: {e}")
        raise


# ============================================
# CONVERSÃO E VALIDAÇÃO
# ============================================
def convert_to_wav(input_path, output_path):
    """Converte áudio para WAV 16kHz mono usando ffmpeg"""
    try:
        print(f"\n🔄 Convertendo áudio...")
        print(f"📥 Entrada: {input_path}")
        print(f"📤 Saída: {output_path}")
        
        command = [
            'ffmpeg',
            '-y',
            '-i', input_path,
            '-acodec', 'pcm_s16le',
            '-ar', '16000',
            '-ac', '1',
            output_path
        ]
        
        result = subprocess.run(
            command,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        
        if result.returncode != 0:
            print(f"❌ FFmpeg erro: {result.stderr}")
            return False, f"Erro na conversão: {result.stderr[:200]}"
        
        print("✅ Conversão OK!")
        return True, None
        
    except FileNotFoundError:
        print("❌ FFmpeg não encontrado!")
        return False, "FFmpeg não instalado. Instale: choco install ffmpeg"
    except Exception as e:
        print(f"❌ Erro: {str(e)}")
        return False, f"Erro: {str(e)}"


def validate_audio(audio_path):
    """Valida formato WAV"""
    try:
        print("\n🔍 Validando áudio...")
        with wave.open(audio_path, 'rb') as wf:
            channels = wf.getnchannels()
            sample_width = wf.getsampwidth()
            framerate = wf.getframerate()
            nframes = wf.getnframes()
            duration = nframes / framerate
            
            print(f"📊 Canais: {channels}")
            print(f"📊 Sample Rate: {framerate} Hz")
            print(f"📊 Bits: {sample_width * 8}")
            print(f"📊 Duração: {duration:.2f}s")
            
            if duration < 0.5:
                print("⚠️ Áudio muito curto")
                return False, "Áudio muito curto (< 0.5s)"
            
            if channels > 2:
                print("⚠️ Muitos canais")
                return False, "Áudio com muitos canais"
            
            if framerate < 8000:
                print("⚠️ Sample rate baixo")
                return False, "Qualidade muito baixa"
            
            print("✅ Áudio válido!")
            return True, None
    
    except Exception as e:
        print(f"⚠️ Erro ao validar: {str(e)}")
        return False, str(e)


# ============================================
# TRANSCRIÇÃO
# ============================================
def transcribe_with_diarization(audio_file_path):
    """Transcreve áudio com diarização e retorna o texto"""
    
    print("\n" + "="*60)
    print("🎙️ INICIANDO TRANSCRIÇÃO")
    print("="*60)
    print(f"📁 Arquivo: {audio_file_path}")
    
    # Valida áudio
    is_valid, error_msg = validate_audio(audio_file_path)
    
    if not is_valid:
        print(f"⚠️ Convertendo: {error_msg}")
        
        converted_path = audio_file_path.replace(".wav", "_converted.wav")
        success, conv_error = convert_to_wav(audio_file_path, converted_path)
        
        if not success:
            print(f"❌ Falha: {conv_error}")
            return None, f'Formato inválido. {conv_error}'
        
        audio_file_path = converted_path
        print(f"✅ Usando convertido: {audio_file_path}")
        
        is_valid, error_msg = validate_audio(audio_file_path)
        if not is_valid:
            return None, f'Inválido após conversão: {error_msg}'
    
    # Conecta à API
    client_options = ClientOptions(api_endpoint=f"{REGION}-speech.googleapis.com")
    client = SpeechClient(client_options=client_options)
    
    with open(audio_file_path, "rb") as audio_file:
        audio_content = audio_file.read()
    
    print(f"📊 Tamanho: {len(audio_content)} bytes")
    
    # Configuração com diarização
    config = cloud_speech.RecognitionConfig(
        explicit_decoding_config=cloud_speech.ExplicitDecodingConfig(
            encoding=cloud_speech.ExplicitDecodingConfig.AudioEncoding.LINEAR16,
            sample_rate_hertz=16000,
            audio_channel_count=1,
        ),
        language_codes=["pt-BR"],
        model="chirp_3",
        features=cloud_speech.RecognitionFeatures(
            enable_automatic_punctuation=True,
            enable_word_time_offsets=True,
            diarization_config=cloud_speech.SpeakerDiarizationConfig(
                min_speaker_count=1,
                max_speaker_count=5,
            ),
        ),
    )
    
    request_data = cloud_speech.RecognizeRequest(
        recognizer=f"projects/{PROJECT_ID}/locations/{REGION}/recognizers/_",
        config=config,
        content=audio_content,
    )
    
    print("🔄 Enviando para Google Speech API...")
    response = client.recognize(request=request_data)
    print("✅ Resposta recebida!")
    
    print(f"\n🔍 Resultados: {len(response.results)}")
    
    # Se não tiver resultados, tenta sem diarização
    if len(response.results) == 0:
        print("⚠️ Sem resultados! Tentando sem diarização...")
        
        config_simple = cloud_speech.RecognitionConfig(
            explicit_decoding_config=cloud_speech.ExplicitDecodingConfig(
                encoding=cloud_speech.ExplicitDecodingConfig.AudioEncoding.LINEAR16,
                sample_rate_hertz=16000,
                audio_channel_count=1,
            ),
            language_codes=["pt-BR"],
            model="chirp_3",
            features=cloud_speech.RecognitionFeatures(
                enable_automatic_punctuation=True,
            ),
        )
        
        request_simple = cloud_speech.RecognizeRequest(
            recognizer=f"projects/{PROJECT_ID}/locations/{REGION}/recognizers/_",
            config=config_simple,
            content=audio_content,
        )
        
        response = client.recognize(request=request_simple)
        print(f"✅ Nova tentativa: {len(response.results)} resultado(s)")
        
        if len(response.results) == 0:
            print("❌ Ainda sem resultados")
            error_msg = 'Sem fala detectada no áudio.'
            return None, error_msg
    
    # Processa resultados
    transcription_text = ""
    
    for idx, result in enumerate(response.results):
        print(f"\n📝 Resultado {idx + 1}...")
        alternative = result.alternatives[0]
        
        print(f"💬 Texto: {alternative.transcript}")
        print(f"📊 Confiança: {round(alternative.confidence * 100, 2)}%")
        
        
        has_speaker_info = hasattr(alternative.words[0], 'speaker_label') if alternative.words else False
        
        if has_speaker_info:
            print("👥 Com diarização...")
            
            current_speaker = None
            current_text = []
            
            for word_info in alternative.words:
                speaker = getattr(word_info, 'speaker_label', 'N/A')
                word = word_info.word
                
                if current_speaker != speaker:
                    if current_speaker is not None and current_text:
                        transcription_text += f"[Locutor {current_speaker}]: {' '.join(current_text)}\n\n"
                    
                    current_speaker = speaker
                    current_text = [word]
                else:
                    current_text.append(word)
            
            if current_speaker is not None and current_text:
                transcription_text += f"[Locutor {current_speaker}]: {' '.join(current_text)}\n\n"
        else:
            print("📝 Sem diarização...")
            transcription_text += f"[Transcrição]: {alternative.transcript}\n\n"
    
    print("\n" + "="*60)
    print("✅ TRANSCRIÇÃO CONCLUÍDA!")
    print("="*60 + "\n")
    
    return transcription_text, None


# ============================================
# SALVAR NO FIREBASE
# ============================================
def save_to_firebase(db, transcription_text):
    """Salva transcrição no Firestore"""
    try:
        print("\n📤 Salvando no Firebase...")
        print(f"📁 Coleção: {COLLECTION_NAME}")
        print(f"📄 Documento: {DOCUMENT_ID}")
        print(f"🏷️ Campo: {FIELD_NAME}")
        
        doc_ref = db.collection(COLLECTION_NAME).document(DOCUMENT_ID)
        doc_ref.set({
            FIELD_NAME: transcription_text
        }, merge=True)
        
        print("✅ Transcrição salva no Firebase com sucesso!")
        return True
        
    except Exception as e:
        print(f"❌ Erro ao salvar no Firebase: {e}")
        import traceback
        traceback.print_exc()
        return False


# ============================================
# MAIN
# ============================================
def main():
    """Função principal"""
    print("\n" + "🎯"*30)
    print("PROCESSAMENTO DE ÁUDIO PARA FIREBASE")
    print("🎯"*30 + "\n")
    
    # Caminho do áudio
    audio_path = os.path.join(AUDIO_FOLDER, AUDIO_FILENAME)
    
    # Verifica se arquivo existe
    if not os.path.exists(audio_path):
        print(f"❌ Arquivo não encontrado: {audio_path}")
        return
    
    print(f"✅ Arquivo encontrado: {audio_path}")
    
    # Inicializa Firebase
    try:
        db = initialize_firebase()
    except Exception as e:
        print(f"❌ Falha ao inicializar Firebase: {e}")
        print("\n⚠️ POSSÍVEL SOLUÇÃO:")
        print("1. Verifique se o projeto Firebase está configurado corretamente")
        print("2. Baixe as credenciais corretas do Firebase Console:")
        print("   - Acesse: https://console.firebase.google.com/")
        print("   - Vá em Configurações do Projeto > Contas de Serviço")
        print("   - Clique em 'Gerar nova chave privada'")
        print("3. Substitua o caminho em FIREBASE_CREDENTIALS")
        return
    
    # Transcreve áudio
    transcription_text, error = transcribe_with_diarization(audio_path)
    
    if error:
        print(f"\n❌ Erro na transcrição: {error}")
        return
    
    if not transcription_text:
        print("\n❌ Nenhuma transcrição gerada")
        return
    
    print("\n📄 TRANSCRIÇÃO GERADA:")
    print("-" * 60)
    print(transcription_text)
    print("-" * 60)
    
    # Salva no Firebase
    success = save_to_firebase(db, transcription_text)
    
    if success:
        print("\n" + "🎉"*30)
        print("PROCESSO CONCLUÍDO COM SUCESSO!")
        print("🎉"*30 + "\n")
    else:
        print("\n❌ Falha ao salvar no Firebase")


if __name__ == '__main__':
    # Verifica FFmpeg
    try:
        result = subprocess.run(['ffmpeg', '-version'], 
                              stdout=subprocess.PIPE, 
                              stderr=subprocess.PIPE)
        print("✅ FFmpeg detectado!")
    except FileNotFoundError:
        print("⚠️ FFmpeg NÃO encontrado")
        print("   Instale: choco install ffmpeg")
    
    print("\n")
    
    # Executa processamento
    main()
import os
import wave
import subprocess
import time
import base64
from flask import Flask, request, jsonify
from flask_cors import CORS
from google.cloud.speech_v2 import SpeechClient
from google.cloud.speech_v2.types import cloud_speech
from google.api_core.client_options import ClientOptions

# >>> PATH das credenciais (mantenha o seu path)
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = r"C:\Users\DEV3A-01\Desktop\ConectaLibras\testetts-477513-4540fa7e9b62.json"

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

PROJECT_ID = "testetts-477513"
REGION = "us"
AUDIO_FOLDER = r"C:\Users\DEV3A-01\Desktop\ConectaLibras\audios"
UPLOAD_FOLDER = r"C:\Users\DEV3A-01\Desktop\ConectaLibras\uploads"
AUDIO_FILENAME = "audio2.wav"  # arquivo final WAV usado no processamento
CONVERTED_FILENAME = "audio_converted.wav"
TRANSCRIPTION_FILENAME = "transcricao.txt"
STATUS_FILENAME = "status.txt"

os.makedirs(AUDIO_FOLDER, exist_ok=True)
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


def write_status(message):
    """Escreve status no arquivo"""
    status_path = os.path.join(UPLOAD_FOLDER, STATUS_FILENAME)
    with open(status_path, 'w', encoding='utf-8') as f:
        f.write(message)
    print(f"📝 Status: {message}")


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


def transcribe_with_diarization(audio_file_path):
    """Transcreve áudio e salva em TXT"""
    
    print("\n" + "="*60)
    print("🎙️ INICIANDO TRANSCRIÇÃO")
    print("="*60)
    print(f"📁 Arquivo: {audio_file_path}")
    
    write_status("Validando áudio...")
    
    is_valid, error_msg = validate_audio(audio_file_path)
    
    if not is_valid:
        print(f"⚠️ Convertendo: {error_msg}")
        write_status("Convertendo áudio...")
        
        converted_path = os.path.join(AUDIO_FOLDER, CONVERTED_FILENAME)
        success, conv_error = convert_to_wav(audio_file_path, converted_path)
        
        if not success:
            print(f"❌ Falha: {conv_error}")
            write_status(f"ERRO: {conv_error}")
            return False, f'Formato inválido. {conv_error}'
        
        audio_file_path = converted_path
        print(f"✅ Usando convertido: {audio_file_path}")
        
        is_valid, error_msg = validate_audio(audio_file_path)
        if not is_valid:
            write_status(f"ERRO: {error_msg}")
            return False, f'Inválido após conversão: {error_msg}'
    
    write_status("Conectando à API...")
    
    client_options = ClientOptions(api_endpoint=f"{REGION}-speech.googleapis.com")
    client = SpeechClient(client_options=client_options)
    
    with open(audio_file_path, "rb") as audio_file:
        audio_content = audio_file.read()
    
    print(f"📊 Tamanho: {len(audio_content)} bytes")
    
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
    
    write_status("Transcrevendo...")
    print("🔄 Enviando para Google...")
    response = client.recognize(request=request_data)
    print("✅ Resposta recebida!")
    
    print(f"\n🔍 Resultados: {len(response.results)}")
    
    if len(response.results) == 0:
        print("⚠️ Sem resultados!")
        print("\n🔄 Tentando sem diarização...")
        write_status("Tentando modo simples...")
        
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
            error_msg = 'Sem fala detectada. Verifique:\n• Microfone funcionando\n• Fala clara\n• Mínimo 1 segundo\n• Pouco ruído'
            write_status(f"ERRO: {error_msg}")
            return False, error_msg
    
    write_status("Processando resultados...")
    
    transcription_text = ""
    
    for idx, result in enumerate(response.results):
        print(f"\n📝 Resultado {idx + 1}...")
        alternative = result.alternatives[0]
        
        print(f"💬 Texto: {alternative.transcript}")
        print(f"📊 Confiança: {round(alternative.confidence * 100, 2)}%")
        
        transcription_text += f"=== RESULTADO {idx + 1} ===\n"
        transcription_text += f"Confiança: {round(alternative.confidence * 100, 2)}%\n\n"
        
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
    
    transcription_path = os.path.join(UPLOAD_FOLDER, TRANSCRIPTION_FILENAME)
    with open(transcription_path, 'w', encoding='utf-8') as f:
        f.write(transcription_text)
    
    print(f"\n💾 Salvo em: {transcription_path}")
    
    write_status("CONCLUÍDO")
    
    print("\n" + "="*60)
    print("✅ TRANSCRIÇÃO CONCLUÍDA!")
    print("="*60 + "\n")
    
    return True, "Transcrição concluída!"


@app.route('/api/process_audio', methods=['POST'])
def process_audio():
    """Recebe áudio multipart/form-data, salva e transcreve (mantido para compatibilidade)"""
    try:
        print("\n" + "🚀"*30)
        print("NOVA REQUISIÇÃO - process_audio")
        print("🚀"*30)
        
        transcription_path = os.path.join(UPLOAD_FOLDER, TRANSCRIPTION_FILENAME)
        status_path = os.path.join(UPLOAD_FOLDER, STATUS_FILENAME)
        
        if os.path.exists(transcription_path):
            os.remove(transcription_path)
        if os.path.exists(status_path):
            os.remove(status_path)
        
        write_status("Recebendo áudio...")
        
        if 'audio' not in request.files:
            print("❌ Nenhum arquivo!")
            write_status("ERRO: Nenhum arquivo enviado")
            return jsonify({
                'success': False,
                'error': 'Nenhum arquivo enviado'
            }), 400
        
        audio_file = request.files['audio']
        print(f"📥 Arquivo: {audio_file.filename}")
        print(f"📋 Type: {audio_file.content_type}")
        
        # ✅ Salva recebido como WAV (ou como enviado)
        filepath = os.path.join(AUDIO_FOLDER, AUDIO_FILENAME)
        audio_file.save(filepath)
        print(f"💾 Salvo como: {filepath}")
        
        file_size = os.path.getsize(filepath)
        print(f"📦 Tamanho: {file_size} bytes")
        
        if file_size < 1000:
            print("❌ Arquivo pequeno!")
            write_status("ERRO: Arquivo muito pequeno")
            return jsonify({
                'success': False,
                'error': 'Arquivo muito pequeno (mínimo 1 segundo)'
            }), 400
        
        print("🔄 Iniciando transcrição...")
        success, message = transcribe_with_diarization(filepath)
        
        if not success:
            return jsonify({
                'success': False,
                'error': message
            }), 400
        
        print(f"\n✅ Processamento OK!")
        print(f"📄 Transcrição: {transcription_path}")
        
        return jsonify({
            'success': True,
            'message': message,
            'file': TRANSCRIPTION_FILENAME
        })
    
    except Exception as e:
        print(f"\n❌ ERRO CRÍTICO: {str(e)}")
        import traceback
        traceback.print_exc()
        
        write_status(f"ERRO: {str(e)}")
        
        return jsonify({
            'success': False,
            'error': f'Erro: {str(e)}'
        }), 500


@app.route('/api/process_audio_b64', methods=['POST'])
def process_audio_b64():
    """
    Novo endpoint: recebe JSON { audio_base64: "<base64>" }
    Decodifica, salva arquivo temporário, converte para WAV e processa normalmente.
    """
    try:
        print("\n" + "~"*30)
        print("NOVA REQUISIÇÃO - process_audio_b64")
        print("~"*30)
        
        transcription_path = os.path.join(UPLOAD_FOLDER, TRANSCRIPTION_FILENAME)
        status_path = os.path.join(UPLOAD_FOLDER, STATUS_FILENAME)
        
        # remove arquivos antigos de status/transcrição
        if os.path.exists(transcription_path):
            os.remove(transcription_path)
        if os.path.exists(status_path):
            os.remove(status_path)
        
        write_status("Recebendo áudio (base64)...")
        
        data = request.get_json()
        if not data or "audio_base64" not in data:
            print("❌ Base64 não enviado!")
            write_status("ERRO: Nenhum base64 enviado")
            return jsonify({'success': False, 'error': 'Base64 não enviado'}), 400
        
        audio_b64 = data["audio_base64"]
        # se veio com prefixo data:audio/...?base64, remover
        if "base64," in audio_b64:
            audio_b64 = audio_b64.split("base64,")[1]
        
        # decodifica para bytes
        try:
            audio_bytes = base64.b64decode(audio_b64)
        except Exception as e:
            print("❌ Falha ao decodificar base64:", e)
            write_status("ERRO: Falha ao decodificar base64")
            return jsonify({'success': False, 'error': 'Falha ao decodificar base64'}), 400
        
        # salva arquivo temporário (extensão do que vier do app; usaremos temp_input.m4a)
        temp_input_path = os.path.join(AUDIO_FOLDER, "temp_input_from_app")
        # tentar extensão provável .m4a; se quiser garantir, o app pode enviar também filename
        temp_input_path_m4a = temp_input_path + ".m4a"
        with open(temp_input_path_m4a, "wb") as f:
            f.write(audio_bytes)
        print("📥 Base64 salvo em:", temp_input_path_m4a)
        
        # converter para WAV final (AUDIO_FILENAME)
        wav_path = os.path.join(AUDIO_FOLDER, AUDIO_FILENAME)
        success, conv_err = convert_to_wav(temp_input_path_m4a, wav_path)
        if not success:
            print("❌ Conversão falhou:", conv_err)
            write_status(f"ERRO: {conv_err}")
            return jsonify({'success': False, 'error': f'Erro conversão: {conv_err}'}), 500
        
        print("🎧 Convertido para WAV:", wav_path)
        
        # verificar tamanho
        file_size = os.path.getsize(wav_path)
        print(f"📦 Tamanho WAV: {file_size} bytes")
        if file_size < 1000:
            print("❌ Arquivo pequeno!")
            write_status("ERRO: Arquivo muito pequeno")
            return jsonify({'success': False, 'error': 'Arquivo muito pequeno (mínimo 1 segundo)'}), 400
        
        # chama transcrição (sua função)
        write_status("Iniciando transcrição...")
        success_proc, message = transcribe_with_diarization(wav_path)
        if not success_proc:
            return jsonify({'success': False, 'error': message}), 400
        
        return jsonify({'success': True, 'message': message, 'file': TRANSCRIPTION_FILENAME})
    
    except Exception as e:
        print("\n❌ ERRO CRÍTICO (B64):", str(e))
        import traceback
        traceback.print_exc()
        write_status(f"ERRO: {str(e)}")
        return jsonify({'success': False, 'error': f'Erro: {str(e)}'}), 500


@app.route('/api/get_transcription', methods=['GET'])
def get_transcription():
    """Retorna transcrição"""
    try:
        transcription_path = os.path.join(UPLOAD_FOLDER, TRANSCRIPTION_FILENAME)
        
        if not os.path.exists(transcription_path):
            return jsonify({
                'success': False,
                'error': 'Transcrição não encontrada'
            }), 404
        
        with open(transcription_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        return jsonify({
            'success': True,
            'transcription': content
        })
    
    except Exception as e:
        print(f"❌ Erro: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Erro: {str(e)}'
        }), 500


@app.route('/api/get_status', methods=['GET'])
def get_status():
    """Retorna status do processamento"""
    try:
        status_path = os.path.join(UPLOAD_FOLDER, STATUS_FILENAME)
        
        if not os.path.exists(status_path):
            return jsonify({
                'success': True,
                'status': 'Aguardando...'
            })
        
        with open(status_path, 'r', encoding='utf-8') as f:
            status = f.read()
        
        return jsonify({
            'success': True,
            'status': status
        })
    
    except Exception as e:
        print(f"❌ Erro: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Erro: {str(e)}'
        }), 500


@app.route('/api/test', methods=['GET'])
def test():
    """Endpoint de teste"""
    return jsonify({
        'success': True,
        'message': 'Servidor Flask funcionando!',
        'audio_folder': AUDIO_FOLDER,
        'upload_folder': UPLOAD_FOLDER
    })


if __name__ == '__main__':
    print("\n" + "🎯"*30)
    print("SERVIDOR FLASK INICIADO")
    print(f"📍 Host: 0.0.0.0:5000")
    print(f"📁 Áudios: {AUDIO_FOLDER}")
    print(f"📁 Uploads: {UPLOAD_FOLDER}")
    
    try:
        result = subprocess.run(['ffmpeg', '-version'], 
                              stdout=subprocess.PIPE, 
                              stderr=subprocess.PIPE)
        print("✅ FFmpeg detectado!")
    except FileNotFoundError:
        print("⚠️ FFmpeg NÃO encontrado")
        print("   Instale: choco install ffmpeg")
    
    print("🎯"*30 + "\n")
    
    # Usar threaded=True para melhor performance
    app.run(debug=True, host='0.0.0.0', port=5000, threaded=True)

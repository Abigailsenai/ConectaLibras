# gravar_serial_wav.py
import serial
import wave
import time
import os
import sys

# ======= CONFIGURAÇÕES (EDITE AQUI) =======
PORT = "COM5"          # <-- troque para sua porta (ou deixe como argumento na execução)
BAUDRATE = 115200
SAMPLE_RATE = 16000
CHANNELS = 1
SAMPLE_WIDTH = 2       # bytes (16 bits)
DURATION = 10          # segundos
OUTPUT_FILE = "audios\\gravacao.wav"
READ_CHUNK = 1024
# ===========================================

def main(port):
    print(f"Conectando a: {port} @ {BAUDRATE} baud")
    try:
        ser = serial.Serial(port, BAUDRATE, timeout=1)
    except Exception as e:
        print("Erro ao abrir porta serial:", e)
        sys.exit(1)

    # Dar tempo para o ESP32 inicializar
    time.sleep(2)
    ser.reset_input_buffer()

    print(f"Iniciando gravação de {DURATION} segundos...")
    frames = bytearray()
    start_time = time.time()
    try:
        while time.time() - start_time < DURATION:
            data = ser.read(READ_CHUNK)
            if data:
                frames.extend(data)
    except KeyboardInterrupt:
        print("Gravação interrompida.")
    finally:
        ser.close()

    # Ajuste -- garantir múltiplo de SAMPLE_WIDTH
    if len(frames) % SAMPLE_WIDTH != 0:
        cut = len(frames) % SAMPLE_WIDTH
        print(f"Ajustando {cut} byte(s) finais para alinhar com {SAMPLE_WIDTH} bytes/amostra.")
        frames = frames[:len(frames) - cut]

    # Salvar WAV
    with wave.open(OUTPUT_FILE, "wb") as wf:
        wf.setnchannels(CHANNELS)
        wf.setsampwidth(SAMPLE_WIDTH)
        wf.setframerate(SAMPLE_RATE)
        wf.writeframes(frames)

    filesize = os.path.getsize(OUTPUT_FILE)
    duration_calc = filesize / (SAMPLE_WIDTH * SAMPLE_RATE)
    print(f"Salvo: {os.path.abspath(OUTPUT_FILE)}")
    print(f"Tamanho do arquivo: {filesize} bytes  | Duração aproximada (s): {duration_calc:.2f}")

if __name__ == "__main__":
    # permite passar a porta como argumento: python gravar_serial_wav.py COM3
    if len(sys.argv) > 1:
        PORT = sys.argv[1]
    main(PORT)
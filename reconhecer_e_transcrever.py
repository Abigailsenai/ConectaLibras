import speech_recognition as sr
import librosa
import numpy as np
import pickle
import os

ARQUIVO_AUDIO = "audios_teste/novo.wav"

def extrair_mfcc(caminho_arquivo):
    y, sr = librosa.load(caminho_arquivo, sr=None)
    mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
    return np.mean(mfcc.T, axis=0)

with open("modelo_timbres.pkl", "rb") as f:
    modelo = pickle.load(f)

features = extrair_mfcc(ARQUIVO_AUDIO)
falante = modelo.predict([features])[0]
print(f"🎤 Falante identificado como: {falante}")

r = sr.Recognizer()
with sr.AudioFile(ARQUIVO_AUDIO) as source:
    audio = r.record(source)

print("🗣️ Transcrevendo fala...")
try:
    texto = r.recognize_google(audio, language="pt-BR")
    print(f"\n[{falante}]: {texto}")
except Exception as e:
    print("Erro na transcrição:", e)

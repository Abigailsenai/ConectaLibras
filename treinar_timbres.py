import os
import numpy as np
import librosa
import pickle
from sklearn.svm import SVC

PASTA_TREINO = "audios_treinamento"

def extrair_mfcc(caminho_arquivo):
    y, sr = librosa.load(caminho_arquivo, sr=None)
    mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
    return np.mean(mfcc.T, axis=0)

X, y = [], []

for arquivo in os.listdir(PASTA_TREINO):
    if arquivo.endswith(".wav"):
        pessoa = "".join([c for c in arquivo if not c.isdigit()]).replace(".wav", "")
        caminho = os.path.join(PASTA_TREINO, arquivo)
        print(f"🔍 Extraindo MFCC de {arquivo}")
        features = extrair_mfcc(caminho)
        X.append(features)
        y.append(pessoa)

modelo = SVC(kernel='linear', probability=True)
modelo.fit(X, y)

with open("modelo_timbres.pkl", "wb") as f:
    pickle.dump(modelo, f)

print("✅ Modelo treinado e salvo em modelo_timbres.pkl")
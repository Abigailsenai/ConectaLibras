// Libras
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Video } from "expo-av";
import { signOut } from "firebase/auth";
import { auth } from "./firebaseConfig";
import { useFonts } from "expo-font";
import { Feather, Entypo } from "@expo/vector-icons";

export default function Libras({ navigation }) {
  const [mostrandoLibras, setMostrandoLibras] = useState(false);
  const [mostrarVideo, setMostrarVideo] = useState(false);
  const [iconeSom, setIconeSom] = useState("sound-mute");
  const [corIcone, setCorIcone] = useState("#fff");

  const handlePrincipal = () => {
    signOut(auth)
      .then(() => {
        navigation.replace("Menu");
      })
      .catch((error) => {
        alert(error.message);
      });
  };

  const [fontsLoaded] = useFonts({
    titulos: require("./assets/fonts/gliker-regular.ttf"),
    textos: require("./assets/fonts/sanchez-font.ttf"),
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#4C7DFF" />
      </View>
    );
  }

  const handleMostrarVideo = () => {
    setMostrandoLibras(true);
    setMostrarVideo(true);
    setIconeSom("sound"); // muda o ícone ao clicar
    iniciarAnimacaoCores();

    setTimeout(() => {
      setMostrarVideo(false);
      setMostrandoLibras(false);
      setCorIcone("#fff");
      setIconeSom("sound-mute"); // volta ao estado inicial
    }, 14000);
  };

  // alterna cores a cada 2 segundos durante os 14s
  const iniciarAnimacaoCores = () => {
    const cores = ["#FFD05A"];
    let index = 0;

    const intervalo = setInterval(() => {
      setCorIcone(cores[index % cores.length]);
      index++;
    }, 2000);

    setTimeout(() => clearInterval(intervalo), 14000);
  };

  return (
    <View style={styles.container}>
      <View style={styles.menu}>
        <Text style={styles.titulo}>Conecta Libras</Text>
        <TouchableOpacity style={styles.botao} onPress={handlePrincipal}>
          <Feather name="menu" size={50} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.botoes}>
        <TouchableOpacity
          style={styles.botaoSom}
          onPress={handleMostrarVideo}
          activeOpacity={0.7}
        >
          <Entypo
            name={iconeSom}
            size={50}
            color={mostrandoLibras ? corIcone : "#fff"}
          />
        </TouchableOpacity>
      </View>

      {mostrarVideo && (
        <View style={styles.videoContainer}>
          <Video
            source={require("./assets/videos/libras-demo.mp4")}
            rate={1.0}
            volume={1.0}
            isMuted={false}
            resizeMode="contain"
            shouldPlay
            style={{ width: 300, height: 450 }}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    backgroundColor: "#000",
  },
  menu: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 50,
  },
  titulo: {
    fontSize: 50,
    marginRight: 120,
    color: "#fff",
    fontFamily: "titulos",
  },
  botao: {
    padding: 10,
  },
  botoes: {
    flexDirection: "row",
    marginTop: 40,
    width: "85%",
    marginLeft: 55,
  },
  botaoSom: {
    alignItems: "center",
    justifyContent: "center",
  },
  videoContainer: {
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 15,
    marginTop: 40,
  },
});

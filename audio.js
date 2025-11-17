//Audio
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { signOut } from "firebase/auth";
import { auth } from "./firebaseConfig";
import { useFonts } from "expo-font";
import Feather from "@expo/vector-icons/Feather";

export default function Audio({ navigation }) {
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

  return (
    <View style={styles.container}>
      <View style={styles.menu}>
        <Text style={styles.titulo}>Conecta Libras</Text>
        <TouchableOpacity style={styles.botao} onPress={handlePrincipal}>
          <Feather name="menu" size={50} color="#fff" />
        </TouchableOpacity>
      </View>
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
});

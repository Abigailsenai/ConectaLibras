// Histórico
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useFonts } from "expo-font";
import Entypo from "@expo/vector-icons/Entypo";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import Feather from "@expo/vector-icons/Feather";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { db } from "./firebaseConfig";
import { doc, getDoc } from "firebase/firestore";

export default function Historico({ navigation }) {
  const [conteudo, setConteudo] = useState("");
  const [atualizadoEm, setAtualizadoEm] = useState("");
  const [loading, setLoading] = useState(true);

  const Voltar = () => navigation.goBack();

  const [fontsLoaded] = useFonts({
    titulos: require("./assets/fonts/gliker-regular.ttf"),
    textos: require("./assets/fonts/sanchez-font.ttf"),
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const docRef = doc(db, "conversas", "1");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setConteudo(data.conteudo);
          setAtualizadoEm(
            data.atualizadoEm
              ? new Date(data.atualizadoEm.seconds * 1000).toLocaleString("pt-BR")
              : ""
          );
        } else {
          console.log("Documento não encontrado!");
        }
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (!fontsLoaded || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4C7DFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 🔹 Cabeçalho fixo */}
      <View style={styles.inicio}>
        <TouchableOpacity style={styles.botao} onPress={Voltar}>
          <Entypo name="chevron-small-left" size={70} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.titulo}>Histórico</Text>
      </View>

      {/* 🔹 Corpo com Scroll */}
      <View style={styles.corpoContainer}>
        <ScrollView
          style={styles.scrollArea}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          <Text style={styles.diaTitulo}>{atualizadoEm}</Text>

          {/* Item 1 - Tradução para Libras */}
          <View style={styles.item}>
            <FontAwesome6 name="hands" size={35} color="#fff" />
            <Text style={styles.itemTexto}>
              Hoje o dia foi tão corrido que mal consegui almoçar.
            </Text>
          </View>

          {/* Item 2 - Áudio reproduzido */}
          <View style={styles.item}>
            <Feather name="volume-2" size={35} color="#fff" />
            <Text style={styles.itemTexto}>
              Você viu aquele filme novo que estreou no cinema?
            </Text>
          </View>

          {/* Item 3 - Texto digitado (vem do Firestore) */}
          <View style={styles.item}>
            <MaterialIcons name="keyboard" size={35} color="#fff" />
            <Text style={styles.itemTexto}>
              {conteudo ? conteudo : "(sem conteúdo)"}
            </Text>
          </View>

          <View style={styles.linha} />
        </ScrollView>
      </View>

      {/* 🔹 Rodapé fixo */}
      <View style={styles.rodapeContainer}>
        <Text style={styles.rodape}>CONECTA LIBRAS</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // ======== Estrutura base ========
  container: {
    flex: 1,
    backgroundColor: "#01283C",
    width: "100%",
    paddingTop: 50,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  // ======== Cabeçalho fixo ========
  inicio: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 30,
    marginBottom: 10,
  },
  botao: {
    marginTop: 35,
    paddingLeft: 20,
  },
  titulo: {
    fontSize: 50,
    color: "#fff",
    fontFamily: "titulos",
    marginTop: 30,
    marginLeft: 10,
  },

  // ======== Corpo com Scroll ========
  corpoContainer: {
    flex: 1,
    backgroundColor: "#000",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    marginTop: 20,
    overflow: "hidden",
  },
  scrollArea: {
    padding: 30,
  },
  diaTitulo: {
    fontSize: 40,
    color: "#FFBE1D",
    fontFamily: "textos",
    marginBottom: 20,
    marginLeft: 40,
    fontWeight: "100",
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 30,
    marginLeft: 40,
  },
  itemTexto: {
    color: "#fff",
    fontSize: 28.4,
    marginLeft: 25,
    fontFamily: "textos",
    flexShrink: 1,
  },
  linha: {
    height: 2,
    backgroundColor: "#848484ff",
    width: "90%",
    alignSelf: "center",
    marginTop: 40,
    marginBottom: 50,
  },

  // ======== Rodapé fixo ========
  rodapeContainer: {
    paddingVertical: 15,
    alignItems: "center",
  },
  rodape: {
    color: "#fff",
    fontFamily: "textos",
    fontSize: 21,
  },
});
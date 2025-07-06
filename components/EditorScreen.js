
import React, { useState } from 'react';
import {
  View,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Text,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView, 
} from 'react-native';


const EditorScreen = ({
  documentContent,
  setDocumentContent,
  documentTitle,
  setDocumentTitle,
  pageCount,
  setPageCount,
  isFavorite,
  setIsFavorite,
  favoriteDocuments, 
  setFavoriteDocuments, 
  navigateToFavorites, 
}) => {

  const handleSaveDocument = () => {
    Alert.alert('Guardar', `Documento "${documentTitle}" guardado.`);
    console.log('Contenido del documento:', documentContent);
  };

  const handleAddPage = () => {
    setPageCount(prevCount => prevCount + 1);
    setDocumentContent(prevContent => prevContent + '\n\n--- Nueva Página ---\n\n');
    Alert.alert('Página Agregada', `Ahora tienes ${pageCount + 1} páginas.`);
  };

  const handleToggleFavorite = () => {
    const newFavoriteStatus = !isFavorite;
    setIsFavorite(newFavoriteStatus);

    if (newFavoriteStatus) {
     
      if (!favoriteDocuments.includes(documentTitle)) {
        setFavoriteDocuments(prevFavorites => [...prevFavorites, documentTitle]);
      }
      Alert.alert('Favoritos', 'Agregado a favoritos');
    } else {
  
      setFavoriteDocuments(prevFavorites =>
        prevFavorites.filter(title => title !== documentTitle)
      );
      Alert.alert('Favoritos', 'Eliminado de favoritos');
    }
  };

  const handleDownloadDocument = () => {
    Alert.alert(
      'Descargar',
      'La descarga de archivos sin librerías externas que accedan al sistema de archivos del dispositivo no es posible en React Native. Esto es una limitación de seguridad de la plataforma.'
    );
    console.log('Intentando descargar:', documentContent);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
    
      <View style={styles.toolbar}>
        <TouchableOpacity onPress={handleSaveDocument} style={styles.toolbarButton}>
          <Text style={styles.buttonText}>Guardar</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleAddPage} style={styles.toolbarButton}>
          <Text style={styles.buttonText}>Página</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDownloadDocument} style={styles.toolbarButton}>
          <Text style={styles.buttonText}>Descargar</Text>
        </TouchableOpacity>
      </View>

     
      <TextInput
        style={styles.titleInput}
        value={documentTitle}
        onChangeText={setDocumentTitle}
        placeholder="Título del documento"
        placeholderTextColor="#999"
      />

     
      <ScrollView style={styles.textAreaContainer}>
        <TextInput
          style={styles.textArea}
          multiline
          value={documentContent}
          onChangeText={setDocumentContent}
          placeholder="Empieza a escribir aquí..."
          placeholderTextColor="#aaa"
          textAlignVertical="top"
          autoCorrect={false}
        />
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.infoText}>Páginas: {pageCount}</Text>
        <Text style={styles.infoText}>Caracteres: {documentContent.length}</Text>
        <TouchableOpacity
          onPress={handleToggleFavorite}
          style={[
            styles.footerButton,
            isFavorite ? styles.favoriteButtonActive : styles.favoriteButtonInactive,
          ]}
        >
          <Text style={styles.footerButtonText}>
            {isFavorite ? '★ Favorito' : '☆ Favorito'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={navigateToFavorites} 
          style={styles.footerButton}
        >
          <Text style={styles.footerButtonText}>Ver Favoritos</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};


const FavoritesScreen = ({ favoriteDocuments, navigateToEditor }) => {
  return (
    <View style={favoritesStyles.container}>
      <Text style={favoritesStyles.header}>Mis Favoritos</Text>
      {favoriteDocuments.length > 0 ? (
        <ScrollView style={favoritesStyles.listContainer}>
          {favoriteDocuments.map((item, index) => (
            <View key={index} style={favoritesStyles.favoriteItem}>
              <Text style={favoritesStyles.favoriteText}>{item}</Text>
            </View>
          ))}
        </ScrollView>
      ) : (
        <Text style={favoritesStyles.noFavoritesText}>
          Aún no tienes documentos favoritos.
        </Text>
      )}
      <TouchableOpacity
        onPress={navigateToEditor} // Llama a la función para volver al editor
        style={favoritesStyles.backButton}
      >
        <Text style={favoritesStyles.backButtonText}>Volver al Editor</Text>
      </TouchableOpacity>
    </View>
  );
};


const App = () => {
  const [currentView, setCurrentView] = useState('editor'); // 'editor' o 'favorites'

  // Estados del editor
  const [documentContent, setDocumentContent] = useState('');
  const [documentTitle, setDocumentTitle] = useState('Nuevo Documento');
  const [pageCount, setPageCount] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteDocuments, setFavoriteDocuments] = useState([]);

  const navigateToFavorites = () => {
    setCurrentView('favorites');
  };

  const navigateToEditor = () => {
    setCurrentView('editor');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f0f2f5' }}>
      {currentView === 'editor' ? (
        <EditorScreen
          documentContent={documentContent}
          setDocumentContent={setDocumentContent}
          documentTitle={documentTitle}
          setDocumentTitle={setDocumentTitle}
          pageCount={pageCount}
          setPageCount={setPageCount}
          isFavorite={isFavorite}
          setIsFavorite={setIsFavorite}
          favoriteDocuments={favoriteDocuments}
          setFavoriteDocuments={setFavoriteDocuments}
          navigateToFavorites={navigateToFavorites}
        />
      ) : (
        <FavoritesScreen
          favoriteDocuments={favoriteDocuments}
          navigateToEditor={navigateToEditor}
        />
      )}
    </SafeAreaView>
  );
};


// --- Estilos para EditorScreen ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5', // Un gris más suave
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 12,
    backgroundColor: '#ffffff', // Fondo blanco para la barra de herramientas
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    shadowColor: '#000', // Sombra para darle profundidad
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  toolbarButton: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    backgroundColor: '#4CAF50', // Verde vibrante
    borderRadius: 25, // Bordes más redondeados
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600', // Un poco más de grosor
    fontSize: 15,
  },
  titleInput: {
    fontSize: 22,
    fontWeight: 'bold',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#ffffff',
    color: '#333', // Color de texto más oscuro
  },
  textAreaContainer: {
    flex: 1,
    padding: 15,
    backgroundColor: '#ffffff',
    margin: 10, // Margen para que no ocupe todo el ancho
    borderRadius: 8, // Bordes redondeados para el área de texto
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  textArea: {
    flex: 1,
    fontSize: 17,
    lineHeight: 26,
    color: '#444',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#34495e', // Un azul oscuro para el footer
    borderTopWidth: 1,
    borderTopColor: '#2c3e50',
  },
  infoText: {
    fontSize: 14,
    color: '#ecf0f1', // Color de texto claro
    fontWeight: '500',
  },
  footerButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    backgroundColor: '#3498db', // Azul para los botones del footer
    borderRadius: 20,
    marginLeft: 10,
  },
  footerButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  favoriteButtonActive: {
    backgroundColor: '#f39c12', // Naranja para favorito activo
  },
  favoriteButtonInactive: {
    backgroundColor: '#7f8c8d', // Gris para favorito inactivo
  },
});

// --- Estilos para FavoritesScreen ---
const favoritesStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    padding: 20,
    paddingTop: Platform.OS === 'android' ? 25 : 50, // Ajuste para barra de estado
  },
  header: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  listContainer: {
    flex: 1,
  },
  favoriteItem: {
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  favoriteText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  noFavoritesText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 50,
  },
  backButton: {
    backgroundColor: '#3498db',
    padding: 15,
    borderRadius: 25,
    marginTop: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default App;
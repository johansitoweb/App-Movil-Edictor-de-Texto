
import React, { useState, useEffect, useRef } from 'react';
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
  StatusBar,
  Modal,
  FlatList,
  ActivityIndicator,
} from 'react-native';


const insertTextAtSelection = (originalText, newText, selection) => {
  const { start, end } = selection;
  const before = originalText.substring(0, start);
  const after = originalText.substring(end);
  return {
    newText: before + newText + after,
    newSelection: { start: start + newText.length, end: start + newText.length },
  };
};


const wrapTextWithMarkers = (originalText, selection, startMarker, endMarker) => {
  const { start, end } = selection;
  const selectedText = originalText.substring(start, end);
  let newTextValue;
  let newSelection;

  if (!selectedText) {
    
    newTextValue = originalText.substring(0, start) + startMarker + endMarker + originalText.substring(end);
    newSelection = { start: start + startMarker.length, end: start + startMarker.length };
  } else {

    const beforeSelected = originalText.substring(0, start);
    const afterSelected = originalText.substring(end);

    if (beforeSelected.endsWith(startMarker) && afterSelected.startsWith(endMarker)) {
      
      newTextValue = originalText.substring(0, start - startMarker.length) +
                     selectedText +
                     originalText.substring(end + endMarker.length);
      newSelection = { start: start - startMarker.length, end: end - startMarker.length };
    } else {
      
      newTextValue = originalText.substring(0, start) +
                     startMarker + selectedText + endMarker +
                     originalText.substring(end);
      newSelection = { start: start + startMarker.length, end: end + startMarker.length };
    }
  }
  return { newText: newTextValue, newSelection: newSelection };
};

const toggleBold = (text, selection) => wrapTextWithMarkers(text, selection, '**', '**');
const toggleItalic = (text, selection) => wrapTextWithMarkers(text, selection, '*', '*');
const toggleUnderline = (text, selection) => wrapTextWithMarkers(text, selection, '__', '__');

const applyColor = (text, selection, colorHex) => {
  const startMarker = `[color:${colorHex}]`;
  const endMarker = `[/color]`;
  return wrapTextWithMarkers(text, selection, startMarker, endMarker);
};

const applyFontSize = (text, selection, size) => {
  const startMarker = `[size:${size}]`;
  const endMarker = `[/size]`;
  return wrapTextWithMarkers(text, selection, startMarker, endMarker);
};

const applyAlignment = (text, selection, alignType) => {
  const lines = text.split('\n');
  const startLineIndex = text.substring(0, selection.start).split('\n').length - 1;
  const endLineIndex = text.substring(0, selection.end).split('\n').length - 1;

  let newTextValue = text;
  let newSelection = { ...selection }; 


  let offset = 0;

  for (let i = startLineIndex; i <= endLineIndex; i++) {
    let currentLine = lines[i];
    const originalLineLength = currentLine.length;

    
    const currentAlignMatch = currentLine.match(/^\{\{align:(left|center|right)\}\}/);
    let currentAlignTag = '';
    if (currentAlignMatch) {
      currentAlignTag = currentAlignMatch[0];
      currentLine = currentLine.substring(currentAlignTag.length);
    }

    let newLine = currentLine;
    let newAlignTag = '';

    if (alignType !== 'left') {
      newAlignTag = `{{align:${alignType}}}`;
      newLine = `${newAlignTag}${currentLine}`;
    }

    if (newLine !== lines[i]) {
      const lineStartPos = text.split('\n').slice(0, i).join('\n').length + (i > 0 ? 1 : 0); 
      const lineEndPos = lineStartPos + originalLineLength;

      
      if (startLineIndex === i) {
        newSelection.start += (newLine.length - originalLineLength);
      }
      if (endLineIndex === i) {
        newSelection.end += (newLine.length - originalLineLength);
      }

      // Reconstruct the text with the modified line
      lines[i] = newLine;
    }
  }

  newTextValue = lines.join('\n');
  return { newText: newTextValue, newSelection: newSelection };
};

// --- Componente SplashScreen ---
const SplashScreen = ({ onFinish }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, 2000);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <View style={splashStyles.container}>
      <Text style={splashStyles.title}>Mi Editor de Texto</Text>
      <ActivityIndicator size="large" color="#FFFFFF" style={splashStyles.spinner} />
      <Text style={splashStyles.loadingText}>Cargando...</Text>
    </View>
  );
};

// --- Componente EditorScreen ---
const EditorScreen = ({
  documentContent,
  setDocumentContent,
  setDocumentTitle, // Ya no se usa directamente para el título separado
  pageCount,
  setPageCount,
  isFavorite,
  setIsFavorite,
  favoriteDocuments,
  setFavoriteDocuments,
  navigateToFavorites,
  clearDocument,
  savedDocuments,
  loadDocument,
  showLoadModal,
  setShowLoadModal,
  currentSelection,
  setCurrentSelection,
  inputRef // Referencia al TextInput para controlar el foco/selección
}) => {

  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showSizePicker, setShowSizePicker] = useState(false);

  // Determinar el título para mostrar en la UI y guardar
  const displayTitle = documentContent.split('\n')[0].replace(/^\{\{align:(left|center|right)\}\}/, '').trim();

  const predefinedColors = [
    { name: 'Negro', hex: '#000000' },
    { name: 'Rojo', hex: '#FF0000' },
    { name: 'Azul', hex: '#0000FF' },
    { name: 'Verde', hex: '#008000' },
    { name: 'Naranja', hex: '#FFA500' },
    { name: 'Púrpura', hex: '#800080' },
    { name: 'Blanco', hex: '#FFFFFF' },
  ];

  const predefinedSizes = [
    { name: 'Pequeño', value: 12 },
    { name: 'Normal', value: 16 },
    { name: 'Mediano', value: 20 },
    { name: 'Grande', value: 24 },
    { name: 'Muy Grande', value: 30 },
  ];

  // Calcula el contador de palabras del contenido, excluyendo la primera línea (título)
  const contentWithoutTitle = documentContent.split('\n').slice(1).join('\n').trim();
  const wordCount = contentWithoutTitle.split(/\s+/).filter(word => word.length > 0).length;

  const handleSaveDocument = () => {
    // Usamos displayTitle para el nombre del documento
    Alert.alert('Guardar', `Documento "${displayTitle || 'Sin Título'}" guardado exitosamente.`);
    // La lógica de guardado automático en App.js ya se encarga de esto.
  };

  const handleAddPage = () => {
    setPageCount(prevCount => prevCount + 1);
    setDocumentContent(prevContent => prevContent + '\n\n--- Nueva Página ---\n\n');
    Alert.alert('Página Agregada', `Ahora tienes ${pageCount + 1} páginas en tu documento.`);
  };

  const handleToggleFavorite = () => {
    const newFavoriteStatus = !isFavorite;
    setIsFavorite(newFavoriteStatus);

    const docName = displayTitle || 'Sin Título';
    if (newFavoriteStatus) {
      if (!favoriteDocuments.includes(docName)) {
        setFavoriteDocuments(prevFavorites => [...prevFavorites, docName]);
      }
      Alert.alert('Favoritos', 'Documento agregado a tu lista de favoritos.');
    } else {
      setFavoriteDocuments(prevFavorites =>
        prevFavorites.filter(title => title !== docName)
      );
      Alert.alert('Favoritos', 'Documento eliminado de tu lista de favoritos.');
    }
  };

  const handleDownloadDocument = () => {
    Alert.alert(
      'Descargar',
      'La descarga de archivos directamente al sistema de archivos del dispositivo no es posible sin librerías externas que accedan a esas funcionalidades nativas por motivos de seguridad y permisos de la plataforma.'
    );
    console.log('Intentando descargar:', documentContent);
  };

  // --- Funciones para aplicar formato al texto seleccionado ---
  const applyFormatting = (formatFunction, ...args) => {
    const { newText, newSelection } = formatFunction(documentContent, currentSelection, ...args);
    setDocumentContent(newText);
    setCurrentSelection(newSelection);
    // Optional: Re-focus and set selection
    if (inputRef.current) {
        inputRef.current.setNativeProps({ selection: newSelection });
    }
  };

  const applyBold = () => applyFormatting(toggleBold);
  const applyItalic = () => applyFormatting(toggleItalic);
  const applyUnderline = () => applyFormatting(toggleUnderline);
  const selectColor = (colorHex) => applyFormatting(applyColor, colorHex);
  const selectFontSize = (size) => applyFormatting(applyFontSize, size);
  const alignText = (alignment) => applyFormatting(applyAlignment, alignment);

  // --- Función de parseo para el renderizado del texto con formato ---
  const renderFormattedText = (text) => {
    // Regex principal para capturar todos los tipos de marcadores
    const inlineFormattingRegex = /(\*\*([^\*]+?)\*\*|\*([^\*]+?)\*|__([^_]+?)__|\\[color:(#[0-9a-fA-F]{6})\\](.*?)\\[\\/color\\]|\\[size:(\d+)\\](.*?)\\[\\/size\\])/g;

    const lines = text.split('\n');

    // Manejar la primera línea como título
    const titleLine = lines[0];
    const restOfContent = lines.slice(1).join('\n');

    const renderLine = (lineContent, lineIndex) => {
        let currentLine = lineContent;
        let lineAlignment = 'left';

        // Check for block-level alignment tag at the beginning of the line
        const alignMatch = currentLine.match(/^\{\{align:(left|center|right)\}\}/);
        if (alignMatch) {
            lineAlignment = alignMatch[1];
            currentLine = currentLine.substring(alignMatch[0].length); // Remove the alignment tag
        }

        const parts = [];
        let lastIndex = 0;
        let match;

        // Reset regex lastIndex to 0 for each line processing
        inlineFormattingRegex.lastIndex = 0;

        while ((match = inlineFormattingRegex.exec(currentLine)) !== null) {
            // Add text before the matched tag
            if (match.index > lastIndex) {
                parts.push({ type: 'text', content: currentLine.substring(lastIndex, match.index) });
            }

            let style = {};
            let content = '';

            // Determine which group matched and extract content/style
            if (match[2]) { // Bold: **...**
                style = { fontWeight: 'bold' };
                content = match[2];
            } else if (match[3]) { // Italic: *...*
                style = { fontStyle: 'italic' };
                content = match[3];
            } else if (match[4]) { // Underline: __...__
                style = { textDecorationLine: 'underline' };
                content = match[4];
            } else if (match[5] && match[6]) { // Color: [color:#HEX]...[/color]
                style = { color: match[5] };
                content = match[6];
            } else if (match[7] && match[8]) { // Size: [size:NN]...[/size]
                style = { fontSize: parseInt(match[7], 10) };
                content = match[8];
            }

            parts.push({ type: 'formatted', content: content, style: style });
            lastIndex = inlineFormattingRegex.lastIndex;
        }

        // Add any remaining text after the last tag
        if (lastIndex < currentLine.length) {
            parts.push({ type: 'text', content: currentLine.substring(lastIndex) });
        }

        return (
            <Text key={`line-${lineIndex}`} style={{ textAlign: lineAlignment, lineHeight: 28, fontSize: 18, color: '#444' }}>
                {parts.map((part, partIndex) => (
                    <Text key={partIndex} style={part.style}>
                        {part.content}
                    </Text>
                ))}
            </Text>
        );
    };

    return (
        <>
            {/* Render the title separately with specific styles */}
            <Text style={editorStyles.renderedTitle}>
                {renderLine(titleLine, 'title')}
            </Text>
            {/* Render the rest of the content */}
            {restOfContent.split('\n').map((line, index) => renderLine(line, index + 1))}
        </>
    );
  };

  return (
    <KeyboardAvoidingView
      style={editorStyles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#f9f9f9" />

      {/* Barra de herramientas superior */}
      <View style={editorStyles.toolbar}>
        <TouchableOpacity onPress={handleSaveDocument} style={editorStyles.toolbarButton}>
          <Text style={editorStyles.buttonText}>Guardar</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleAddPage} style={editorStyles.toolbarButton}>
          <Text style={editorStyles.buttonText}>Página</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDownloadDocument} style={editorStyles.toolbarButton}>
          <Text style={editorStyles.buttonText}>Descargar</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setShowLoadModal(true)} style={editorStyles.toolbarButton}>
            <Text style={editorStyles.buttonText}>Cargar</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={clearDocument} style={[editorStyles.toolbarButton, { backgroundColor: '#e74c3c' }]}>
            <Text style={editorStyles.buttonText}>Nuevo</Text>
        </TouchableOpacity>
      </View>

      {/* Barra de herramientas de formato de texto */}
      <View style={editorStyles.formatToolbar}>
        {/* Alineación */}
        <TouchableOpacity onPress={() => alignText('left')} style={editorStyles.formatButton}>
          <Text style={editorStyles.formatButtonText}>←</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => alignText('center')} style={editorStyles.formatButton}>
          <Text style={editorStyles.formatButtonText}>↔</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => alignText('right')} style={editorStyles.formatButton}>
          <Text style={editorStyles.formatButtonText}>→</Text>
        </TouchableOpacity>

        {/* Formatos de estilo */}
        <TouchableOpacity onPress={applyBold} style={editorStyles.formatButton}>
          <Text style={editorStyles.formatButtonText}>B</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={applyItalic} style={editorStyles.formatButton}>
          <Text style={[editorStyles.formatButtonText, { fontStyle: 'italic' }]}>I</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={applyUnderline} style={editorStyles.formatButton}>
          <Text style={[editorStyles.formatButtonText, { textDecorationLine: 'underline' }]}>U</Text>
        </TouchableOpacity>

        {/* Color de texto */}
        <TouchableOpacity onPress={() => setShowColorPicker(true)} style={editorStyles.formatButton}>
          <Text style={editorStyles.formatButtonText}>🎨</Text>
        </TouchableOpacity>

        {/* Tamaño de fuente */}
        <TouchableOpacity onPress={() => setShowSizePicker(true)} style={editorStyles.formatButton}>
          <Text style={editorStyles.formatButtonText}>A±</Text>
        </TouchableOpacity>
      </View>

      {/* Área de edición de texto */}
      <ScrollView style={editorStyles.textAreaContainer}>
        <TextInput
          ref={inputRef} // Asignamos la referencia
          style={editorStyles.textArea}
          multiline
          value={documentContent}
          onChangeText={setDocumentContent}
          onSelectionChange={({ nativeEvent: { selection } }) => setCurrentSelection(selection)}
          placeholder="" // Dejamos el placeholder vacío aquí
          textAlignVertical="top"
          autoCorrect={false}
          autoCapitalize="sentences"
          selection={currentSelection} // Controlamos la selección
        />
        <View style={editorStyles.renderedTextContainer}>
          {documentContent.trim().length === 0 || documentContent === 'Escribe tu título aquí...\n\nEmpieza a escribir aquí...' ? (
            <>
              <Text style={editorStyles.renderedTitlePlaceholder}>Escribe tu título aquí...</Text>
              <Text style={editorStyles.renderedBodyPlaceholder}>Empieza a escribir aquí...</Text>
            </>
          ) : (
            renderFormattedText(documentContent)
          )}
        </View>
      </ScrollView>

      {/* Footer con información y botón de favoritos */}
      <View style={editorStyles.footer}>
        <Text style={editorStyles.infoText}>Páginas: {pageCount}</Text>
        <Text style={editorStyles.infoText}>Palabras: {wordCount}</Text>
        <Text style={editorStyles.infoText}>Caracteres: {contentWithoutTitle.length}</Text>
        <TouchableOpacity
          onPress={handleToggleFavorite}
          style={[
            editorStyles.footerButton,
            isFavorite ? editorStyles.favoriteButtonActive : editorStyles.favoriteButtonInactive,
          ]}
        >
          <Text style={editorStyles.footerButtonText}>
            {isFavorite ? '★ Favorito' : '☆ Favorito'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={navigateToFavorites}
          style={editorStyles.footerButton}
        >
          <Text style={editorStyles.footerButtonText}>Ver Favoritos</Text>
        </TouchableOpacity>
      </View>

      {/* Modales (Cargar, Color, Tamaño) */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showLoadModal}
        onRequestClose={() => setShowLoadModal(false)}
      >
        <View style={modalStyles.centeredView}>
          <View style={modalStyles.modalView}>
            <Text style={modalStyles.modalTitle}>Cargar Documento</Text>
            {Object.keys(savedDocuments).length === 0 ? (
              <Text style={modalStyles.noDocumentsText}>No hay documentos guardados.</Text>
            ) : (
              <FlatList
                data={Object.keys(savedDocuments)}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={modalStyles.documentItem}
                    onPress={() => {
                      loadDocument(item);
                      setShowLoadModal(false);
                    }}
                  >
                    <Text style={modalStyles.documentItemText}>{item}</Text>
                  </TouchableOpacity>
                )}
              />
            )}
            <TouchableOpacity
              style={modalStyles.closeButton}
              onPress={() => setShowLoadModal(false)}
            >
              <Text style={modalStyles.closeButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={showColorPicker}
        onRequestClose={() => setShowColorPicker(false)}
      >
        <View style={modalStyles.centeredView}>
          <View style={modalStyles.modalView}>
            <Text style={modalStyles.modalTitle}>Seleccionar Color</Text>
            <FlatList
              data={predefinedColors}
              keyExtractor={(item) => item.hex}
              numColumns={3}
              columnWrapperStyle={modalStyles.colorGrid}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[modalStyles.colorItem, { backgroundColor: item.hex }]}
                  onPress={() => selectColor(item.hex)}
                >
                  <Text style={[modalStyles.colorItemText, { color: item.hex === '#000000' || item.hex === '#0000FF' || item.hex === '#800080' ? '#FFFFFF' : '#000000' }]}>
                    {item.name}
                  </Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={modalStyles.closeButton}
              onPress={() => setShowColorPicker(false)}
            >
              <Text style={modalStyles.closeButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={showSizePicker}
        onRequestClose={() => setShowSizePicker(false)}
      >
        <View style={modalStyles.centeredView}>
          <View style={modalStyles.modalView}>
            <Text style={modalStyles.modalTitle}>Seleccionar Tamaño</Text>
            <FlatList
              data={predefinedSizes}
              keyExtractor={(item) => String(item.value)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={modalStyles.sizeItem}
                  onPress={() => selectFontSize(item.value)}
                >
                  <Text style={[modalStyles.sizeItemText, { fontSize: item.value }]}>
                    {item.name} ({item.value}px)
                  </Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={modalStyles.closeButton}
              onPress={() => setShowSizePicker(false)}
            >
              <Text style={modalStyles.closeButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

// --- Componente FavoritesScreen ---
const FavoritesScreen = ({ favoriteDocuments, navigateToEditor }) => {
  return (
    <View style={favoritesStyles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#34495e" />
      <Text style={favoritesStyles.header}>Mis Documentos Favoritos</Text>
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
          ¡Aún no tienes documentos marcados como favoritos! Pulsa el botón "☆ Favorito" en el editor para añadir uno.
        </Text>
      )}
      <TouchableOpacity
        onPress={navigateToEditor}
        style={favoritesStyles.backButton}
      >
        <Text style={favoritesStyles.backButtonText}>Volver al Editor</Text>
      </TouchableOpacity>
    </View>
  );
};

// --- Componente Principal de la Aplicación ---
const App = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState('editor');

  const [documentContent, setDocumentContent] = useState('Escribe tu título aquí...\n\nEmpieza a escribir aquí...'); // Contenido inicial con placeholder para título y cuerpo
  const [pageCount, setPageCount] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteDocuments, setFavoriteDocuments] = useState([]);
  const [savedDocuments, setSavedDocuments] = useState({});
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [currentSelection, setCurrentSelection] = useState({ start: 0, end: 0 });

  const inputRef = useRef(null); // Referencia al TextInput

  // Lógica para guardar el documento actual automáticamente
  useEffect(() => {
    const lines = documentContent.split('\n');
    const titleFromContent = lines[0].replace(/^\{\{align:(left|center|right)\}\}/, '').trim();

    // Solo guarda si la primera línea no es el placeholder del título
    if (titleFromContent && titleFromContent !== 'Escribe tu título aquí...' && documentContent.trim().length > 0) {
      setSavedDocuments(prev => ({
        ...prev,
        [titleFromContent]: { // Usamos la primera línea como clave
          content: documentContent,
          pageCount: pageCount,
          isFavorite: isFavorite,
        },
      }));
    }
  }, [documentContent, pageCount, isFavorite]);

  const navigateToFavorites = () => setCurrentView('favorites');
  const navigateToEditor = () => setCurrentView('editor');

  const clearDocument = () => {
    Alert.alert(
      'Nuevo Documento',
      '¿Estás seguro de que quieres crear un nuevo documento? Se perderán los cambios no guardados en el documento actual.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, Nuevo',
          onPress: () => {
            setDocumentContent('Escribe tu título aquí...\n\nEmpieza a escribir aquí...');
            setPageCount(1);
            setIsFavorite(false);
            setCurrentSelection({ start: 0, end: 0 });
            Alert.alert('Listo', '¡Nuevo documento creado!');
          },
        },
      ]
    );
  };

  const loadDocument = (title) => {
    const docData = savedDocuments[title];
    if (docData) {
      setDocumentContent(docData.content);
      setPageCount(docData.pageCount);
      setIsFavorite(docData.isFavorite);
      setCurrentSelection({ start: 0, end: 0 });
      Alert.alert('Cargado', `Documento "${title}" cargado exitosamente.`);
    } else {
      Alert.alert('Error', 'Documento no encontrado.');
    }
  };

  if (isLoading) {
    return <SplashScreen onFinish={() => setIsLoading(false)} />;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f7fa' }}>
      {currentView === 'editor' ? (
        <EditorScreen
          documentContent={documentContent}
          setDocumentContent={setDocumentContent}
          setDocumentTitle={null} // Ya no se usa
          pageCount={pageCount}
          setPageCount={setPageCount}
          isFavorite={isFavorite}
          setIsFavorite={setIsFavorite}
          favoriteDocuments={favoriteDocuments}
          setFavoriteDocuments={setFavoriteDocuments}
          navigateToFavorites={navigateToFavorites}
          clearDocument={clearDocument}
          savedDocuments={savedDocuments}
          loadDocument={loadDocument}
          showLoadModal={showLoadModal}
          setShowLoadModal={setShowLoadModal}
          currentSelection={currentSelection}
          setCurrentSelection={setCurrentSelection}
          inputRef={inputRef} 
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


const primaryColor = '#4a90e2'; 
const secondaryColor = '#6d7f8d'; 
const accentColor = '#f39c12'; 

const splashStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: primaryColor,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  spinner: {
    marginTop: 20,
    marginBottom: 10,
  },
  loadingText: {
    fontSize: 18,
    color: '#FFFFFF',
    opacity: 0.8,
  },
});

const editorStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 15,
    backgroundColor: '#ffffff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  toolbarButton: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    backgroundColor: primaryColor,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  formatToolbar: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    paddingVertical: 10,
    backgroundColor: '#eef2f6',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#dbe1e6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  formatButton: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginHorizontal: 4,
    marginBottom: 5,
    backgroundColor: '#ffffff',
    borderRadius: 5,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#c0c0c0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  formatButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: secondaryColor,
  },
  // --- Nuevos estilos para el texto unificado ---
  // Estos reemplazan a titleInput
  textAreaContainer: {
    flex: 1,
    padding: 15,
    backgroundColor: '#ffffff',
    marginHorizontal: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    marginBottom: 15,
  },
  textArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    fontSize: 18,
    lineHeight: 28,
    color: 'transparent',
    paddingHorizontal: 10,
    paddingTop: 10,
    zIndex: 1,
  },
  renderedTextContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 10,
    paddingTop: 10,
    zIndex: 0,
  },
  renderedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10, // Espacio entre título y cuerpo
    textAlign: 'center', // Centra el título renderizado
  },
  renderedTitlePlaceholder: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#a0a0a0',
    textAlign: 'center',
    marginBottom: 10,
  },
  renderedBodyPlaceholder: {
    fontSize: 18,
    lineHeight: 28,
    color: '#b0b0b0',
    paddingHorizontal: 10,
  },
  // --- Fin de nuevos estilos ---
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 15,
    backgroundColor: '#34495e',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#4f6c84',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 5,
  },
  infoText: {
    fontSize: 13,
    color: '#ecf0f1',
    fontWeight: '500',
  },
  footerButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: primaryColor,
    borderRadius: 20,
    marginLeft: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  footerButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  favoriteButtonActive: {
    backgroundColor: accentColor,
  },
  favoriteButtonInactive: {
    backgroundColor: secondaryColor,
  },
});

const favoritesStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
    padding: 20,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 50,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#34495e',
    marginBottom: 25,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.05)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  listContainer: {
    flex: 1,
  },
  favoriteItem: {
    backgroundColor: '#ffffff',
    padding: 18,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  favoriteText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  noFavoritesText: {
    fontSize: 16,
    color: '#777',
    textAlign: 'center',
    marginTop: 50,
    lineHeight: 24,
  },
  backButton: {
    backgroundColor: primaryColor,
    padding: 18,
    borderRadius: 30,
    marginTop: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

const modalStyles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    width: '85%',
    maxHeight: '75%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 25,
    color: '#333',
  },
  documentItem: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
    width: '100%',
    alignItems: 'center',
  },
  documentItemText: {
    fontSize: 17,
    color: '#555',
  },
  noDocumentsText: {
    fontSize: 16,
    color: '#888',
    marginBottom: 20,
    textAlign: 'center',
  },
  closeButton: {
    backgroundColor: '#e74c3c',
    borderRadius: 25,
    padding: 12,
    elevation: 3,
    marginTop: 25,
    paddingHorizontal: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  closeButtonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 17,
  },
  colorGrid: {
    justifyContent: 'space-between',
    width: '100%',
  },
  colorItem: {
    width: 90,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    margin: 5,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  colorItemText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  sizeItem: {
    paddingVertical: 12,
    paddingHorizontal: 25,
    marginVertical: 6,
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sizeItemText: {
    color: '#333',
    fontWeight: '600',
  },
});

export default App;
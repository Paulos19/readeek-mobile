import * as FileSystem from 'expo-file-system/legacy';

// URL base para montar o caminho dos arquivos (mesma da API)
const BASE_URL = 'https://readeek.vercel.app'; 
const booksDir = `${FileSystem.documentDirectory}books/`;

export const fileManager = {
  // Define o diretório base
  booksDir,

  // Garante que a pasta 'books' existe
  ensureDirExists: async () => {
    const dirInfo = await FileSystem.getInfoAsync(booksDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(booksDir, { intermediates: true });
    }
  },

  // Verifica se o livro existe (dentro de sua pasta específica)
  checkBookExists: async (bookId: string) => {
    // Procura por 'books/ID/book.epub'
    const uri = `${booksDir}${bookId}/book.epub`;
    const fileInfo = await FileSystem.getInfoAsync(uri);
    return fileInfo.exists;
  },

  // Lista os IDs dos livros baixados (nomes das pastas)
  getDownloadedBooks: async (): Promise<string[]> => {
    try {
      const dirInfo = await FileSystem.getInfoAsync(booksDir);
      if (!dirInfo.exists) return [];
      
      // Retorna a lista de nomes das pastas (que são os IDs dos livros)
      // Ex: ['book-123', 'book-456']
      const items = await FileSystem.readDirectoryAsync(booksDir);
      return items;
    } catch (error) {
      console.log("Erro ao ler diretório de livros:", error);
      return [];
    }
  },

  // Retorna a URI local para o Leitor
  getLocalBookUri: (bookId: string) => {
    return `${booksDir}${bookId}/book.epub`;
  },

  // Retorna a URI da capa local (se existir)
  getLocalCoverUri: (bookId: string) => {
    return `${booksDir}${bookId}/cover.jpg`;
  },

  // Remove o livro e sua pasta inteira (limpa epub + capa)
  deleteBook: async (bookId: string) => {
    try {
      const folderUri = `${booksDir}${bookId}/`;
      // 'idempotent: true' não gera erro se a pasta já não existir
      await FileSystem.deleteAsync(folderUri, { idempotent: true });
    } catch (error) {
      console.error("Erro ao deletar livro:", error);
    }
  },

  // DOWNLOAD ROBUSTO (Salva em pasta dedicada)
  downloadBook: async (
    filePath: string, 
    bookId: string, 
    onProgress: (progress: number) => void
  ) => {
    try {
      await fileManager.ensureDirExists();

      // 1. Prepara a pasta do livro específico (books/ID/)
      const bookFolder = `${booksDir}${bookId}/`;
      const folderInfo = await FileSystem.getInfoAsync(bookFolder);
      if (!folderInfo.exists) {
        await FileSystem.makeDirectoryAsync(bookFolder, { intermediates: true });
      }

      // 2. Tratamento da URL
      const fullUrl = filePath.startsWith('http') 
        ? filePath 
        : `${BASE_URL}${filePath.startsWith('/') ? '' : '/'}${filePath}`;

      const localUri = `${bookFolder}book.epub`;

      // 3. Download Resumível
      const downloadResumable = FileSystem.createDownloadResumable(
        fullUrl,
        localUri,
        {},
        (downloadProgress) => {
          const progress = (downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite) * 100;
          onProgress(progress);
        }
      );

      const result = await downloadResumable.downloadAsync();
      
      if (!result || result.status !== 200) {
        throw new Error("Download falhou ou arquivo inválido.");
      }

      return result.uri;
    } catch (error) {
      console.error("Erro no download:", error);
      // Remove a pasta suja se o download falhar para evitar "livros corrompidos"
      await fileManager.deleteBook(bookId);
      throw error;
    }
  }
};
import * as FileSystem from 'expo-file-system/legacy';

// URL base para montar o caminho dos arquivos (mesma da API)
const BASE_URL = 'https://readeek.vercel.app'; 

export const fileManager = {
  // Define o diretório onde os livros serão salvos
  booksDir: `${FileSystem.documentDirectory}books/`,

  // Garante que a pasta existe antes de qualquer operação
  ensureDirExists: async () => {
    const dirInfo = await FileSystem.getInfoAsync(fileManager.booksDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(fileManager.booksDir, { intermediates: true });
    }
  },

  // Verifica se o livro já foi baixado
  checkBookExists: async (bookId: string) => {
    const uri = `${fileManager.booksDir}${bookId}.epub`;
    const fileInfo = await FileSystem.getInfoAsync(uri);
    return fileInfo.exists;
  },

  // Retorna a URI local para o Leitor
  getLocalBookUri: (bookId: string) => {
    return `${fileManager.booksDir}${bookId}.epub`;
  },

  // DELETAR (Para limpar espaço)
  deleteBook: async (bookId: string) => {
    const uri = `${fileManager.booksDir}${bookId}.epub`;
    await FileSystem.deleteAsync(uri, { idempotent: true });
  },

  // DOWNLOAD (Corrigido e Robusto)
  downloadBook: async (
    filePath: string, 
    bookId: string, 
    onProgress: (progress: number) => void
  ) => {
    try {
      await fileManager.ensureDirExists();

      // Tratamento da URL: Se vier relativa (/uploads...), adiciona o domínio
      const fullUrl = filePath.startsWith('http') 
        ? filePath 
        : `${BASE_URL}${filePath.startsWith('/') ? '' : '/'}${filePath}`;

      const localUri = `${fileManager.booksDir}${bookId}.epub`;

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
      throw error; // Repassa o erro para o Dashboard tratar
    }
  }
};
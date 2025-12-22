// lib/files.ts
// MUDANÇA: Importamos do subcaminho /legacy para acessar os métodos antigos e estáveis
import * as FileSystem from 'expo-file-system/legacy';

const BOOKS_DIR = FileSystem.documentDirectory + 'books/';

// Garante que a pasta existe
const ensureDirExists = async () => {
  const dirInfo = await FileSystem.getInfoAsync(BOOKS_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(BOOKS_DIR, { intermediates: true });
  }
};

export const fileManager = {
  /**
   * Retorna o caminho local completo onde o livro deve ser salvo
   */
  getLocalBookUri: (bookId: string) => {
    return `${BOOKS_DIR}${bookId}.epub`;
  },

  /**
   * Verifica se o livro já foi baixado
   */
  checkBookExists: async (bookId: string) => {
    await ensureDirExists();
    const uri = `${BOOKS_DIR}${bookId}.epub`;
    const info = await FileSystem.getInfoAsync(uri);
    return info.exists;
  },

  /**
   * Baixa o livro e retorna a URI local
   */
  downloadBook: async (url: string, bookId: string, onProgress?: (progress: number) => void) => {
    await ensureDirExists();
    const localUri = `${BOOKS_DIR}${bookId}.epub`;

    const downloadResumable = FileSystem.createDownloadResumable(
      url,
      localUri,
      {},
      (downloadProgress) => {
        const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
        if (onProgress) onProgress(progress * 100);
      }
    );

    try {
      const result = await downloadResumable.downloadAsync();
      return result?.uri;
    } catch (e) {
      console.error("Erro no download:", e);
      throw e;
    }
  },

  /**
   * Remove um livro do armazenamento (para liberar espaço)
   */
  deleteBook: async (bookId: string) => {
    const uri = `${BOOKS_DIR}${bookId}.epub`;
    await FileSystem.deleteAsync(uri, { idempotent: true });
  }
};
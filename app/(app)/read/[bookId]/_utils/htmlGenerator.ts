// app/(app)/read/[bookId]/_utils/htmlGenerator.ts

import { Highlight } from "lib/api";

interface HtmlProps {
  bookBase64: string;
  initialLocation: string | null;
  highlights: Highlight[];
  theme: any;
  fontSize: number;
}

export const generateReaderHTML = ({
  bookBase64,
  initialLocation,
  highlights,
  theme,
  fontSize
}: HtmlProps) => {
  const safeHighlights = JSON.stringify(highlights || []);
  const safeTheme = JSON.stringify(theme);
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>
      <script src="https://cdn.jsdelivr.net/npm/epubjs@0.3.93/dist/epub.min.js"></script>
      <style>
        body { margin: 0; padding: 0; background-color: ${theme.bg}; height: 100vh; width: 100vw; overflow: hidden; }
        #viewer { width: 100%; height: 100%; touch-action: none; } /* touch-action previne zoom nativo do browser */
        ::selection { background: rgba(255, 235, 59, 0.5); }
      </style>
    </head>
    <body>
      <div id="viewer"></div>
      <script>
        const msg = (type, data) => window.ReactNativeWebView.postMessage(JSON.stringify({ type, ...data }));
        const log = (m) => msg('LOG', { msg: m });

        try {
            const bookData = "${bookBase64}";
            const initialCfi = ${initialLocation ? JSON.stringify(initialLocation) : 'null'};
            const savedHighlights = ${safeHighlights};
            const initialTheme = ${safeTheme};
            const initialFontSize = ${fontSize};

            function base64ToArrayBuffer(base64) {
                var binary_string = window.atob(base64);
                var len = binary_string.length;
                var bytes = new Uint8Array(len);
                for (var i = 0; i < len; i++) { bytes[i] = binary_string.charCodeAt(i); }
                return bytes.buffer;
            }

            const book = ePub(base64ToArrayBuffer(bookData));
            const rendition = book.renderTo("viewer", { width: "100%", height: "100%", flow: "paginated", manager: "default" });

            window.applyTheme = (style) => {
                rendition.themes.register('custom', { 
                    body: { color: style.text, background: style.bg, 'font-family': 'Helvetica, sans-serif' },
                    p: { 'line-height': '1.6 !important' } 
                });
                rendition.themes.select('custom');
                document.body.style.backgroundColor = style.bg;
            };

            window.setFontSize = (percent) => {
                rendition.themes.fontSize(percent + "%");
            };

            window.applyTheme(initialTheme);
            window.setFontSize(initialFontSize);

            book.ready.then(() => {
                const toc = book.navigation.toc.map(c => ({ label: c.label, href: c.href }));
                msg('TOC', { toc });
                return book.locations.generate(1000);
            });

            const displayPromise = initialCfi ? rendition.display(initialCfi) : rendition.display();

            displayPromise.then(() => {
                savedHighlights.forEach(h => {
                    rendition.annotations.add('highlight', h.cfiRange, {}, null, 'hl-' + h.id);
                });

                // --- SISTEMA DE TOQUE REFINADO (BUG FIX) ---
                let startX = 0;
                let startY = 0;
                let startTime = 0;

                rendition.on('touchstart', (e) => {
                    startX = e.changedTouches[0].clientX;
                    startY = e.changedTouches[0].clientY;
                    startTime = new Date().getTime();
                });

                rendition.on('touchend', (e) => {
                    const endX = e.changedTouches[0].clientX;
                    const endY = e.changedTouches[0].clientY;
                    const diffX = endX - startX;
                    const diffY = endY - startY;
                    const timeDiff = new Date().getTime() - startTime;

                    // Se moveu muito ou demorou muito, é arrasto/seleção, não clique
                    if (Math.abs(diffX) > 10 || Math.abs(diffY) > 10 || timeDiff > 500) return;

                    // Lógica de Zonas
                    const w = window.innerWidth;
                    
                    // Zona Central (Menu): 60% do centro
                    if (endX > w * 0.2 && endX < w * 0.8) {
                        msg('TOGGLE_UI', {});
                    } 
                    // Zona Direita (Próximo): 20% direita
                    else if (endX >= w * 0.8) {
                        rendition.next();
                    } 
                    // Zona Esquerda (Anterior): 20% esquerda
                    else if (endX <= w * 0.2) {
                        rendition.prev();
                    }
                });

                // Seleção de Texto
                rendition.on('selected', (cfiRange, contents) => {
                    book.getRange(cfiRange).then(range => {
                        msg('SELECTION', { cfiRange, text: range.toString() });
                    });
                    // Retorna true para permitir menu nativo se quiser, ou false para custom
                    return true;
                });

                rendition.on('markClicked', (cfiRange) => msg('HIGHLIGHT_CLICKED', { cfiRange }));
            });

            rendition.on("relocated", (location) => {
                let percent = 0;
                if(book.locations.length() > 0) percent = book.locations.percentageFromCfi(location.start.cfi);
                else if(location.start.percentage) percent = location.start.percentage;
                msg('LOC', { cfi: location.start.cfi, percentage: percent });
            });

            window.rendition = rendition;

        } catch (e) { log('Error: ' + e.message); }
      </script>
    </body>
    </html>
  `;
};
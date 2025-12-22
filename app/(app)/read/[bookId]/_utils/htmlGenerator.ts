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
  // Garante que os dados iniciais sejam seguros
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
        #viewer { width: 100%; height: 100%; }
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

            // Helpers
            function base64ToArrayBuffer(base64) {
                var binary_string = window.atob(base64);
                var len = binary_string.length;
                var bytes = new Uint8Array(len);
                for (var i = 0; i < len; i++) { bytes[i] = binary_string.charCodeAt(i); }
                return bytes.buffer;
            }

            // Init Logic
            const book = ePub(base64ToArrayBuffer(bookData));
            const rendition = book.renderTo("viewer", { width: "100%", height: "100%", flow: "paginated", manager: "default" });

            // Funções Globais para o React Native chamar
            window.applyTheme = (style) => {
                rendition.themes.register('custom', { 
                    body: { color: style.text, background: style.bg, 'font-family': 'Helvetica, sans-serif' },
                    p: { 'line-height': '1.6 !important' } 
                });
                rendition.themes.select('custom');
                document.body.style.backgroundColor = style.bg;
            };

            window.setFontSize = (percent) => {
                // O epub.js espera string com unidade
                rendition.themes.fontSize(percent + "%");
            };

            // Setup Inicial
            window.applyTheme(initialTheme);
            window.setFontSize(initialFontSize);

            book.ready.then(() => {
                // TOC
                const toc = book.navigation.toc.map(c => ({ label: c.label, href: c.href }));
                msg('TOC', { toc });
                return book.locations.generate(1000);
            });

            // Display
            const displayPromise = initialCfi ? rendition.display(initialCfi) : rendition.display();

            displayPromise.then(() => {
                // Highlights
                savedHighlights.forEach(h => {
                    rendition.annotations.add('highlight', h.cfiRange, {}, null, 'hl-' + h.id);
                });

                // Listeners
                rendition.on('selected', (cfiRange, contents) => {
                    book.getRange(cfiRange).then(range => {
                        msg('SELECTION', { cfiRange, text: range.toString() });
                    });
                    return true;
                });

                rendition.on('markClicked', (cfiRange) => msg('HIGHLIGHT_CLICKED', { cfiRange }));

                rendition.on('click', (e) => {
                    const w = window.innerWidth;
                    const x = e.clientX;
                    // Zonas de toque: 20% esq, 20% dir, resto centro
                    if (x > w * 0.8) rendition.next();
                    else if (x < w * 0.2) rendition.prev();
                    else msg('TOGGLE_UI', {});
                });
            });

            rendition.on("relocated", (location) => {
                let percent = 0;
                if(book.locations.length() > 0) percent = book.locations.percentageFromCfi(location.start.cfi);
                else if(location.start.percentage) percent = location.start.percentage;
                msg('LOC', { cfi: location.start.cfi, percentage: percent });
            });

            // Expor globalmente
            window.rendition = rendition;

        } catch (e) { log('Error: ' + e.message); }
      </script>
    </body>
    </html>
  `;
};
import { Highlight } from '../../../../../lib/api';

interface HtmlParams {
    bookBase64: string;
    initialLocation: string | null;
    highlights: Highlight[];
    theme: { bg: string; text: string };
    fontSize: number;
}

export const generateReaderHTML = ({ bookBase64, initialLocation, highlights, theme, fontSize }: HtmlParams) => {
    
    const highlightCSS = `
        .highlight-yellow { background-color: rgba(250, 204, 21, 0.4); border-bottom: 2px solid #facc15; }
        .highlight-green { background-color: rgba(74, 222, 128, 0.4); border-bottom: 2px solid #4ade80; }
        .highlight-blue { background-color: rgba(96, 165, 250, 0.4); border-bottom: 2px solid #60a5fa; }
        .highlight-purple { background-color: rgba(192, 132, 252, 0.4); border-bottom: 2px solid #c084fc; }
        .highlight-red { background-color: rgba(248, 113, 113, 0.4); border-bottom: 2px solid #f87171; }
        ::selection { background: rgba(99, 102, 241, 0.3); } 
    `;

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.1.5/jszip.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/epubjs/dist/epub.min.js"></script>
    <style>
        body { 
            margin: 0; padding: 0; 
            background-color: ${theme.bg}; color: ${theme.text};
            font-family: 'Georgia', 'Times New Roman', serif; /* Fonte serifada para conforto */
            height: 100vh; width: 100vw; overflow: hidden;
            -webkit-user-select: text; user-select: text; -webkit-touch-callout: none; 
        }
        #viewer { height: 100vh; width: 100vw; overflow: hidden; }
        
        /* Ajustes Globais para o Livro */
        p { 
            line-height: 1.6 !important; 
            text-align: justify !important;
            margin-bottom: 1em !important;
        }
        
        ${highlightCSS}
    </style>
</head>
<body>
    <div id="viewer"></div>
    <script>
        function base64ToArrayBuffer(base64) {
            var binary_string = window.atob(base64);
            var len = binary_string.length;
            var bytes = new Uint8Array(len);
            for (var i = 0; i < len; i++) { bytes[i] = binary_string.charCodeAt(i); }
            return bytes.buffer;
        }

        try {
            var bookData = base64ToArrayBuffer("${bookBase64}");
            var book = ePub(bookData);
            
            // Configurações de layout otimizadas
            var rendition = book.renderTo("viewer", { 
                width: "100%", 
                height: "100%", 
                flow: "paginated", 
                manager: "default",
                // Margens laterais para respiro
                stylesheet: "body { padding: 0 20px !important; }" 
            });

            var locationToLoad = "${initialLocation || ''}";
            if(locationToLoad && locationToLoad !== 'null') rendition.display(locationToLoad);
            else rendition.display();

            var themes = { fontSize: "${fontSize}%", body: { "color": "${theme.text}", "background": "${theme.bg}" } };
            rendition.themes.register("custom", themes);
            rendition.themes.select("custom");

            rendition.on('rendered', function(section) {
                var currentHighlights = ${JSON.stringify(highlights)};
                currentHighlights.forEach(function(hl) {
                    try {
                        var colorClass = 'highlight-' + (hl.color || 'yellow');
                        rendition.annotations.add('highlight', hl.cfiRange, {}, null, colorClass);
                    } catch(e) {}
                });

                rendition.on('selected', function(cfiRange, contents) {
                    book.getRange(cfiRange).then(function(range) {
                        if(range) {
                            var text = range.toString();
                            
                            // Calcula a posição Y da seleção (0 a 1, onde 0 é topo, 1 é base)
                            var rect = range.getBoundingClientRect();
                            var relativeY = rect.top / window.innerHeight;

                            window.ReactNativeWebView.postMessage(JSON.stringify({
                                type: 'SELECTION',
                                cfiRange: cfiRange,
                                text: text,
                                y: relativeY // Envia posição vertical
                            }));
                        }
                    });
                });
                
                rendition.on('markClicked', function(cfiRange, data, contents) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'HIGHLIGHT_CLICKED', cfiRange: cfiRange }));
                });
            });

            // ... (restante do código igual: click, relocated, TOC, functions) ...
            rendition.on('click', function(e, contents) {
                try {
                    var hasSelection = false;
                    if (contents && contents.window) {
                        var sel = contents.window.getSelection();
                        if (sel && sel.toString().length > 0) hasSelection = true;
                    }
                    if (hasSelection) return;
                    e.preventDefault();
                    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'TOGGLE_UI' }));
                } catch(err) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'TOGGLE_UI' }));
                }
            });

            rendition.on('relocated', function(location) {
                var percent = book.locations.percentageFromCfi(location.start.cfi);
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'LOC', cfi: location.start.cfi, percentage: percent }));
            });

            book.loaded.navigation.then(function(nav) {
                var tocArray = (nav && nav.toc) ? nav.toc : [];
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'TOC', toc: tocArray }));
            });

            window.setFontSize = function(size) { rendition.themes.fontSize(size + "%"); };
            
            window.applyTheme = function(theme) {
                rendition.themes.register("custom", { body: { "color": theme.text, "background": theme.bg } });
                rendition.themes.select("custom");
                document.body.style.backgroundColor = theme.bg;
                document.body.style.color = theme.text;
            };

            window.clearSelection = function() {
                var sel = window.getSelection();
                if(sel) sel.removeAllRanges();
                var frames = document.getElementsByTagName('iframe');
                for(var i=0; i<frames.length; i++) {
                    var frameSel = frames[i].contentWindow.getSelection();
                    if(frameSel) frameSel.removeAllRanges();
                }
            };

            window.book = book;
            window.rendition = rendition;

        } catch (error) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'LOG', msg: error.toString() }));
        }
    </script>
</body>
</html>
    `;
};
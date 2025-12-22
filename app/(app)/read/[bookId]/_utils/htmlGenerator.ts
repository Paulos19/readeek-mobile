import { Highlight } from 'lib/api';

interface HtmlParams {
    bookBase64: string;
    initialLocation: string | null;
    highlights: Highlight[];
    theme: { bg: string; text: string };
    fontSize: number;
}

export const generateReaderHTML = ({ bookBase64, initialLocation, highlights, theme, fontSize }: HtmlParams) => {
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
            margin: 0; 
            padding: 0; 
            background-color: ${theme.bg}; 
            color: ${theme.text};
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            height: 100vh;
            width: 100vw;
            overflow: hidden;
            -webkit-user-select: none; /* Melhora performance de gestos */
            user-select: none;
        }
        #viewer {
            height: 100vh;
            width: 100vw;
            overflow: hidden;
        }
        /* Estilos para Highlighting */
        .epubjs-hl-yellow { fill: yellow; fill-opacity: 0.3; mix-blend-mode: multiply; }
        .epubjs-hl-red { fill: #ffadad; fill-opacity: 0.3; mix-blend-mode: multiply; }
        .epubjs-hl-blue { fill: #a0c4ff; fill-opacity: 0.3; mix-blend-mode: multiply; }
        .epubjs-hl-green { fill: #9bf6ff; fill-opacity: 0.3; mix-blend-mode: multiply; }
    </style>
</head>
<body>
    <div id="viewer"></div>
    <script>
        // Inicialização Segura
        try {
            var book = ePub("data:application/epub+zip;base64,${bookBase64}");
            var rendition = book.renderTo("viewer", {
                width: "100%",
                height: "100%",
                flow: "paginated",
                manager: "default"
            });

            var locationToLoad = "${initialLocation || ''}";
            if(locationToLoad && locationToLoad !== 'null') {
                rendition.display(locationToLoad);
            } else {
                rendition.display();
            }

            var themes = { 
                fontSize: "${fontSize}%", 
                body: { 
                    "color": "${theme.text}", 
                    "background": "${theme.bg}" 
                } 
            };
            rendition.themes.register("custom", themes);
            rendition.themes.select("custom");

            // --- LISTENERS E INTERAÇÕES ---

            rendition.on('rendered', function(section) {
                // Carrega Highlights
                var currentHighlights = ${JSON.stringify(highlights)};
                currentHighlights.forEach(function(hl) {
                    try {
                        rendition.annotations.add('highlight', hl.cfiRange, {}, null, 'hl-' + hl.id);
                    } catch(e) {}
                });

                // Listener de Seleção (Texto)
                // Usa on 'selected' para capturar quando o usuário termina de selecionar
                rendition.on('selected', function(cfiRange, contents) {
                    rendition.getRange(cfiRange).then(function(range) {
                        if(range) {
                            var text = range.toString();
                            window.ReactNativeWebView.postMessage(JSON.stringify({
                                type: 'SELECTION',
                                cfiRange: cfiRange,
                                text: text
                            }));
                        }
                    });
                    // Limpa a seleção visual nativa para evitar artefatos
                    if(contents && contents.window) {
                        contents.window.getSelection().removeAllRanges();
                    }
                });
                
                // Clique em Marcadores
                rendition.on('markClicked', function(cfiRange, data, contents) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'HIGHLIGHT_CLICKED', cfiRange: cfiRange }));
                });
            });

            // --- GESTÃO DE CLIQUES E MENU (Correção Crítica) ---
            rendition.on('click', function(e, contents) {
                try {
                    // Verifica se há seleção de texto ativa
                    var hasSelection = false;
                    if (contents && contents.window) {
                        var sel = contents.window.getSelection();
                        if (sel && sel.toString().length > 0) hasSelection = true;
                    }

                    // Se tiver texto selecionado, não faz nada (deixa o menu de seleção aparecer)
                    if (hasSelection) return;

                    // Bloqueia a navegação padrão do Epub.js
                    e.preventDefault();
                    
                    // Envia sinal para o React Native abrir/fechar o menu
                    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'TOGGLE_UI' }));
                } catch(err) {
                    // Fallback em caso de erro bizarro, tenta abrir o menu
                    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'TOGGLE_UI' }));
                }
            });

            // --- OUTROS EVENTOS ---
            rendition.on('relocated', function(location) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'LOC',
                    cfi: location.start.cfi,
                    percentage: location.start.percentage
                }));
            });

            book.loaded.navigation.then(function(toc) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'TOC',
                    toc: toc
                }));
            });

            // --- FUNÇÕES INJETADAS ---
            window.setFontSize = function(size) {
                rendition.themes.fontSize(size + "%");
            };

            window.applyTheme = function(theme) {
                rendition.themes.register("custom", { 
                    body: { "color": theme.text, "background": theme.bg } 
                });
                rendition.themes.select("custom");
                document.body.style.backgroundColor = theme.bg;
                document.body.style.color = theme.text;
            };

        } catch (error) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'LOG', msg: error.toString() }));
        }
    </script>
</body>
</html>
    `;
};
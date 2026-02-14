<?php
/**
 * Script para generar PDFs de ejemplo: Catálogo y Lista de Precios.
 * Ejecutar una sola vez: php generate_pdfs.php
 */

class SimplePDF {
    private $objects = [];
    private $pages = [];
    private $currentPage = '';
    private $yPos = 750;
    private $pageWidth = 595;
    private $fontSize = 12;

    public function addPage() {
        if ($this->currentPage !== '') {
            $this->pages[] = $this->currentPage;
        }
        $this->currentPage = '';
        $this->yPos = 750;
    }

    public function setFontSize($size) {
        $this->fontSize = $size;
    }

    public function addText($text, $x = 50) {
        $this->currentPage .= sprintf("BT /F1 %d Tf %d %d Td (%s) Tj ET\n",
            $this->fontSize, $x, $this->yPos, $this->escapeText($text));
        $this->yPos -= ($this->fontSize + 6);
    }

    public function addCenteredText($text) {
        $approxWidth = strlen($text) * $this->fontSize * 0.5;
        $x = max(50, ($this->pageWidth - $approxWidth) / 2);
        $this->addText($text, (int)$x);
    }

    public function addLine() {
        $this->currentPage .= sprintf("%.2f %.2f m %.2f %.2f l S\n",
            50.0, $this->yPos + 5, 545.0, $this->yPos + 5);
        $this->yPos -= 15;
    }

    public function addSpace($pixels = 20) {
        $this->yPos -= $pixels;
    }

    private function escapeText($text) {
        // Replace special PDF characters and convert UTF-8 to Latin-1 approximation
        $text = str_replace(['\\', '(', ')'], ['\\\\', '\\(', '\\)'], $text);
        $text = str_replace(
            ['á', 'é', 'í', 'ó', 'ú', 'ñ', 'Á', 'É', 'Í', 'Ó', 'Ú', 'Ñ', '¡', '¿'],
            ['\341', '\351', '\355', '\363', '\372', '\361', '\301', '\311', '\315', '\323', '\332', '\321', '\241', '\277'],
            $text
        );
        return $text;
    }

    public function save($filename) {
        if ($this->currentPage !== '') {
            $this->pages[] = $this->currentPage;
        }

        $output = "%PDF-1.4\n";
        $offsets = [];

        // Object 1: Catalog
        $offsets[] = strlen($output);
        $output .= "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n";

        // Object 2: Pages
        $kids = '';
        for ($i = 0; $i < count($this->pages); $i++) {
            $kids .= (3 + $i * 2) . " 0 R ";
        }
        $offsets[] = strlen($output);
        $output .= "2 0 obj\n<< /Type /Pages /Kids [" . trim($kids) . "] /Count " . count($this->pages) . " >>\nendobj\n";

        $objNum = 3;
        foreach ($this->pages as $pageContent) {
            // Page object
            $contentObjNum = $objNum + 1;
            $offsets[] = strlen($output);
            $output .= "$objNum 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] ";
            $output .= "/Contents $contentObjNum 0 R ";
            $output .= "/Resources << /Font << /F1 " . (3 + count($this->pages) * 2) . " 0 R >> >> >>\nendobj\n";
            $objNum++;

            // Content stream
            $offsets[] = strlen($output);
            $stream = $pageContent;
            $output .= "$objNum 0 obj\n<< /Length " . strlen($stream) . " >>\nstream\n" . $stream . "endstream\nendobj\n";
            $objNum++;
        }

        // Font object
        $offsets[] = strlen($output);
        $output .= "$objNum 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj\n";
        $objNum++;

        // Cross-reference table
        $xrefOffset = strlen($output);
        $output .= "xref\n0 $objNum\n";
        $output .= "0000000000 65535 f \n";
        foreach ($offsets as $offset) {
            $output .= sprintf("%010d 00000 n \n", $offset);
        }

        // Trailer
        $output .= "trailer\n<< /Size $objNum /Root 1 0 R >>\nstartxref\n$xrefOffset\n%%EOF\n";

        file_put_contents($filename, $output);
        echo "PDF generado: $filename (" . strlen($output) . " bytes)\n";
    }
}

// ============================================================
// CATÁLOGO PDF
// ============================================================
$cat = new SimplePDF();
$cat->addPage();

$cat->setFontSize(28);
$cat->addCenteredText('Chat PDF');
$cat->addSpace(10);
$cat->setFontSize(20);
$cat->addCenteredText('Catalogo de Productos');
$cat->addSpace(5);
$cat->addLine();
$cat->addSpace(10);

$cat->setFontSize(14);
$cat->addText('Bienvenido a nuestro catalogo de productos y servicios.');
$cat->addText('Aqui encontraras toda la informacion que necesitas.');
$cat->addSpace(20);

$cat->setFontSize(16);
$cat->addText('Producto 1: Servicio Premium');
$cat->setFontSize(12);
$cat->addText('   - Acceso completo a todas las funciones');
$cat->addText('   - Soporte prioritario 24/7');
$cat->addText('   - Actualizaciones gratuitas');
$cat->addText('   - Precio: $99.99 USD/mes');
$cat->addSpace(15);

$cat->setFontSize(16);
$cat->addText('Producto 2: Servicio Basico');
$cat->setFontSize(12);
$cat->addText('   - Funciones esenciales incluidas');
$cat->addText('   - Soporte por email');
$cat->addText('   - Precio: $29.99 USD/mes');
$cat->addSpace(15);

$cat->setFontSize(16);
$cat->addText('Producto 3: Servicio Empresarial');
$cat->setFontSize(12);
$cat->addText('   - Todo lo del plan Premium');
$cat->addText('   - Integraciones personalizadas');
$cat->addText('   - Gestor de cuenta dedicado');
$cat->addText('   - Precio: Consultar');
$cat->addSpace(30);

$cat->addLine();
$cat->setFontSize(10);
$cat->addText('Contacto: info@chatpdf.com | WhatsApp: +1 555 145 3837');
$cat->addText('Este catalogo es de ejemplo y puede ser personalizado.');

$cat->save(__DIR__ . '/Catalogo_ChatPDF.pdf');

// ============================================================
// LISTA DE PRECIOS PDF
// ============================================================
$prices = new SimplePDF();
$prices->addPage();

$prices->setFontSize(28);
$prices->addCenteredText('Chat PDF');
$prices->addSpace(10);
$prices->setFontSize(20);
$prices->addCenteredText('Lista de Precios 2024');
$prices->addSpace(5);
$prices->addLine();
$prices->addSpace(10);

$prices->setFontSize(14);
$prices->addText('Precios vigentes - Todos los precios en USD');
$prices->addSpace(15);

$prices->setFontSize(14);
$prices->addText('PLANES MENSUALES');
$prices->addLine();
$prices->setFontSize(12);
$prices->addSpace(5);
$prices->addText('Plan Basico .......................... $29.99/mes');
$prices->addText('Plan Premium ......................... $99.99/mes');
$prices->addText('Plan Empresarial ..................... Consultar');
$prices->addSpace(20);

$prices->setFontSize(14);
$prices->addText('PLANES ANUALES (20% descuento)');
$prices->addLine();
$prices->setFontSize(12);
$prices->addSpace(5);
$prices->addText('Plan Basico Anual .................... $287.90/anio');
$prices->addText('Plan Premium Anual ................... $959.90/anio');
$prices->addText('Plan Empresarial Anual ............... Consultar');
$prices->addSpace(20);

$prices->setFontSize(14);
$prices->addText('SERVICIOS ADICIONALES');
$prices->addLine();
$prices->setFontSize(12);
$prices->addSpace(5);
$prices->addText('Configuracion inicial ................ $49.99');
$prices->addText('Capacitacion (por hora) .............. $75.00');
$prices->addText('Soporte extendido .................... $19.99/mes');
$prices->addText('Integracion personalizada ............ Desde $199.99');
$prices->addSpace(30);

$prices->addLine();
$prices->setFontSize(10);
$prices->addText('* Precios sujetos a cambios sin previo aviso.');
$prices->addText('* Consulte por descuentos especiales para grupos.');
$prices->addText('Contacto: info@chatpdf.com | WhatsApp: +1 555 145 3837');

$prices->save(__DIR__ . '/Precios_ChatPDF.pdf');

echo "\n¡PDFs generados exitosamente!\n";

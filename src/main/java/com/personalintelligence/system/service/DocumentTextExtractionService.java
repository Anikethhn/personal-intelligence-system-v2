package com.personalintelligence.system.service;

import net.sourceforge.tess4j.Tesseract;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

@Service
public class DocumentTextExtractionService {

    @Value("${pids.documents.ocr.tessdata-path}")
    private String tessdataPath;

    public String extractText(
            InputStream inputStream,
            String filename,
            String contentType) {

        try {
            if ("application/pdf".equalsIgnoreCase(contentType)) {
                return extractPdf(inputStream);
            }

            if ("application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    .equalsIgnoreCase(contentType)) {
                return extractDocx(inputStream);
            }

            if ("text/plain".equalsIgnoreCase(contentType)) {
                return extractTxt(inputStream);
            }

            if ("image/png".equalsIgnoreCase(contentType)
                    || "image/jpeg".equalsIgnoreCase(contentType)
                    || "image/jpg".equalsIgnoreCase(contentType)) {
                return extractImage(inputStream);
            }

            throw new RuntimeException("Unsupported document type: " + contentType);

        } catch (Exception e) {
            throw new RuntimeException(
                    "Failed to extract text from document: " + filename,
                    e
            );
        }
    }

    private String extractPdf(InputStream inputStream) throws Exception {

        byte[] bytes = inputStream.readAllBytes();

        try (PDDocument document = Loader.loadPDF(bytes)) {

            PDFTextStripper stripper = new PDFTextStripper();

            String text = cleanText(
                    stripper.getText(document)
            );

            if (!text.isBlank()) {
                return text;
            }

            return extractPdfWithOcr(document);
        }
    }

    private String extractPdfWithOcr(
            PDDocument document) throws Exception {

        PDFRenderer renderer = new PDFRenderer(document);

        StringBuilder extractedText = new StringBuilder();

        for (int page = 0;
             page < document.getNumberOfPages();
             page++) {

            BufferedImage image =
                    renderer.renderImageWithDPI(page, 300);

            String pageText =
                    performOcrWithPreprocessing(image);

            if (!pageText.isBlank()) {
                extractedText
                        .append(pageText)
                        .append("\n");
            }
        }

        return cleanText(
                extractedText.toString()
        );
    }

    private String extractDocx(
            InputStream inputStream) throws Exception {

        try (XWPFDocument document =
                     new XWPFDocument(inputStream)) {

            StringBuilder text =
                    new StringBuilder();

            document.getParagraphs().forEach(
                    paragraph -> {

                        String paragraphText =
                                paragraph.getText();

                        if (paragraphText != null
                                && !paragraphText.isBlank()) {

                            text.append(paragraphText);
                            text.append("\n");
                        }
                    }
            );

            document.getTables().forEach(
                    table ->
                            table.getRows().forEach(
                                    row ->
                                            row.getTableCells().forEach(
                                                    cell -> {

                                                        String cellText =
                                                                cell.getText();

                                                        if (cellText != null
                                                                && !cellText.isBlank()) {

                                                            text.append(cellText);
                                                            text.append("\n");
                                                        }
                                                    }
                                            )
                            )
            );

            return cleanText(
                    text.toString()
            );
        }
    }

    private String extractTxt(
            InputStream inputStream) throws Exception {

        String text =
                new String(
                        inputStream.readAllBytes(),
                        StandardCharsets.UTF_8
                );

        return cleanText(text);
    }

    private String extractImage(
            InputStream inputStream) throws Exception {

        BufferedImage originalImage =
                ImageIO.read(inputStream);

        if (originalImage == null) {
            throw new RuntimeException(
                    "Unable to read image"
            );
        }

        return performOcrWithPreprocessing(
                originalImage
        );
    }

    private String performOcrWithPreprocessing(
            BufferedImage originalImage) throws Exception {

        BufferedImage resized =
                resizeImage(originalImage);

        BufferedImage grayscale =
                convertToGrayscale(resized);

        BufferedImage enhanced =
                enhanceContrast(grayscale);

        String result1 =
                runTesseract(
                        enhanced,
                        6
                );

        String result2 =
                runTesseract(
                        enhanced,
                        11
                );

        String result3 =
                runTesseract(
                        grayscale,
                        3
                );

        return selectBestResult(
                result1,
                result2,
                result3
        );
    }

    private BufferedImage resizeImage(
            BufferedImage image) {

        int originalWidth =
                image.getWidth();

        int originalHeight =
                image.getHeight();

        if (originalWidth >= 2000) {
            return image;
        }

        int targetWidth = 2000;

        double scale =
                (double) targetWidth
                        / originalWidth;

        int targetHeight =
                (int) (
                        originalHeight * scale
                );

        BufferedImage resized =
                new BufferedImage(
                        targetWidth,
                        targetHeight,
                        BufferedImage.TYPE_INT_RGB
                );

        Graphics2D graphics =
                resized.createGraphics();

        graphics.setRenderingHint(
                RenderingHints.KEY_INTERPOLATION,
                RenderingHints.VALUE_INTERPOLATION_BICUBIC
        );

        graphics.setRenderingHint(
                RenderingHints.KEY_RENDERING,
                RenderingHints.VALUE_RENDER_QUALITY
        );

        graphics.drawImage(
                image,
                0,
                0,
                targetWidth,
                targetHeight,
                null
        );

        graphics.dispose();

        return resized;
    }

    private BufferedImage convertToGrayscale(
            BufferedImage image) {

        BufferedImage grayscale =
                new BufferedImage(
                        image.getWidth(),
                        image.getHeight(),
                        BufferedImage.TYPE_BYTE_GRAY
                );

        Graphics2D graphics =
                grayscale.createGraphics();

        graphics.drawImage(
                image,
                0,
                0,
                null
        );

        graphics.dispose();

        return grayscale;
    }

    private BufferedImage enhanceContrast(
            BufferedImage image) {

        BufferedImage enhanced =
                new BufferedImage(
                        image.getWidth(),
                        image.getHeight(),
                        BufferedImage.TYPE_BYTE_GRAY
                );

        for (int y = 0;
             y < image.getHeight();
             y++) {

            for (int x = 0;
                 x < image.getWidth();
                 x++) {

                int value =
                        image.getRaster()
                                .getSample(x, y, 0);

                int enhancedValue;

                if (value < 100) {
                    enhancedValue = 0;
                } else if (value > 180) {
                    enhancedValue = 255;
                } else {
                    enhancedValue =
                            (value - 100)
                                    * 255
                                    / 80;
                }

                enhanced.getRaster()
                        .setSample(
                                x,
                                y,
                                0,
                                enhancedValue
                        );
            }
        }

        return enhanced;
    }

    private String runTesseract(
            BufferedImage image,
            int pageSegmentationMode)
            throws Exception {

        Tesseract tesseract =
                new Tesseract();

        tesseract.setDatapath(
                tessdataPath
        );

        tesseract.setLanguage(
                "eng"
        );

        tesseract.setPageSegMode(
                pageSegmentationMode
        );

        tesseract.setOcrEngineMode(1);

        String text =
                tesseract.doOCR(image);

        return cleanText(text);
    }

    private String selectBestResult(
            String result1,
            String result2,
            String result3) {

        String best = result1;

        if (score(result2) > score(best)) {
            best = result2;
        }

        if (score(result3) > score(best)) {
            best = result3;
        }

        return best;
    }

    private int score(String text) {

        if (text == null || text.isBlank()) {
            return 0;
        }

        int score = 0;

        String[] words =
                text.split("\\s+");

        for (String word : words) {

            if (word.matches(
                    "[A-Za-z][A-Za-z0-9.,:'()/-]*"
            )) {
                score += 2;
            }

            if (word.length() >= 2) {
                score++;
            }
        }

        int letters = 0;
        int symbols = 0;

        for (char character :
                text.toCharArray()) {

            if (Character.isLetter(character)) {
                letters++;
            }

            if ("—_*=~^|<>".indexOf(character) >= 0) {
                symbols++;
            }
        }

        score += letters;
        score -= symbols * 2;

        return Math.max(score, 0);
    }

    private String cleanText(String text) {

        if (text == null) {
            return "";
        }

        text = text
                .replace("\r", " ")
                .replace("\n", " ")
                .replace("\t", " ")
                .replaceAll("\\s+", " ")
                .trim();

        text = text.replaceAll(
                "(?<![A-Za-z0-9])[_|~^*=<>]+(?![A-Za-z0-9])",
                " "
        );

        return text
                .replaceAll("\\s+", " ")
                .trim();
    }
}
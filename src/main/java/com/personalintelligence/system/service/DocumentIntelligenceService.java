package com.personalintelligence.system.service;

import com.personalintelligence.system.entity.Document;
import com.personalintelligence.system.entity.DocumentIntelligence;
import com.personalintelligence.system.repository.DocumentIntelligenceRepository;
import com.personalintelligence.system.repository.DocumentRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class DocumentIntelligenceService {

    private final DocumentIntelligenceRepository intelligenceRepository;
    private final DocumentRepository documentRepository;

    private static final Set<String> STOP_WORDS = Set.of(
            "a", "an", "the", "and", "or", "but", "if", "then",
            "than", "that", "this", "these", "those", "is", "are",
            "was", "were", "be", "been", "being", "to", "of",
            "in", "on", "for", "from", "with", "by", "as", "at",
            "it", "its", "into", "about", "over", "after", "before",
            "during", "through", "between", "under", "above", "below",
            "up", "down", "out", "off", "not", "no", "nor", "can",
            "could", "should", "would", "will", "may", "might",
            "must", "do", "does", "did", "have", "has", "had",
            "having", "i", "me", "my", "mine", "we", "our", "ours",
            "you", "your", "yours", "he", "his", "she", "her",
            "they", "their", "them", "there", "here", "which",
            "who", "whom", "what", "when", "where", "why", "how",
            "all", "any", "both", "each", "few", "more", "most",
            "other", "some", "such", "only", "own", "same", "so",
            "too", "very", "also", "just", "document", "page",
            "using", "used", "use", "work", "working", "works",
            "one", "two", "three", "four", "five", "six", "seven",
            "eight", "nine", "ten"
    );

    private static final List<String> ORGANIZATION_SUFFIXES = List.of(
            "university",
            "college",
            "school",
            "institute",
            "institution",
            "company",
            "corporation",
            "corporate",
            "ltd",
            "limited",
            "llp",
            "pvt",
            "private",
            "technologies",
            "technology",
            "solutions",
            "systems",
            "industries",
            "bank",
            "hospital",
            "laboratory",
            "labs",
            "foundation",
            "association",
            "organization",
            "organisation"
    );

    private static final List<String> RESUME_KEYWORDS = List.of(
            "resume",
            "cv",
            "curriculum vitae",
            "objective",
            "career objective",
            "professional summary",
            "profile",
            "education",
            "academic qualification",
            "technical skills",
            "skills",
            "experience",
            "work experience",
            "employment",
            "internship",
            "projects",
            "certifications",
            "certification",
            "achievements",
            "languages",
            "references",
            "career"
    );

    private static final List<String> INVOICE_KEYWORDS = List.of(
            "invoice",
            "invoice number",
            "invoice no",
            "bill",
            "bill number",
            "billing",
            "subtotal",
            "tax",
            "gst",
            "igst",
            "cgst",
            "sgst",
            "total amount",
            "amount due",
            "balance due",
            "payment due",
            "due date",
            "quantity",
            "unit price",
            "price",
            "purchase order",
            "po number"
    );

    private static final List<String> ACADEMIC_KEYWORDS = List.of(
            "academic",
            "marksheet",
            "mark sheet",
            "marks",
            "grade",
            "grades",
            "semester",
            "examination",
            "exam",
            "university",
            "college",
            "school",
            "student",
            "bachelor",
            "master",
            "degree",
            "b.tech",
            "b.e",
            "m.tech",
            "m.e",
            "phd",
            "cgpa",
            "percentage",
            "transcript",
            "course",
            "subject",
            "academic year",
            "result",
            "results"
    );

    private static final List<String> CERTIFICATE_KEYWORDS = List.of(
            "certificate",
            "certification",
            "certify",
            "certifies",
            "certified",
            "has successfully completed",
            "successfully completed",
            "completion",
            "course completion",
            "credential",
            "achievement",
            "issued to",
            "this is to certify"
    );

    private static final List<String> FINANCIAL_KEYWORDS = List.of(
            "bank statement",
            "bank account",
            "account statement",
            "transaction",
            "transactions",
            "opening balance",
            "closing balance",
            "available balance",
            "credit",
            "debit",
            "deposit",
            "withdrawal",
            "transfer",
            "interest",
            "bank",
            "ifsc",
            "account number",
            "statement period",
            "financial",
            "finance",
            "loan",
            "emi",
            "investment",
            "mutual fund",
            "balance"
    );

    private static final List<String> LEGAL_KEYWORDS = List.of(
            "legal",
            "agreement",
            "contract",
            "terms and conditions",
            "terms of service",
            "clause",
            "party",
            "parties",
            "whereas",
            "hereby",
            "thereof",
            "therein",
            "jurisdiction",
            "court",
            "law",
            "legal notice",
            "affidavit",
            "deed",
            "lease agreement",
            "employment agreement",
            "signature",
            "witness",
            "attorney",
            "advocate",
            "plaintiff",
            "defendant"
    );

    public DocumentIntelligenceService(
            DocumentIntelligenceRepository intelligenceRepository,
            DocumentRepository documentRepository) {

        this.intelligenceRepository = intelligenceRepository;
        this.documentRepository = documentRepository;
    }

    @Transactional
    public DocumentIntelligence processDocument(
            Document document,
            String extractedText) {

        if (document == null) {
            throw new IllegalArgumentException(
                    "Document cannot be null"
            );
        }

        if (extractedText == null) {
            extractedText = "";
        }

        String cleanedText =
                cleanText(extractedText);

        String detectedCategory =
                classifyDocument(
                        document,
                        cleanedText
                );

        if (document.getCategory() == null
                || document.getCategory().isBlank()
                || "General".equalsIgnoreCase(document.getCategory())
                || "OTHER".equalsIgnoreCase(document.getCategory())) {

            document.setCategory(detectedCategory);
            documentRepository.save(document);
        }

        DocumentIntelligence intelligence =
                intelligenceRepository
                        .findByDocumentId(document.getId())
                        .orElseGet(
                                DocumentIntelligence::new
                        );

        intelligence.setDocument(document);

        intelligence.setExtractedText(
                cleanedText
        );

        intelligence.setSummary(
                generateSummary(cleanedText)
        );

        intelligence.setKeywords(
                extractKeywords(cleanedText)
        );

        intelligence.setExtractedDates(
                extractDates(cleanedText)
        );

        intelligence.setExtractedAmounts(
                extractAmounts(cleanedText)
        );

        intelligence.setExtractedNames(
                extractNames(cleanedText)
        );

        intelligence.setExtractedOrganizations(
                extractOrganizations(cleanedText)
        );

        intelligence.setProcessedAt(
                LocalDateTime.now()
        );

        return intelligenceRepository.save(
                intelligence
        );
    }

    private String cleanText(String text) {

        if (text == null || text.isBlank()) {
            return "";
        }

        return text
                .replace("\r", " ")
                .replace("\n", " ")
                .replace("\t", " ")
                .replaceAll("\\s+", " ")
                .trim();
    }

    private String classifyDocument(
            Document document,
            String text) {

        String filename =
                document.getOriginalFilename() == null
                        ? ""
                        : document.getOriginalFilename()
                        .toLowerCase(Locale.ROOT);

        String lowerText =
                text.toLowerCase(Locale.ROOT);

        if (filename.contains("resume")
                || filename.contains("cv")
                || filename.contains("curriculum")) {

            return "RESUME";
        }

        if (filename.contains("invoice")
                || filename.contains("bill")) {

            return "INVOICE";
        }

        if (filename.contains("marksheet")
                || filename.contains("mark_sheet")
                || filename.contains("transcript")
                || filename.contains("result")) {

            return "ACADEMIC";
        }

        if (filename.contains("certificate")
                || filename.contains("certification")) {

            return "CERTIFICATE";
        }

        if (filename.contains("bank")
                || filename.contains("statement")
                || filename.contains("financial")) {

            return "FINANCIAL";
        }

        if (filename.contains("legal")
                || filename.contains("agreement")
                || filename.contains("contract")
                || filename.contains("affidavit")
                || filename.contains("deed")) {

            return "LEGAL";
        }

        Map<String, Integer> scores =
                new LinkedHashMap<>();

        scores.put(
                "RESUME",
                calculateScore(
                        lowerText,
                        RESUME_KEYWORDS
                )
        );

        scores.put(
                "INVOICE",
                calculateScore(
                        lowerText,
                        INVOICE_KEYWORDS
                )
        );

        scores.put(
                "ACADEMIC",
                calculateScore(
                        lowerText,
                        ACADEMIC_KEYWORDS
                )
        );

        scores.put(
                "CERTIFICATE",
                calculateScore(
                        lowerText,
                        CERTIFICATE_KEYWORDS
                )
        );

        scores.put(
                "FINANCIAL",
                calculateScore(
                        lowerText,
                        FINANCIAL_KEYWORDS
                )
        );

        scores.put(
                "LEGAL",
                calculateScore(
                        lowerText,
                        LEGAL_KEYWORDS
                )
        );

        String bestCategory = "OTHER";
        int bestScore = 0;

        for (Map.Entry<String, Integer> entry :
                scores.entrySet()) {

            if (entry.getValue() > bestScore) {
                bestScore =
                        entry.getValue();

                bestCategory =
                        entry.getKey();
            }
        }

        return bestCategory;
    }

    private int calculateScore(
            String text,
            List<String> keywords) {

        int score = 0;

        for (String keyword : keywords) {

            if (keyword == null ||
                    keyword.isBlank()) {
                continue;
            }

            String normalizedKeyword =
                    keyword.toLowerCase(
                            Locale.ROOT
                    );

            int occurrences =
                    countOccurrences(
                            text,
                            normalizedKeyword
                    );

            if (occurrences > 0) {

                int weight =
                        normalizedKeyword.contains(" ")
                                ? 3
                                : 1;

                score +=
                        occurrences * weight;
            }
        }

        return score;
    }

    private int countOccurrences(
            String text,
            String keyword) {

        int count = 0;
        int index = 0;

        while ((index =
                text.indexOf(
                        keyword,
                        index
                )) != -1) {

            count++;
            index += keyword.length();
        }

        return count;
    }

    private String generateSummary(String text) {

        if (text == null || text.isBlank()) {
            return "No text could be extracted from this document.";
        }

        String normalized =
                text.replaceAll(
                        "\\s+",
                        " "
                ).trim();

        if (normalized.length() <= 700) {
            return normalized;
        }

        String[] sentences =
                normalized.split(
                        "(?<=[.!?])\\s+"
                );

        StringBuilder summary =
                new StringBuilder();

        for (String sentence : sentences) {

            if (sentence.isBlank()) {
                continue;
            }

            if (summary.length() > 0) {
                summary.append(" ");
            }

            summary.append(
                    sentence.trim()
            );

            if (summary.length() >= 700) {
                break;
            }
        }

        if (summary.length() == 0) {
            return normalized.substring(
                    0,
                    Math.min(
                            700,
                            normalized.length()
                    )
            );
        }

        return summary.toString();
    }

    private String extractKeywords(String text) {

        if (text == null || text.isBlank()) {
            return "";
        }

        String normalized =
                text.toLowerCase(
                        Locale.ROOT
                );

        String[] words =
                normalized.split(
                        "[^a-zA-Z0-9+#.]+"
                );

        Map<String, Integer> frequency =
                new HashMap<>();

        for (String word : words) {

            if (word == null ||
                    word.isBlank()) {
                continue;
            }

            String cleaned =
                    word.trim();

            if (cleaned.length() < 3) {
                continue;
            }

            if (STOP_WORDS.contains(cleaned)) {
                continue;
            }

            if (cleaned.matches("\\d+")) {
                continue;
            }

            frequency.put(
                    cleaned,
                    frequency.getOrDefault(
                            cleaned,
                            0
                    ) + 1
            );
        }

        return frequency.entrySet()
                .stream()
                .sorted(
                        Map.Entry
                                .<String, Integer>comparingByValue()
                                .reversed()
                                .thenComparing(
                                        Map.Entry::getKey
                                )
                )
                .limit(20)
                .map(Map.Entry::getKey)
                .collect(
                        Collectors.joining(", ")
                );
    }

    private String extractDates(String text) {

        if (text == null || text.isBlank()) {
            return "";
        }

        Set<String> dates =
                new LinkedHashSet<>();

        Pattern pattern =
                Pattern.compile(
                        "\\b(?:"
                                + "\\d{1,2}[/-]\\d{1,2}[/-]\\d{2,4}"
                                + "|"
                                + "\\d{4}[/-]\\d{1,2}[/-]\\d{1,2}"
                                + "|"
                                + "\\d{1,2}\\s+"
                                + "(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)"
                                + "\\w*\\s+\\d{2,4}"
                                + "|"
                                + "(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)"
                                + "\\w*\\s+\\d{1,2},?\\s+\\d{2,4}"
                                + "|"
                                + "\\b(?:19|20)\\d{2}\\b"
                                + ")",
                        Pattern.CASE_INSENSITIVE
                );

        Matcher matcher =
                pattern.matcher(text);

        while (matcher.find()) {

            String value =
                    matcher.group().trim();

            if (!value.isBlank()) {
                dates.add(value);
            }
        }

        return String.join(
                ", ",
                dates
        );
    }

    private String extractAmounts(String text) {

        if (text == null || text.isBlank()) {
            return "";
        }

        Set<String> amounts =
                new LinkedHashSet<>();

        Pattern pattern =
                Pattern.compile(
                        "(?i)(?:"
                                + "(?:₹|rs\\.?|inr)\\s*"
                                + "\\d{1,3}(?:,\\d{3})*(?:\\.\\d{1,2})?"
                                + "|"
                                + "\\$\\s*"
                                + "\\d{1,3}(?:,\\d{3})*(?:\\.\\d{1,2})?"
                                + "|"
                                + "€\\s*"
                                + "\\d{1,3}(?:,\\d{3})*(?:\\.\\d{1,2})?"
                                + "|"
                                + "£\\s*"
                                + "\\d{1,3}(?:,\\d{3})*(?:\\.\\d{1,2})?"
                                + "|"
                                + "\\b\\d{1,3}(?:,\\d{3})*(?:\\.\\d{1,2})?\\s*(?:INR|USD|EUR|GBP)\\b"
                                + ")"
                );

        Matcher matcher =
                pattern.matcher(text);

        while (matcher.find()) {

            String value =
                    matcher.group().trim();

            if (!value.isBlank()) {
                amounts.add(value);
            }
        }

        return String.join(
                ", ",
                amounts
        );
    }

    private String extractNames(String text) {

        if (text == null || text.isBlank()) {
            return "";
        }

        Set<String> names =
                new LinkedHashSet<>();

        Pattern pattern =
                Pattern.compile(
                        "\\b[A-Z][a-zA-Z.'-]{1,30}"
                                + "(?:\\s+[A-Z][a-zA-Z.'-]{1,30}){1,3}\\b"
                );

        Matcher matcher =
                pattern.matcher(text);

        while (matcher.find()) {

            String name =
                    matcher.group().trim();

            if (isLikelyGarbageName(name)) {
                continue;
            }

            names.add(name);

            if (names.size() >= 20) {
                break;
            }
        }

        return String.join(
                ", ",
                names
        );
    }

    private boolean isLikelyGarbageName(
            String value) {

        if (value == null || value.isBlank()) {
            return true;
        }

        String lower =
                value.toLowerCase(
                        Locale.ROOT
                );

        List<String> garbage =
                List.of(
                        "computer science",
                        "present pre",
                        "higher secondary examination",
                        "automation libraries",
                        "spring boot",
                        "spring data",
                        "programming languages",
                        "deep learning",
                        "neural networks",
                        "object oriented programming",
                        "technical skills",
                        "coding profile",
                        "personal desktop assistant",
                        "weather application",
                        "data structures",
                        "artificial intelligence"
                );

        for (String item : garbage) {
            if (lower.equals(item)) {
                return true;
            }
        }

        return value.length() > 80;
    }

    private String extractOrganizations(String text) {

        if (text == null || text.isBlank()) {
            return "";
        }

        Set<String> organizations =
                new LinkedHashSet<>();

        String[] sentences =
                text.split(
                        "(?<=[.!?])\\s+|\\s{2,}"
                );

        for (String sentence : sentences) {

            String cleaned =
                    sentence.trim();

            if (cleaned.isBlank()) {
                continue;
            }

            String lower =
                    cleaned.toLowerCase(
                            Locale.ROOT
                    );

            for (String suffix :
                    ORGANIZATION_SUFFIXES) {

                if (lower.contains(
                        suffix
                )) {

                    String candidate =
                            cleanOrganizationCandidate(
                                    cleaned
                            );

                    if (!candidate.isBlank()
                            && candidate.length() <= 150) {

                        organizations.add(
                                candidate
                        );

                        break;
                    }
                }
            }

            if (organizations.size() >= 20) {
                break;
            }
        }

        return String.join(
                ", ",
                organizations
        );
    }

    private String cleanOrganizationCandidate(
            String value) {

        String cleaned =
                value
                        .replaceAll(
                                "[•|]+",
                                " "
                        )
                        .replaceAll(
                                "\\s+",
                                " "
                        )
                        .trim();

        if (cleaned.contains(":")) {
            String[] parts =
                    cleaned.split(
                            ":",
                            2
                    );

            if (parts.length == 2) {
                cleaned =
                        parts[1].trim();
            }
        }

        if (cleaned.length() > 120) {
            String[] words =
                    cleaned.split("\\s+");

            StringBuilder result =
                    new StringBuilder();

            for (String word : words) {

                if (result.length() > 0) {
                    result.append(" ");
                }

                result.append(word);

                if (result.length() >= 120) {
                    break;
                }
            }

            cleaned =
                    result.toString();
        }

        return cleaned;
    }

    public Optional<DocumentIntelligence> getIntelligence(
            Long documentId) {

        return intelligenceRepository
                .findByDocumentId(documentId);
    }

    @Transactional
    public void deleteIntelligence(
            Long documentId) {

        intelligenceRepository
                .deleteByDocumentId(documentId);
    }
}


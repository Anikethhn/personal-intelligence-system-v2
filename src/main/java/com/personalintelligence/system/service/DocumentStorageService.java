package com.personalintelligence.system.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.crypto.Cipher;
import javax.crypto.CipherInputStream;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;

import java.io.InputStream;
import java.io.OutputStream;
import java.nio.file.*;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.UUID;

@Service
public class DocumentStorageService {

    private static final int IV_LENGTH = 12;
    private static final int TAG_LENGTH = 128;

    private final Path storageDirectory;
    private final SecretKeySpec encryptionKey;

    public DocumentStorageService(
            @Value("${pids.documents.storage-path}")
            String storagePath,

            @Value("${pids.documents.encryption-key}")
            String encodedKey) {

        this.storageDirectory =
                Paths.get(storagePath)
                        .toAbsolutePath()
                        .normalize();

        byte[] keyBytes =
                Base64.getDecoder().decode(encodedKey);

        if (keyBytes.length != 32) {
            throw new IllegalArgumentException(
                    "Document encryption key must be exactly 256 bits"
            );
        }

        this.encryptionKey =
                new SecretKeySpec(
                        keyBytes,
                        "AES"
                );

        try {

            Files.createDirectories(
                    this.storageDirectory
            );

        } catch (Exception e) {

            throw new IllegalStateException(
                    "Unable to initialize document storage",
                    e
            );
        }
    }


    public String store(MultipartFile file) {

        String storageFilename =
                UUID.randomUUID() + ".pids";

        Path destination =
                resolveSafePath(storageFilename);

        byte[] iv =
                new byte[IV_LENGTH];

        new SecureRandom().nextBytes(iv);


        try {

            Cipher cipher =
                    Cipher.getInstance(
                            "AES/GCM/NoPadding"
                    );

            cipher.init(
                    Cipher.ENCRYPT_MODE,
                    encryptionKey,
                    new GCMParameterSpec(
                            TAG_LENGTH,
                            iv
                    )
            );


            try (
                    InputStream input =
                            file.getInputStream();

                    OutputStream output =
                            Files.newOutputStream(
                                    destination,
                                    StandardOpenOption.CREATE_NEW
                            )
            ) {

                /*
                 * Store the IV at the beginning of
                 * the encrypted file.
                 *
                 * IV is not secret.
                 */
                output.write(iv);

                try (
                        CipherInputStream encryptedInput =
                                new CipherInputStream(
                                        input,
                                        cipher
                                )
                ) {

                    byte[] buffer =
                            new byte[8192];

                    int bytesRead;

                    while (
                            (bytesRead =
                                    encryptedInput.read(buffer))
                                    != -1
                    ) {

                        output.write(
                                buffer,
                                0,
                                bytesRead
                        );
                    }
                }
            }

            return storageFilename;

        } catch (Exception e) {

            try {
                Files.deleteIfExists(destination);
            } catch (Exception ignored) {
            }

            throw new IllegalStateException(
                    "Unable to securely store document",
                    e
            );
        }
    }


    public InputStream openDecryptedStream(
            String storageFilename) {

        Path path =
                resolveSafePath(storageFilename);

        try {

            InputStream input =
                    Files.newInputStream(path);

            byte[] iv =
                    input.readNBytes(IV_LENGTH);

            if (iv.length != IV_LENGTH) {

                input.close();

                throw new IllegalStateException(
                        "Invalid encrypted document"
                );
            }


            Cipher cipher =
                    Cipher.getInstance(
                            "AES/GCM/NoPadding"
                    );

            cipher.init(
                    Cipher.DECRYPT_MODE,
                    encryptionKey,
                    new GCMParameterSpec(
                            TAG_LENGTH,
                            iv
                    )
            );


            return new CipherInputStream(
                    input,
                    cipher
            );

        } catch (Exception e) {

            throw new IllegalStateException(
                    "Unable to open document",
                    e
            );
        }
    }


    public void delete(String storageFilename) {

        Path path =
                resolveSafePath(storageFilename);

        try {

            Files.deleteIfExists(path);

        } catch (Exception e) {

            throw new IllegalStateException(
                    "Unable to delete document",
                    e
            );
        }
    }


    private Path resolveSafePath(
            String storageFilename) {


        Path resolved =
                storageDirectory
                        .resolve(storageFilename)
                        .normalize();

        if (!resolved.startsWith(storageDirectory)) {

            throw new SecurityException(
                    "Invalid document storage path"
            );
        }

        return resolved;
    }
}


const API_BASE_URL = "";


const togglePassword =
    document.getElementById("togglePassword");

if (togglePassword) {

    togglePassword.addEventListener("click", () => {

        const password =
            document.getElementById("password");

        if (!password) {
            return;
        }

        if (password.type === "password") {

            password.type = "text";

            togglePassword.textContent = "Hide";

        } else {

            password.type = "password";

            togglePassword.textContent = "Show";
        }
    });
}


const loginForm =
    document.getElementById("loginForm");

if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();

            const emailElement =
                document.getElementById("email");

            const passwordElement =
                document.getElementById("password");

            const errorElement =
                document.getElementById("loginError");

            if (!emailElement || !passwordElement) {
                return;
            }

            const email =
                emailElement.value.trim();

            const password =
                passwordElement.value;

            if (errorElement) {

                errorElement.style.display = "none";

                errorElement.textContent = "";
            }



            if (!email || !password) {

                if (errorElement) {

                    errorElement.textContent =
                        "Please enter your email and password.";

                    errorElement.style.display = "block";
                }

                return;
            }


            try {

                const response =
                    await fetch(
                        `${API_BASE_URL}/api/auth/login`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({
                                email: email,
                                password: password
                            })
                        }
                    );


                const result =
                    await response.text();


                if (!response.ok) {

                    throw new Error(
                        result ||
                        "Invalid email or password."
                    );
                }

                const token =
                    result.trim();


                if (!token) {

                    throw new Error(
                        "Login failed. No authentication token received."
                    );
                }


                localStorage.setItem(
                    "pids_token",
                    token
                );

                window.location.href =
                    "/dashboard.html";


            } catch (error) {

                console.error(
                    "NORA login error:",
                    error
                );


                if (errorElement) {

                    errorElement.textContent =
                        error.message ||
                        "Unable to login. Please try again.";

                    errorElement.style.display =
                        "block";
                }
            }
        }
    );
}


const registerForm =
    document.getElementById("registerForm");

if (registerForm) {

    registerForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            const errorElement =
                document.getElementById("registerError");


            if (errorElement) {

                errorElement.style.display =
                    "none";

                errorElement.textContent = "";
            }


            const nameElement =
                document.getElementById("name");

            const emailElement =
                document.getElementById("email");

            const passwordElement =
                document.getElementById("password");

            const phoneElement =
                document.getElementById("phone");

            const dateOfBirthElement =
                document.getElementById("dateOfBirth");

            const occupationElement =
                document.getElementById("occupation");

            const cityElement =
                document.getElementById("city");

            const bioElement =
                document.getElementById("bio");


            const name =
                nameElement
                    ? nameElement.value.trim()
                    : "";

            const email =
                emailElement
                    ? emailElement.value.trim()
                    : "";

            const password =
                passwordElement
                    ? passwordElement.value
                    : "";

            const phone =
                phoneElement
                    ? phoneElement.value.trim()
                    : "";

            const dateOfBirth =
                dateOfBirthElement
                    ? dateOfBirthElement.value
                    : "";

            const occupation =
                occupationElement
                    ? occupationElement.value.trim()
                    : "";

            const city =
                cityElement
                    ? cityElement.value.trim()
                    : "";

            const bio =
                bioElement
                    ? bioElement.value.trim()
                    : "";


            if (!name) {

                showRegisterError(
                    "Please enter your name."
                );

                return;
            }


            if (!email) {

                showRegisterError(
                    "Please enter your email."
                );

                return;
            }


            if (!password) {

                showRegisterError(
                    "Please enter a password."
                );

                return;
            }


            if (password.length < 6) {

                showRegisterError(
                    "Password must contain at least 6 characters."
                );

                return;
            }


            try {


                const response =
                    await fetch(
                        `${API_BASE_URL}/api/auth/register`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({

                                name: name,

                                email: email,

                                password: password,

                                phone:
                                    phone || null,

                                dateOfBirth:
                                    dateOfBirth || null,

                                occupation:
                                    occupation || null,

                                city:
                                    city || null,

                                bio:
                                    bio || null
                            })
                        }
                    );


                const result =
                    await response.text();

                if (!response.ok) {

                    throw new Error(
                        result ||
                        "Registration failed."
                    );
                }


                alert(
                    "NORA account created successfully!"
                );


                window.location.href =
                    "/login.html";


            } catch (error) {

                console.error(
                    "NORA registration error:",
                    error
                );


                showRegisterError(
                    error.message ||
                    "Unable to create your NORA account."
                );
            }
        }
    );
}


function showRegisterError(message) {

    const errorElement =
        document.getElementById("registerError");

    if (!errorElement) {
        return;
    }

    errorElement.textContent =
        message;

    errorElement.style.display =
        "block";
}


function logout() {

    localStorage.removeItem(
        "pids_token"
    );

    window.location.href =
        "/login.html";
}


function getAuthToken() {

    return localStorage.getItem(
        "pids_token"
    );
}



async function authenticatedFetch(
    url,
    options = {}
) {

    const token =
        getAuthToken();


    const headers = {
        ...(options.headers || {})
    };


    if (token) {

        headers["Authorization"] =
            `Bearer ${token}`;
    }


    return fetch(
        url,
        {
            ...options,
            headers: headers
        }
    );
}
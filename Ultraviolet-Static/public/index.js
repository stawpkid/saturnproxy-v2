"use strict";
/**
 * @type {HTMLFormElement}
 */
const form = document.getElementById("uv-form");
/**
 * @type {HTMLInputElement}
 */
const address = document.getElementById("uv-address");
/**
 * @type {HTMLInputElement}
 */
const searchEngine = document.getElementById("uv-search-engine");
/**
 * @type {HTMLParagraphElement}
 */
const error = document.getElementById("uv-error");
/**
 * @type {HTMLPreElement}
 */
const errorCode = document.getElementById("uv-error-code");
const connection = new BareMux.BareMuxConnection("/baremux/worker.js")

form.addEventListener("submit", async (event) => {
	event.preventDefault();

	try {
		await registerSW();
	} catch (err) {
		error.textContent = "Failed to register service worker.";
		errorCode.textContent = err.toString();
		throw err;
	}

	const url = search(address.value, searchEngine.value);

    let frame = document.getElementById("uv-frame");
    frame.style.display = "none";
    let loadingframe = document.getElementById("loading-frame");
    loadingframe.style.display = "block";
    loadingframe.src = "/loading.html";
	let wispUrl = (location.protocol === "https:" ? "wss" : "ws") + "://" + location.host + "/wisp/";
	if (await connection.getTransport() !== "/epoxy/index.mjs") {
		await connection.setTransport("/epoxy/index.mjs", [{ wisp: wispUrl }]);
	}
    frame.src = __uv$config.prefix + __uv$config.encodeUrl(url);
    setTimeout(() => {
            window.location.replace(__uv$config.prefix + __uv$config.encodeUrl(url));
    }, 2000);
});
document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM fully loaded");
    const input = document.getElementById("uv-address");
    const suggestionsList = document.getElementById("suggestions");
    const form = document.getElementById("uv-form");
    const proxySuggestionAPI = "https://proxyforsug.blitzedzzontoppoihsblitzedzzontoppoihs.workers.dev/?q=";

    async function fetchSuggestions(query) {
        console.log("Fetching suggestions for query:", query);
        if (!query) {
            suggestionsList.innerHTML = "";
            return;
        }
        try {
            let res = await fetch(proxySuggestionAPI + encodeURIComponent(query));
            let data = await res.json();
            let suggestions = data[1] || [];
            console.log("Fetched suggestions:", suggestions);
            renderSuggestions(suggestions);
        } catch (err) {
            console.error("Suggestion fetch failed:", err);
        }
    }

    function renderSuggestions(suggestions) {
        suggestionsList.innerHTML = "";
        if (!suggestions.length) {
            console.log("No suggestions to render");
            return;
        }

        suggestions.forEach(s => {
            let li = document.createElement("li");
            li.textContent = s;
            li.addEventListener("click", () => {
                console.log("Suggestion clicked:", s);
                input.value = s;
                suggestionsList.innerHTML = "";
                submitProxySearch();
            });
            suggestionsList.appendChild(li);
        });
    }

    input.addEventListener("input", () => {
        console.log("Input changed:", input.value);
        fetchSuggestions(input.value);
    });

    input.addEventListener("blur", () => {
        setTimeout(() => {
            suggestionsList.innerHTML = "";
            console.log("Suggestions cleared on blur");
        }, 200);
    });

    async function submitProxySearch() {
        console.log("Submitting proxy search for:", input.value);
        try {
            await registerSW();
            console.log("Service worker registered for proxy search");
        } catch (err) {
            error.textContent = "Failed to register service worker.";
            errorCode.textContent = err.toString();
            console.error("SW registration failed during proxy search:", err);
            throw err;
        }

        document.querySelectorAll(".suggestions-list").forEach(el => el.style.display = "none");

        const url = search(input.value, searchEngine.value);
        console.log("Proxy search URL:", url);

        let frame = document.getElementById("uv-frame");
        frame.style.display = "none";
        let loadingframe = document.getElementById("loading-frame");
        loadingframe.style.display = "block";
        loadingframe.src = "/loading.html";

        let wispUrl = (location.protocol === "https:" ? "wss" : "ws") + "://" + location.host + "/wisp/";
        if (await connection.getTransport() !== "/epoxy/index.mjs") {
            await connection.setTransport("/epoxy/index.mjs", [{ wisp: wispUrl }]);
        }
        frame.src = __uv$config.prefix + __uv$config.encodeUrl(url);
        setTimeout(() => {
            window.location.replace(__uv$config.prefix + __uv$config.encodeUrl(url));

        }, 2000);
        console.log("Iframe src updated for proxy search:", frame.src);
    }

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        console.log("Form submitted from DOMContentLoaded event");
        submitProxySearch().catch(err => console.error("Proxy search submit error:", err));
    });
});